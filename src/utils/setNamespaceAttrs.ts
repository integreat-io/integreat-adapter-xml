import { isObject, isDate } from './is.js'
import type { ObjectElement, ElementValue, Namespaces } from '../types.js'

interface PrefixParents {
  [key: string]: ObjectElement
}

function extractPrefix(key: string) {
  const index = key.indexOf(':')
  return index >= 0 ? key.slice(0, index) : ''
}

const isNode = (
  entry: [string, unknown]
): entry is [string, ObjectElement | ObjectElement[]] =>
  Array.isArray(entry[1]) || isObject(entry[1])

const isAttribute = (entry: [string, unknown]): entry is [string, string] =>
  entry[0][0] === '@' // First char of key

const setChildrenOrParent = (
  parents: PrefixParents,
  children: PrefixParents,
  parent: ObjectElement
) =>
  Object.entries(children).reduce(
    (prefixParentes, [prefix, child]) => ({
      ...prefixParentes,
      // eslint-disable-next-line security/detect-object-injection
      [prefix]: prefixParentes[prefix] === undefined ? child : parent,
    }),
    parents
  )

function getPrefixesFromArray(
  data: ObjectElement[],
  prefixes: string[],
  parent: ObjectElement
) {
  return data
    .map((element) => getPrefixParents(element, prefixes))
    .reduce(
      (prefixParents, prefixChildren) =>
        setChildrenOrParent(prefixParents, prefixChildren, parent),
      {}
    )
}

const findLocalPrefixes = (
  key: string,
  nodes: [string, string | ElementValue][]
) => [
  extractPrefix(key),
  ...nodes
    .filter(isAttribute)
    .map(([key]) => extractPrefix(key.slice(1)))
    .filter(Boolean),
]

const findPrefixParents = (
  prefixes: string[],
  data: ObjectElement<ElementValue>
) =>
  prefixes.reduce(
    (parents, prefix) => ({ ...parents, [prefix]: data }),
    {} as PrefixParents
  )

const findParents = (
  nodes: [string, string | ElementValue][],
  prefixes: string[],
  data: ObjectElement<ElementValue>
) => nodes.filter(isNode).map(getPrefixesFromElement(prefixes, data))

const setChildOrParentOnPrefix = (
  parents: PrefixParents[],
  data: ObjectElement<ElementValue>,
  localPrefixParents: PrefixParents
) =>
  parents.reduce(
    (prefixParents, prefixChildren) =>
      setChildrenOrParent(prefixParents, prefixChildren, data),
    localPrefixParents
  )

// Find the relevant namespaces for an element
const getPrefixesFromElement =
  (prefixes: string[], parent: ObjectElement) =>
  ([key, data]: [string, ObjectElement | ObjectElement[]]): PrefixParents => {
    if (Array.isArray(data)) {
      return getPrefixesFromArray(data, prefixes, parent)
    }

    const childNodes = Object.entries(data)
    const localPrefixes = findLocalPrefixes(key, childNodes)
    const localPrefixParents = findPrefixParents(localPrefixes, data)
    const nextPrefixes = prefixes.filter((pre) => !localPrefixes.includes(pre))
    if (nextPrefixes.length === 0) {
      return localPrefixParents // Stop when there are no more prefixes to find
    }
    const parents = findParents(childNodes, nextPrefixes, data)
    return setChildOrParentOnPrefix(parents, data, localPrefixParents)
  }

// Walk the data structure and return an object with namespace prefixes as keys
// and the element where we need to set the define the namespace as value. This
// may be the first element that uses a namespace, or the parent of two or more
// elements that uses it. Our goal is to define the namespace as close to where
// it is used as possible, but never more than once.
function getPrefixParents(data: ObjectElement, prefixes: string[]) {
  const children = Object.entries(data).filter(isNode)
  return children.map(getPrefixesFromElement(prefixes, data)).reduce(
    (prefixParents, prefixChild) => ({
      ...prefixChild,
      ...prefixParents,
    }),
    {}
  )
}

// Go through the elements that we identified as the signle parent closest to
// where a namespace is used, and set the appropriate xmlns attributes.
function setAttrs(prefixParents: PrefixParents, namespaces: Namespaces) {
  Object.entries(prefixParents).forEach(([prefix, element]) => {
    // eslint-disable-next-line security/detect-object-injection
    const uri = namespaces[prefix]
    if (prefix) {
      element[`@xmlns:${prefix}`] = uri
    } else if (uri) {
      element['@xmlns'] = uri
    }
  })
}

// Format dates as ISO dates and force anything else to string
const formatValue = (value: unknown) =>
  isDate(value) ? value.toISOString() : String(value)

// Iterates an array and makes its leaves ready for stringification.
function fixLeavesInArray(
  key: string,
  value: unknown[],
  xsiNs: string,
  treatNullAsEmpty: boolean
) {
  if (value.length === 1) {
    return fixLeavesInValue(key, value[0], xsiNs, treatNullAsEmpty)
  }
  return value.flatMap((val) =>
    fixLeavesInValue(key, val, xsiNs, treatNullAsEmpty)
  ) as string | ElementValue
}

// Sets nil attr for `null` values, formats attributes and leaf values, and
// traverses anything else.
function fixLeavesInValue(
  key: string,
  value: unknown,
  xsiNs: string,
  treatNullAsEmpty: boolean
): string | ElementValue {
  if (value === null) {
    return treatNullAsEmpty ? { $value: null } : { [`@${xsiNs}:nil`]: 'true' }
  } else if (Array.isArray(value)) {
    return fixLeavesInArray(key, value, xsiNs, treatNullAsEmpty)
  } else if (key[0] === '@') {
    return formatValue(isObject(value) ? value.$value : value)
  } else if (isObject(value)) {
    return fixLeavesInElement(value, xsiNs, treatNullAsEmpty)
  } else {
    return key === '$value'
      ? formatValue(value)
      : { $value: formatValue(value) }
  }
}

// Iterate the keys of an element and make sure the leaves are ready for being
// stringified. When a key is not a leaf, it traverses down to the leaves.
function fixLeavesInElement(
  data: ObjectElement<unknown>,
  xsiNs: string,
  treatNullAsEmpty: boolean
) {
  const element: ObjectElement = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      // eslint-disable-next-line security/detect-object-injection
      element[key] = fixLeavesInValue(key, value, xsiNs, treatNullAsEmpty)
    }
  }
  return element
}

// Run through data structure and set namespace attrs
export default function setNamespaceAttrs(
  data: ObjectElement<unknown>,
  namespaces: Namespaces,
  xsiNamespace: string,
  treatNullAsEmpty = false
): ObjectElement {
  const prefixes = Object.keys(namespaces)
  const value = fixLeavesInElement(data, xsiNamespace, treatNullAsEmpty)
  const prefixParents = getPrefixParents(value, prefixes)
  setAttrs(prefixParents, namespaces)
  return value
}

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

const getPrefixesFromElement =
  (prefixes: string[], parent: ObjectElement) =>
  ([key, data]: [string, ObjectElement | ObjectElement[]]): PrefixParents => {
    if (Array.isArray(data)) {
      return data
        .map((element) => getPrefixParents(element, prefixes))
        .reduce(
          (prefixParents, prefixChildren) =>
            setChildrenOrParent(prefixParents, prefixChildren, parent),
          {}
        )
    }

    const childNodes = Object.entries(data)
    const localPrefixes = [
      extractPrefix(key),
      ...childNodes
        .filter(isAttribute)
        .map(([key]) => extractPrefix(key.slice(1)))
        .filter(Boolean),
    ]
    const localPrefixParents = localPrefixes.reduce(
      (parents, prefix) => ({ ...parents, [prefix]: data }),
      {} as PrefixParents
    )
    const nextPrefixes = prefixes.filter((pre) => !localPrefixes.includes(pre))
    if (nextPrefixes.length === 0) {
      return localPrefixParents // Stop when there are no more prefixes to find
    }
    const parents = childNodes
      .filter(isNode)
      .map(getPrefixesFromElement(nextPrefixes, data))
    return parents.reduce(
      (prefixParents, prefixChildren) =>
        setChildrenOrParent(prefixParents, prefixChildren, data),
      localPrefixParents
    )
  }

function getPrefixParents(data: ObjectElement, prefixes: string[]) {
  const children = Object.entries(data).filter(isNode)
  return children
    .map((child) => getPrefixesFromElement(prefixes, data)(child))
    .reduce(
      (prefixParents, prefixChild) => ({
        ...prefixChild,
        ...prefixParents,
      }),
      {}
    )
}

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

const formatValue = (value: unknown) =>
  isDate(value) ? value.toISOString() : String(value)

function fixLeavesInArray(key: string, value: unknown[], xsiNs: string) {
  if (value.length === 1) {
    return fixLeavesInValue(key, value[0], xsiNs)
  }
  return value.flatMap((val) => fixLeavesInValue(key, val, xsiNs)) as
    | string
    | ElementValue
}

function fixLeavesInValue(
  key: string,
  value: unknown,
  xsiNs: string
): string | ElementValue {
  if (value === null) {
    return { [`@${xsiNs}:nil`]: 'true' }
  } else if (Array.isArray(value)) {
    return fixLeavesInArray(key, value, xsiNs)
  } else if (key[0] === '@') {
    return formatValue(isObject(value) ? value.$value : value)
  } else if (isObject(value)) {
    return fixLeavesInElement(value, xsiNs)
  } else {
    return key === '$value'
      ? formatValue(value)
      : { $value: formatValue(value) }
  }
}

function fixLeavesInElement(data: ObjectElement<unknown>, xsiNs: string) {
  const element: ObjectElement = {}
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      // eslint-disable-next-line security/detect-object-injection
      element[key] = fixLeavesInValue(key, value, xsiNs)
    }
  }
  return element
}

export default function setNamespaceAttrs(
  data: ObjectElement<unknown>,
  namespaces: Namespaces,
  xsiNamespace: string
): ObjectElement {
  const prefixes = Object.keys(namespaces)
  const value = fixLeavesInElement(data, xsiNamespace)
  const prefixParents = getPrefixParents(value, prefixes)
  setAttrs(prefixParents, namespaces)
  return value
}

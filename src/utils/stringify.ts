import { encode } from 'html-entities'
import { addSoapEnvelope } from './soapEnvelope.js'
import setNamespaces from './setNamespaces.js'
import setNamespaceAttrs from './setNamespaceAttrs.js'
import { isObject, isDate } from './is.js'
import type { ObjectElement, ElementValue, Namespaces } from '../types.js'

type KeyElement = [string, ElementValue | string]

const isObjectElement = (data: unknown): data is ObjectElement => isObject(data)

const encodingOptions = {
  level: 'xml' as const,
  mode: 'nonAsciiPrintable' as const,
}

const stringifyValue = (value: unknown) =>
  isDate(value)
    ? value.toISOString()
    : value === null
    ? null
    : encode(String(value), encodingOptions)

const extractChildrenAndAttributes = (element: ObjectElement) =>
  Object.entries(element).reduce(
    ([children, attributes]: [KeyElement[], KeyElement[]], child: KeyElement) =>
      child[0].startsWith('@')
        ? [children, [...attributes, child]]
        : [[...children, child], attributes],
    [[], []]
  )

const removeAtAndSilentPrefix = (key: string) =>
  key[0] === '@' // Remove @ for attributes
    ? key.slice(0, 8) === '@xmlns:-' // If this is an xmlns attribute with silent prefix (starting with -), remove the prefix
      ? 'xmlns'
      : key.slice(1) // Remove @
    : key

const generateAttributesXml = (attributes: KeyElement[]) =>
  attributes
    .map(
      ([key, element]) =>
        `${removeAtAndSilentPrefix(key)}="${stringifyValue(element)}"`
    )
    .join(' ')

const removeSilentPrefix = (prefix: string) =>
  prefix[0] === '-' ? prefix.split(':')[1] : prefix

function generateElementXmlString(
  key: string,
  attributes: KeyElement[],
  childrenXml: string | null
) {
  const attrXml = generateAttributesXml(attributes)
  const elementName = removeSilentPrefix(key)
  return [
    `<${elementName}`,
    attrXml ? ` ${attrXml}` : '',
    childrenXml ? `>${childrenXml}</${elementName}>` : '/>',
  ].join('')
}

const generateElementXml = (key: string) =>
  function generateElementXml(element: ElementValue | string) {
    if (isObjectElement(element)) {
      const [children, attributes] = extractChildrenAndAttributes(element)
      return generateElementXmlString(key, attributes, xmlFromObject(children))
    } else {
      return generateElementXmlString(key, [], stringifyValue(element))
    }
  }

function generateElementsXml([key, element]: [string, ElementValue | string]) {
  if (key === '$value') {
    return stringifyValue(element)
  }
  const generate = generateElementXml(key)
  return Array.isArray(element)
    ? element.map(generate).join('')
    : generate(element)
}

const xmlFromObject = (elements: KeyElement[]): string =>
  elements.map(generateElementsXml).join('')

function generateXml(data: ObjectElement, hideXmlDirective: boolean) {
  const xml = xmlFromObject(Object.entries(data))
  return hideXmlDirective ? xml : `<?xml version="1.0" encoding="utf-8"?>${xml}`
}

export default function stringify(
  data: unknown,
  namespaces: Namespaces = {},
  hideXmlDirective = false,
  soapVersion?: string,
  defaultSoapPrefix?: string,
  hideSoapEnvelope = true
) {
  const {
    namespaces: allNamespaces,
    xsiPrefix,
    soapPrefix,
  } = setNamespaces(namespaces, soapVersion, defaultSoapPrefix)

  const obj = Array.isArray(data) && data.length === 1 ? data[0] : data
  const normalized =
    hideSoapEnvelope && soapVersion ? addSoapEnvelope(obj, soapPrefix) : obj

  const serialized = isObjectElement(normalized)
    ? generateXml(
        setNamespaceAttrs(normalized, allNamespaces, xsiPrefix),
        hideXmlDirective
      )
    : undefined

  return {
    xsiPrefix,
    soapPrefix,
    data: serialized,
    normalized,
  }
}

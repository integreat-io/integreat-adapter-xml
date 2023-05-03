import { encode } from 'html-entities'
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

const removeAt = (key: string) => (key[0] === '@' ? key.slice(1) : key)

const generateAttributesXml = (attributes: KeyElement[]) =>
  attributes
    .map(([key, element]) => `${removeAt(key)}="${stringifyValue(element)}"`)
    .join(' ')

function generateElementXmlString(
  key: string,
  attributes: KeyElement[],
  childrenXml: string | null
) {
  const attrXml = generateAttributesXml(attributes)
  return [
    `<${key}`,
    attrXml ? ` ${attrXml}` : '',
    childrenXml ? `>${childrenXml}</${key}>` : '/>',
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

const generateXml = (data: ObjectElement) =>
  `<?xml version="1.0" encoding="utf-8"?>${xmlFromObject(Object.entries(data))}`

function addSoapEnvelope(data: unknown, soapPrefix: string) {
  if (isObject(data)) {
    const { body, header } = data
    if (isObject(body)) {
      return {
        [`${soapPrefix}:Envelope`]: {
          ...(isObject(header) ? { [`${soapPrefix}:Header`]: header } : {}),
          [`${soapPrefix}:Body`]: body,
        },
      }
    }
  }
  return data
}

export default function stringify(
  data: unknown,
  namespaces: Namespaces = {},
  soapVersion?: string,
  hideSoapEnvelope = false
) {
  const {
    namespaces: allNamespaces,
    xsiPrefix,
    soapPrefix,
  } = setNamespaces(namespaces, soapVersion)

  const obj = Array.isArray(data) && data.length === 1 ? data[0] : data
  const normalized =
    hideSoapEnvelope && soapVersion ? addSoapEnvelope(obj, soapPrefix) : obj

  const serialized = isObjectElement(normalized)
    ? generateXml(setNamespaceAttrs(normalized, allNamespaces, xsiPrefix))
    : undefined

  return {
    xsiPrefix,
    soapPrefix,
    data: serialized,
  }
}

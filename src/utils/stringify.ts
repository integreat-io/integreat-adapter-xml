import { encode } from 'html-entities'
import { addSoapEnvelope } from './soapEnvelope.js'
import setNamespaces from './setNamespaces.js'
import setNamespaceAttrs from './setNamespaceAttrs.js'
import { isObject, isDate } from './is.js'
import type { ObjectElement, ElementValue, Namespaces } from '../types.js'

export interface StringifyOptions {
  namespaces?: Namespaces
  hideXmlDirective?: boolean
  soapVersion?: string
  soapPrefix?: string
  hideSoapEnvelope?: boolean
  dontDoubleEncode?: boolean
  treatNullAsEmpty?: boolean
}

type KeyElement = [string, ElementValue | string]

const isObjectElement = (data: unknown): data is ObjectElement => isObject(data)

const encodingOptions = {
  level: 'xml' as const,
  mode: 'nonAsciiPrintable' as const,
}

const stringifyValue = (value: unknown) =>
  value === null || value === undefined
    ? null
    : isDate(value)
    ? value.toISOString()
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

// Replaces &amp; with & when it is part of a character entity. Supports both
// named and numeric entities.
function removeDoubleEncoding(xml: string) {
  return xml.replace(/&amp;([a-z]+|#[0-9]+);/gi, '&$1;')
}

function generateXml(
  data: ObjectElement,
  hideXmlDirective: boolean,
  dontDoubleEncode: boolean
) {
  let xml = xmlFromObject(Object.entries(data))
  if (dontDoubleEncode) {
    xml = removeDoubleEncoding(xml)
  }
  return hideXmlDirective ? xml : `<?xml version="1.0" encoding="utf-8"?>${xml}`
}

export default function stringify(
  data: unknown,
  {
    namespaces = {},
    hideXmlDirective = false,
    soapVersion,
    soapPrefix: defaultSoapPrefix,
    hideSoapEnvelope = true,
    dontDoubleEncode = false,
    treatNullAsEmpty = false,
  }: StringifyOptions
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
        setNamespaceAttrs(
          normalized,
          allNamespaces,
          xsiPrefix,
          treatNullAsEmpty
        ),
        hideXmlDirective,
        dontDoubleEncode
      )
    : undefined

  return {
    xsiPrefix,
    soapPrefix,
    data: serialized,
    normalized,
  }
}

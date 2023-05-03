/* eslint-disable security/detect-object-injection */
import { Namespaces } from '../types.js'
import { extractBody } from './soapEnvelope.js'
import { isObject } from './is.js'

const extractElementName = (body: Record<string, unknown>) =>
  Object.keys(body)[0]

const splitPrefixAndName = (elementName: string) => {
  const [prefix, name] = elementName.split(':')
  return name ? { prefix, name } : { prefix: '', name: prefix }
}

const ensureTrailingSlash = (url?: string) =>
  typeof url === 'string' && !url.endsWith('/') ? `${url}/` : url

export default function generateSoapAction(
  data: unknown,
  soapPrefix: string,
  namespaces: Namespaces = {},
  actionNamespace?: string
): string | undefined {
  const body = extractBody(data, soapPrefix)
  if (!isObject(body)) {
    return undefined
  }

  const elementName = extractElementName(body)
  const { prefix, name } = splitPrefixAndName(elementName)
  const namespace = ensureTrailingSlash(actionNamespace || namespaces[prefix])
  return namespace ? `${namespace}${name}` : undefined
}

import { isObject } from './is.js'
import type { Namespaces, ObjectElement } from '../types.js'

export const namespaceFromSoapVersion = (version?: string) =>
  version === '1.2'
    ? 'http://www.w3.org/2003/05/soap-envelope'
    : version === '1.1'
    ? 'http://schemas.xmlsoap.org/soap/envelope/'
    : undefined

export function extractEnvelope(data: unknown, soapPrefix: string) {
  if (isObject(data)) {
    return data[`${soapPrefix}:Envelope`]
  }
  return undefined
}

export function extractBody(data: unknown, soapPrefix: string) {
  const envelope = extractEnvelope(data, soapPrefix)
  if (isObject(envelope)) {
    return envelope[`${soapPrefix}:Body`]
  }
  return undefined
}

export function addSoapEnvelope(data: unknown, soapPrefix: string) {
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

export function removeSoapEnvelope(
  data: ObjectElement | undefined,
  soapVersion: string,
  namespaces: Namespaces
) {
  const soapNamespace = namespaceFromSoapVersion(soapVersion)
  if (soapNamespace) {
    // eslint-disable-next-line security/detect-object-injection
    const soapPrefix = namespaces[soapNamespace] || 'soap'
    const envelope = extractEnvelope(data, soapPrefix)
    if (isObject(envelope)) {
      const body = envelope[`${soapPrefix}:Body`]
      if (isObject(body)) {
        const header = envelope[`${soapPrefix}:Header`]
        return {
          body,
          ...(isObject(header) ? { header } : {}),
        }
      }
    }
  }
  return data
}

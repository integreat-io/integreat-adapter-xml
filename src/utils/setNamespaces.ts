import { namespaceFromSoapVersion } from './soapEnvelope.js'
import type { Namespaces } from '../types.js'

const XSI_NAMESPACE = 'http://www.w3.org/2001/XMLSchema-instance'

function getPrefix(namespaces: Namespaces, namespace?: string) {
  if (!namespace) {
    return undefined
  }
  const xsiEntry = Object.entries(namespaces).find(
    ([_key, uri]) => uri === namespace
  )
  return xsiEntry ? xsiEntry[0] : undefined
}

export default function setNamespaces(
  namespaces: Namespaces,
  soapVersion?: string,
  defaultSoapPrefix = 'soap'
) {
  const xsiPrefix = getPrefix(namespaces, XSI_NAMESPACE) || 'xsi'
  const soapNamespace = namespaceFromSoapVersion(soapVersion)
  const soapPrefix = getPrefix(namespaces, soapNamespace) || defaultSoapPrefix

  const nextNS = {
    ...namespaces,
    [xsiPrefix]: XSI_NAMESPACE,
    ...(soapNamespace ? { [soapPrefix]: soapNamespace } : {}),
  }

  return {
    namespaces: nextNS,
    xsiPrefix,
    soapPrefix,
  }
}

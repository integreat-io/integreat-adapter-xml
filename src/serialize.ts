import stringify from './utils/stringify.js'
import generateSoapAction from './utils/generateSoapAction.js'
import setActionData from './utils/setActionData.js'
import type { Action } from 'integreat'
import type { Options } from './index.js'

const contentTypeFromSoapVersion = (version?: string) =>
  version === '1.2'
    ? 'application/soap+xml;charset=utf-8'
    : 'text/xml;charset=utf-8'

const addActionToContentType = (contentType: string, soapAction: string) =>
  `${contentType};action="${soapAction}"`

const createPayloadHeaders = (
  contentType: string,
  soapVersion?: string,
  soapAction?: string
) => ({
  'content-type':
    soapAction && soapVersion === '1.2'
      ? addActionToContentType(contentType, soapAction)
      : contentType,
  ...(soapAction && soapVersion === '1.1' ? { SOAPAction: soapAction } : {}),
})

const createResponseHeaders = (contentType: string) => ({
  'content-type': contentType,
})

function generateHeaders(
  { soapVersion, soapAction, soapActionNamespace, namespaces }: Options,
  soapPrefix: string,
  data?: unknown
) {
  const contentType = contentTypeFromSoapVersion(soapVersion)
  const fullSoapAction = !soapAction
    ? undefined
    : typeof soapAction === 'string'
    ? soapAction
    : generateSoapAction(data, soapPrefix, namespaces, soapActionNamespace)

  return {
    payload: createPayloadHeaders(contentType, soapVersion, fullSoapAction),
    response: createResponseHeaders(contentType),
  }
}

export default async function serialize(action: Action, options: Options) {
  const {
    namespaces,
    soapVersion,
    soapPrefix: defaultSoapPrefix,
    hideSoapEnvelope,
    hideXmlDirective,
  } = options
  const { data: payloadData, normalized: payloadNormalized } = stringify(
    action.payload.data,
    namespaces,
    hideXmlDirective,
    soapVersion,
    defaultSoapPrefix,
    hideSoapEnvelope
  )
  const { data: responseData, soapPrefix } = stringify(
    action.response?.data,
    namespaces,
    hideXmlDirective,
    soapVersion,
    defaultSoapPrefix,
    hideSoapEnvelope
  )
  const headers = options.includeHeaders
    ? generateHeaders(options, soapPrefix, payloadNormalized) // Use the normalized data when getting soap action
    : undefined

  return setActionData(action, payloadData, responseData, headers)
}

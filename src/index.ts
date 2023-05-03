import parse from './utils/parse.js'
import stringify from './utils/stringify.js'
import generateSoapAction from './utils/generateSoapAction.js'
import type { Action, Adapter, Headers } from 'integreat'
import type { Namespaces } from './types.js'

export interface Options extends Record<string, unknown> {
  namespaces?: Namespaces
  includeHeaders?: boolean
  soapVersion?: string
  soapAction?: boolean | string
  soapActionNamespace?: string
}

const removeHeader = (headers: Headers, removeKey: string) =>
  Object.fromEntries(
    Object.entries(headers).filter(
      ([key]) => key.toLowerCase() !== removeKey.toLowerCase()
    )
  )

function setHeaders(headers: Headers = {}, target: Headers = {}) {
  const cleanTarget = Object.keys(headers).reduce(
    (target, key) => removeHeader(target, key),
    target
  )
  return {
    ...cleanTarget,
    ...headers,
  }
}

const contentTypeFromSoapVersion = (version?: string) =>
  version === '1.2'
    ? 'application/soap+xml;charset=utf-8'
    : 'text/xml;charset=utf-8'

const addActionToContentType = (contentType: string, soapAction: string) =>
  `${contentType};action="${soapAction}"`

function generateHeaders(
  { soapVersion, soapAction, soapActionNamespace, namespaces }: Options,
  soapPrefix: string,
  data?: unknown
) {
  const contentType = contentTypeFromSoapVersion(soapVersion)
  const fullSoapAction =
    typeof soapAction === 'string'
      ? soapAction
      : soapAction === true
      ? generateSoapAction(data, soapPrefix, namespaces, soapActionNamespace)
      : undefined
  return {
    payload: {
      'content-type':
        fullSoapAction && soapVersion === '1.2'
          ? addActionToContentType(contentType, fullSoapAction)
          : contentType,
      ...(fullSoapAction && soapVersion === '1.1'
        ? { SOAPAction: fullSoapAction }
        : {}),
    },
    response: {
      'content-type': contentType,
    },
  }
}

const setActionData = (
  action: Action,
  payloadData: unknown,
  responseData: unknown,
  headers?: { payload: Headers; response: Headers }
) => ({
  ...action,
  payload: {
    ...action.payload,
    ...(payloadData === undefined ? {} : { data: payloadData }),
    ...(headers && payloadData
      ? { headers: setHeaders(headers.payload, action.payload.headers) }
      : {}),
  },
  ...(action.response && {
    response: {
      ...action.response,
      ...(responseData === undefined ? {} : { data: responseData }),
      ...(headers && responseData
        ? {
            headers: setHeaders(headers.response, action.response.headers),
          }
        : {}),
    },
  }),
})

/**
 * XML adapter
 */
const adapter: Adapter = {
  prepareOptions(
    {
      includeHeaders = false,
      namespaces = {},
      soapVersion,
      soapActionNamespace,
    }: Options,
    _serviceId
  ) {
    return { includeHeaders, namespaces, soapVersion, soapActionNamespace }
  },

  async normalize(action, { namespaces }: Options) {
    const payloadData = parse(action.payload.data, namespaces)
    const responseData = parse(action.response?.data, namespaces)

    return setActionData(action, payloadData, responseData)
  },

  async serialize(action, options: Options) {
    const { namespaces, soapVersion } = options
    const { data: payloadData } = stringify(
      action.payload.data,
      namespaces,
      soapVersion
    )
    const { data: responseData, soapPrefix } = stringify(
      action.response?.data,
      namespaces,
      soapVersion
    )
    const headers = options.includeHeaders
      ? generateHeaders(options, soapPrefix, action.payload.data)
      : undefined

    return setActionData(action, payloadData, responseData, headers)
  },
}

export default adapter

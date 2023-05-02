import parse from './utils/parse.js'
import stringify from './utils/stringify.js'
import type { Action, Adapter } from 'integreat'
import { Namespaces } from './types.js'

export interface Options extends Record<string, unknown> {
  namespaces?: Namespaces
  includeHeaders?: boolean
}

const removeContentType = (headers: Record<string, string | string[]>) =>
  Object.fromEntries(
    Object.entries(headers).filter(
      ([key]) => key.toLowerCase() !== 'content-type'
    )
  )

const setContentType = (contentType: string, headers = {}) => ({
  ...removeContentType(headers),
  'content-type': contentType,
})

const setActionData = (
  action: Action,
  payloadData: unknown,
  responseData: unknown,
  contentType?: string
) => ({
  ...action,
  payload: {
    ...action.payload,
    ...(payloadData === undefined ? {} : { data: payloadData }),
    ...(contentType && payloadData
      ? { headers: setContentType(contentType, action.payload.headers) }
      : {}),
  },
  ...(action.response && {
    response: {
      ...action.response,
      ...(responseData === undefined ? {} : { data: responseData }),
      ...(contentType && responseData
        ? { headers: setContentType(contentType, action.response?.headers) }
        : {}),
    },
  }),
})

/**
 * XML adapter
 */
const adapter: Adapter = {
  prepareOptions(
    { includeHeaders = false, namespaces = {} }: Options,
    _serviceId
  ) {
    return { includeHeaders, namespaces }
  },

  async normalize(action, { namespaces }: Options) {
    const payloadData = parse(action.payload.data, namespaces)
    const responseData = parse(action.response?.data, namespaces)

    return setActionData(action, payloadData, responseData)
  },

  async serialize(action, { namespaces, includeHeaders = false }: Options) {
    const payloadData = stringify(action.payload.data, namespaces)
    const responseData = stringify(action.response?.data, namespaces)
    const contentType = includeHeaders ? 'text/xml;charset=utf-8' : undefined

    return setActionData(action, payloadData, responseData, contentType)
  },
}

export default adapter

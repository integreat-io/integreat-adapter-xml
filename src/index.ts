import parse from './utils/parse.js'
import stringify from './utils/stringify.js'
import type { Action, Adapter } from 'integreat'
import { Namespaces } from './types.js'
import { isObject } from './utils/is.js'

export interface Options extends Record<string, unknown> {
  namespaces?: Namespaces
  includeHeaders?: boolean
}

const setActionData = (
  action: Action,
  payloadData: unknown,
  responseData: unknown,
  headers?: Record<string, string | string[]>
) => ({
  ...action,
  payload: {
    ...action.payload,
    ...(payloadData === undefined ? {} : { data: payloadData }),
  },
  ...(action.response && {
    response: {
      ...action.response,
      ...(responseData === undefined ? {} : { data: responseData }),
    },
  }),
  meta: {
    ...action.meta,
    ...(headers
      ? isObject(action.meta?.headers)
        ? { headers: { ...action.meta?.headers, ...headers } }
        : { headers }
      : {}),
  },
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
    const headers = includeHeaders
      ? { 'Content-Type': 'text/xml;charset=utf-8' }
      : undefined

    return setActionData(action, payloadData, responseData, headers)
  },
}

export default adapter

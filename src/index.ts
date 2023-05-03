import serialize from './serialize.js'
import parse from './utils/parse.js'
import setActionData from './utils/setActionData.js'
import type { Adapter } from 'integreat'
import type { Namespaces } from './types.js'

export interface Options extends Record<string, unknown> {
  namespaces?: Namespaces
  includeHeaders?: boolean
  soapVersion?: string
  soapAction?: boolean | string
  soapActionNamespace?: string
}

/**
 * XML adapter
 */
const adapter: Adapter = {
  prepareOptions(
    {
      includeHeaders = false,
      namespaces = {},
      soapVersion,
      soapAction,
      soapActionNamespace,
    }: Options,
    _serviceId
  ) {
    return {
      includeHeaders,
      namespaces,
      soapVersion,
      soapAction,
      soapActionNamespace,
    }
  },

  async normalize(action, { namespaces }: Options) {
    const payloadData = parse(action.payload.data, namespaces)
    const responseData = parse(action.response?.data, namespaces)

    return setActionData(action, payloadData, responseData)
  },

  serialize,
}

export default adapter

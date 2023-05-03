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
  hideSoapEnvelope?: boolean
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
      hideSoapEnvelope = false,
    }: Options,
    _serviceId
  ) {
    return {
      includeHeaders,
      namespaces,
      soapVersion,
      soapAction,
      soapActionNamespace,
      hideSoapEnvelope,
    }
  },

  async normalize(
    action,
    { namespaces, soapVersion, hideSoapEnvelope }: Options
  ) {
    const payloadData = parse(
      action.payload.data,
      namespaces,
      soapVersion,
      hideSoapEnvelope
    )
    const responseData = parse(
      action.response?.data,
      namespaces,
      soapVersion,
      hideSoapEnvelope
    )

    return setActionData(action, payloadData, responseData)
  },

  serialize,
}

export default adapter

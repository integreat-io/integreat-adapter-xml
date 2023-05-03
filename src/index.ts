import serialize from './serialize.js'
import normalize from './normalize.js'
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
  normalize,
  serialize,
}

export default adapter

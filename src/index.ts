import serialize from './serialize.js'
import normalize from './normalize.js'
import type { Adapter } from 'integreat'
import type { Namespaces } from './types.js'

export interface Options extends Record<string, unknown> {
  namespaces?: Namespaces
  includeHeaders?: boolean
  soapVersion?: string
  soapPrefix?: string
  soapAction?: boolean | string
  soapActionNamespace?: string
  hideSoapEnvelope?: boolean
  hideXmlDirective?: boolean
  dontDoubleEncode?: boolean
}

/**
 * XML adapter
 */
const adapter: Adapter = {
  prepareOptions(
    {
      includeHeaders = true,
      namespaces = {},
      soapVersion,
      soapPrefix,
      soapAction,
      soapActionNamespace,
      hideSoapEnvelope = true,
      hideXmlDirective = false,
      dontDoubleEncode = false,
      treatNullAsEmpty = false,
    }: Options,
    _serviceId
  ) {
    return {
      includeHeaders,
      namespaces,
      soapVersion,
      soapPrefix,
      soapAction,
      soapActionNamespace,
      hideSoapEnvelope,
      hideXmlDirective,
      dontDoubleEncode,
      treatNullAsEmpty,
    }
  },
  normalize,
  serialize,
}

export default adapter

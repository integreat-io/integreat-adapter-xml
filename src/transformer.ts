import parse from './utils/parse.js'
import stringify from './utils/stringify.js'
import type { Transformer } from 'integreat'
import type { Namespaces } from './types.js'

export interface Props {
  namespaces?: Namespaces
  hideXmlDirective?: boolean
  soapVersion?: string
  soapPrefix?: string
  hideSoapEnvelope?: boolean
}

const transformer: Transformer =
  ({
    namespaces,
    soapVersion,
    soapPrefix: defaultSoapPrefix,
    hideXmlDirective = true,
    hideSoapEnvelope = true,
  }: Props) =>
  () =>
    function xml(data, state) {
      if (state.rev) {
        const { data: serialized } = stringify(
          data,
          namespaces,
          hideXmlDirective,
          soapVersion,
          defaultSoapPrefix,
          hideSoapEnvelope
        )
        return serialized
      } else {
        return parse(
          data,
          namespaces,
          soapVersion,
          defaultSoapPrefix,
          hideSoapEnvelope
        )
      }
    }
export default transformer

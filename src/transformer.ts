import parse from './utils/parse.js'
import stringify from './utils/stringify.js'
import type { Transformer } from 'integreat'
import type { Namespaces } from './types.js'

export interface Props {
  namespaces?: Namespaces
  soapVersion?: string
  hideXmlDirective?: boolean
}

const transformer: Transformer =
  ({ namespaces, soapVersion, hideXmlDirective = true }: Props) =>
  () =>
    function xml(data, state) {
      if (state.rev) {
        const { data: serialized } = stringify(
          data,
          namespaces,
          soapVersion,
          undefined,
          hideXmlDirective
        )
        return serialized
      } else {
        return parse(data, namespaces)
      }
    }
export default transformer

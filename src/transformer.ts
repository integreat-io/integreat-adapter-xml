import parse from './utils/parse.js'
import stringify from './utils/stringify.js'
import type { Transformer } from 'integreat'
import type { Namespaces } from './types.js'

export interface Props {
  namespaces?: Namespaces
  soapVersion?: string
}

const transformer: Transformer =
  ({ namespaces, soapVersion }: Props) =>
  () =>
    function xml(data, state) {
      if (state.rev) {
        const { data: serialized } = stringify(data, namespaces, soapVersion)
        return serialized
      } else {
        return parse(data, namespaces)
      }
    }
export default transformer

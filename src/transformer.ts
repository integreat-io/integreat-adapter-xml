import type { Transformer } from 'integreat'
import parse from './utils/parse.js'
import stringify from './utils/stringify.js'
import { Namespaces } from './types.js'

export interface Props {
  namespaces?: Namespaces
  soapVersion?: string
}

const transformer: Transformer =
  ({ namespaces, soapVersion }: Props) =>
  () =>
  (data, state) =>
    state.rev
      ? stringify(data, namespaces, soapVersion)
      : parse(data, namespaces)

export default transformer

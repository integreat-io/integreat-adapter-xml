import type { Transformer } from 'integreat'
import parse from './utils/parse.js'
import stringify from './utils/stringify.js'
import { Namespaces } from './types.js'

export interface Props {
  namespaces?: Namespaces
}

const transformer: Transformer =
  ({ namespaces }: Props) =>
  () =>
  (data, state) =>
    state.rev ? stringify(data, namespaces) : parse(data, namespaces)

export default transformer

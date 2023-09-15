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
  dontDoubleEncode?: boolean
  treatNullAsEmpty?: boolean
}

const optionsFromProps = (props: Props) => ({
  ...props,
  hideXmlDirective: props.hideXmlDirective ?? true,
})

const transformer: Transformer = (props: Props) => () =>
  function xml(data, state) {
    const options = optionsFromProps(props)
    const isRev = state.flip ? !state.rev : state.rev // Honor flip
    if (isRev) {
      const { data: serialized } = stringify(data, options)
      return serialized
    } else {
      return parse(data, options)
    }
  }
export default transformer

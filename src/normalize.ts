import parse from './utils/parse.js'
import setActionData from './utils/setActionData.js'
import type { Action } from 'integreat'
import type { Options } from './index.js'

export default async function normalize(action: Action, options: Options) {
  const payloadData = parse(action.payload.data, options)
  const responseData = parse(action.response?.data, options)

  return setActionData(action, payloadData, responseData)
}

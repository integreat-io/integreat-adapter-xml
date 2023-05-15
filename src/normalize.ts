import parse from './utils/parse.js'
import setActionData from './utils/setActionData.js'
import type { Action } from 'integreat'
import type { Options } from './index.js'

export default async function normalize(
  action: Action,
  {
    namespaces,
    soapVersion,
    hideSoapEnvelope,
    soapPrefix: defaultSoapPrefix,
  }: Options
) {
  const payloadData = parse(
    action.payload.data,
    namespaces,
    soapVersion,
    defaultSoapPrefix,
    hideSoapEnvelope
  )
  const responseData = parse(
    action.response?.data,
    namespaces,
    soapVersion,
    defaultSoapPrefix,
    hideSoapEnvelope
  )

  return setActionData(action, payloadData, responseData)
}

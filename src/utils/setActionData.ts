import type { Action, Headers, Payload, Response } from 'integreat'

const removeHeader = (headers: Headers, removeKey: string) =>
  Object.fromEntries(
    Object.entries(headers).filter(
      ([key]) => key.toLowerCase() !== removeKey.toLowerCase()
    )
  )

function setHeaders(headers: Headers = {}, target: Headers = {}) {
  const cleanTarget = Object.keys(headers).reduce(
    (target, key) => removeHeader(target, key),
    target
  )
  return {
    ...cleanTarget,
    ...headers,
  }
}

const setActionPayload = (
  payload: Payload,
  data: unknown,
  headers?: Headers
) => ({
  ...payload,
  ...(data === undefined ? {} : { data }),
  ...(headers && data ? { headers: setHeaders(headers, payload.headers) } : {}),
})

const setActionResponse = (
  response: Response,
  data: unknown,
  headers?: Headers
) => ({
  ...response,
  ...(data === undefined ? {} : { data }),
  ...(headers && data
    ? { headers: setHeaders(headers, response.headers) }
    : {}),
})

export default function setActionData(
  action: Action,
  payloadData: unknown,
  responseData: unknown,
  headers?: { payload: Headers; response: Headers }
) {
  return {
    ...action,
    payload: setActionPayload(action.payload, payloadData, headers?.payload),
    ...(action.response && {
      response: setActionResponse(
        action.response,
        responseData,
        headers?.response
      ),
    }),
  }
}

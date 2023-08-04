import type { Action, Headers, Payload, Response } from 'integreat'

const removeHeader = (headers: Headers, removeKey: string) =>
  Object.fromEntries(
    Object.entries(headers).filter(
      ([key]) => key.toLowerCase() !== removeKey.toLowerCase()
    )
  )

const getContentType = (headers: Headers) =>
  Object.entries(headers)
    .filter(([key]) => key.toLowerCase() === 'content-type')
    .map(([, value]) => value)[0]

function setHeaders(headers: Headers = {}, target: Headers = {}) {
  const contentType = getContentType(target) || headers['content-type']
  const cleanTarget = Object.keys(headers).reduce(
    (target, key) => removeHeader(target, key),
    target
  )
  return {
    ...cleanTarget,
    ...headers,
    'content-type': contentType,
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
  headers?: { payload: Headers; response: Headers },
  options?: Record<string, unknown>
): Action {
  const payload = setActionPayload(
    action.payload,
    payloadData,
    headers?.payload
  )
  const response = action.response
    ? setActionResponse(action.response, responseData, headers?.response)
    : undefined
  const meta =
    action.meta?.options || options
      ? {
          ...action.meta,
          options: { ...action.meta?.options, ...options },
        }
      : action.meta

  return {
    ...action,
    payload,
    ...(response ? { response } : {}),
    meta,
  }
}

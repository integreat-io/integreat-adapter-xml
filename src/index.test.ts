import test from 'ava'

import adapter from './index.js'

// Setup

const xmlData = `<?xml version="1.0" encoding="utf-8"?><env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope"><env:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash</Name></PaymentMethod><PaymentMethod Id="2"><Name>Invoice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></env:Body></env:Envelope>`

const options = {}

const namespaces = {
  env: 'http://www.w3.org/2003/05/soap-envelope',
  '': 'http://example.com/webservices',
}

// Tests

test('should prepare empty options', (t) => {
  const options = {}
  const expected = { includeHeaders: false }

  const ret = adapter.prepareOptions(options, 'api')

  t.deepEqual(ret, expected)
})

test('should only keep known options', (t) => {
  const options = { includeHeaders: true, dontKnow: 'whatthisis' }
  const expected = { includeHeaders: true }

  const ret = adapter.prepareOptions(options, 'api')

  t.deepEqual(ret, expected)
})

// Tests -- normalize

test('should normalize xml string data in response', async (t) => {
  const action = {
    type: 'GET',
    payload: { type: 'entry' },
    response: { status: 'ok', data: xmlData },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: { type: 'entry' },
    response: {
      status: 'ok',
      data: {
        'soap:Envelope': {
          'soap:Body': {
            GetPaymentMethodsResponse: {
              GetPaymentMethodsResult: {
                PaymentMethod: [
                  { '@Id': '1', Name: { $value: 'Cash' } },
                  { '@Id': '2', Name: { $value: 'Invoice' } },
                ],
              },
            },
          },
        },
      },
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.normalize(action, options)

  t.deepEqual(ret, expected)
})

test('should normalize xml string data in payload', async (t) => {
  const action = {
    type: 'GET',
    payload: { type: 'entry', data: xmlData },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: {
        'soap:Envelope': {
          'soap:Body': {
            GetPaymentMethodsResponse: {
              GetPaymentMethodsResult: {
                PaymentMethod: [
                  { '@Id': '1', Name: { $value: 'Cash' } },
                  { '@Id': '2', Name: { $value: 'Invoice' } },
                ],
              },
            },
          },
        },
      },
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.normalize(action, options)

  t.deepEqual(ret, expected)
})

test('should use provided namespaces', async (t) => {
  const namespaces = {
    env: 'http://www.w3.org/2003/05/soap-envelope',
    def: 'http://example.com/webservices',
  }
  const options = { namespaces }
  const action = {
    type: 'GET',
    payload: { type: 'entry' },
    response: { status: 'ok', data: xmlData },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: { type: 'entry' },
    response: {
      status: 'ok',
      data: {
        'env:Envelope': {
          'env:Body': {
            'def:GetPaymentMethodsResponse': {
              'def:GetPaymentMethodsResult': {
                'def:PaymentMethod': [
                  { '@def:Id': '1', 'def:Name': { $value: 'Cash' } },
                  { '@def:Id': '2', 'def:Name': { $value: 'Invoice' } },
                ],
              },
            },
          },
        },
      },
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.normalize(action, options)

  t.deepEqual(ret, expected)
})

// Tests -- serialize

test('should serialize data in response', async (t) => {
  const options = { namespaces }
  const action = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: {
      status: 'ok',
      data: {
        'env:Envelope': {
          'env:Body': {
            GetPaymentMethodsResponse: {
              GetPaymentMethodsResult: {
                PaymentMethod: [
                  { '@Id': '1', Name: { $value: 'Cash' } },
                  { '@Id': '2', Name: { $value: 'Invoice' } },
                ],
                DontInclude: undefined,
              },
            },
          },
        },
      },
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: { status: 'ok', data: xmlData },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

test('should serialize data in payload', async (t) => {
  const options = { namespaces }
  const action = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: {
        'env:Envelope': {
          'env:Body': {
            GetPaymentMethodsResponse: {
              GetPaymentMethodsResult: {
                PaymentMethod: [
                  { '@Id': '1', Name: { $value: 'Cash' } },
                  { '@Id': '2', Name: { $value: 'Invoice' } },
                ],
                DontInclude: undefined,
              },
            },
          },
        },
      },
      sourceService: 'api',
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: { type: 'entry', data: xmlData, sourceService: 'api' },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

test('should include XML headers in response', async (t) => {
  const options = { namespaces, includeHeaders: true }
  const action = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: {
      status: 'ok',
      data: {
        'env:Envelope': {
          'env:Body': {
            GetPaymentMethodsResponse: {
              GetPaymentMethodsResult: {
                PaymentMethod: [
                  { '@Id': '1', Name: { $value: 'Cash' } },
                  { '@Id': '2', Name: { $value: 'Invoice' } },
                ],
                DontInclude: undefined,
              },
            },
          },
        },
      },
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: { status: 'ok', data: xmlData },
    meta: {
      ident: { id: 'johnf' },
      headers: {
        'Content-Type': 'text/xml;charset=utf-8',
      },
    },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

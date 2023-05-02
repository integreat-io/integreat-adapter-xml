import test from 'ava'

import transformer from './transformer.js'

// Setup

const xmlData = `<?xml version="1.0" encoding="utf-8"?><env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope"><env:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash</Name></PaymentMethod><PaymentMethod Id="2"><Name>Invoice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></env:Body></env:Envelope>`

const options = {}
const state = {
  rev: false,
  onlyMappedValues: false,
  context: [],
  value: {},
}
const stateRev = {
  rev: true,
  onlyMappedValues: false,
  context: [],
  value: {},
}

const namespaces = {
  env: 'http://www.w3.org/2003/05/soap-envelope',
  '': 'http://example.com/webservices',
}

// Tests -- from service

test('should parse xml from service', (t) => {
  const data = xmlData
  const expected = {
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
  }

  const ret = transformer({})(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should use provided namespaces', (t) => {
  const namespaces = {
    env: 'http://www.w3.org/2003/05/soap-envelope',
    def: 'http://example.com/webservices',
  }
  const data = xmlData
  const expected = {
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
  }

  const ret = transformer({ namespaces })(options)(data, state)

  t.deepEqual(ret, expected)
})

// Tests -- to service

test('should stringify xml to service', (t) => {
  const data = {
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
  }
  const expected = xmlData

  const ret = transformer({ namespaces })(options)(data, stateRev)

  t.is(ret, expected)
})

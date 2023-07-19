import test from 'ava'

import transformer from './transformer.js'

// Setup

const xmlData = `<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope"><env:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash</Name><Description xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/></PaymentMethod><PaymentMethod Id="2"><Name>Invoice</Name><Description/></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></env:Body></env:Envelope>`

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
              { '@Id': '1', Name: { $value: 'Cash' }, Description: null },
              {
                '@Id': '2',
                Name: { $value: 'Invoice' },
                Description: { $value: '' },
              },
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
              {
                '@def:Id': '1',
                'def:Name': { $value: 'Cash' },
                'def:Description': null,
              },
              {
                '@def:Id': '2',
                'def:Name': { $value: 'Invoice' },
                'def:Description': { $value: '' },
              },
            ],
          },
        },
      },
    },
  }

  const ret = transformer({ namespaces })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should parse soap from service', (t) => {
  const data = xmlData
  const soapVersion = '1.1'
  const expected = {
    body: {
      GetPaymentMethodsResponse: {
        GetPaymentMethodsResult: {
          PaymentMethod: [
            {
              '@Id': '1',
              Name: { $value: 'Cash' },
              Description: null,
            },
            {
              '@Id': '2',
              Name: { $value: 'Invoice' },
              Description: { $value: '' },
            },
          ],
        },
      },
    },
  }

  const ret = transformer({ soapVersion })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should parse soap from service, keeping envelope', (t) => {
  const data = xmlData
  const soapVersion = '1.1'
  const hideSoapEnvelope = false
  const expected = {
    'soap:Envelope': {
      'soap:Body': {
        GetPaymentMethodsResponse: {
          GetPaymentMethodsResult: {
            PaymentMethod: [
              { '@Id': '1', Name: { $value: 'Cash' }, Description: null },
              {
                '@Id': '2',
                Name: { $value: 'Invoice' },
                Description: { $value: '' },
              },
            ],
          },
        },
      },
    },
  }

  const ret = transformer({ soapVersion, hideSoapEnvelope })(options)(
    data,
    state
  )

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
              { '@Id': '1', Name: { $value: 'Cash' }, Description: null },
              { '@Id': '2', Name: { $value: 'Invoice' }, Description: '' },
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

test('should stringify xml to service, treating null as empty', (t) => {
  const treatNullAsEmpty = true
  const data = {
    'env:Envelope': {
      'env:Body': {
        GetPaymentMethodsResponse: {
          GetPaymentMethodsResult: {
            PaymentMethod: [
              { '@Id': '1', Name: { $value: 'Cash' }, Description: null },
              { '@Id': '2', Name: { $value: 'Invoice' }, Description: '' },
            ],
            DontInclude: undefined,
          },
        },
      },
    },
  }
  const expected = `<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope"><env:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash</Name><Description/></PaymentMethod><PaymentMethod Id="2"><Name>Invoice</Name><Description/></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></env:Body></env:Envelope>`

  const ret = transformer({ namespaces, treatNullAsEmpty })(options)(
    data,
    stateRev
  )

  t.is(ret, expected)
})

test('should stringify xml to service with directive', (t) => {
  const hideXmlDirective = false
  const data = {
    'env:Envelope': {
      'env:Body': {
        GetPaymentMethodsResponse: {
          GetPaymentMethodsResult: {
            PaymentMethod: [
              { '@Id': '1', Name: { $value: 'Cash' }, Description: null },
              { '@Id': '2', Name: { $value: 'Invoice' }, Description: '' },
            ],
            DontInclude: undefined,
          },
        },
      },
    },
  }
  const expected = `<?xml version="1.0" encoding="utf-8"?>${xmlData}`

  const ret = transformer({ namespaces, hideXmlDirective })(options)(
    data,
    stateRev
  )

  t.is(ret, expected)
})

test('should use provided soap version to service', (t) => {
  const namespaces = {
    '': 'http://example.com/webservices',
  }
  const soapVersion = '1.1'
  const data = {
    body: {
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
  }
  const expected = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash</Name></PaymentMethod><PaymentMethod Id="2"><Name>Invoice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></soap:Body></soap:Envelope>`

  const ret = transformer({ namespaces, soapVersion })(options)(data, stateRev)

  t.is(ret, expected)
})

test('should use provided soap version to service with envelope', (t) => {
  const namespaces = {
    '': 'http://example.com/webservices',
  }
  const soapVersion = '1.1'
  const hideSoapEnvelope = false
  const data = {
    'soap:Envelope': {
      'soap:Body': {
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
  const expected = `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash</Name></PaymentMethod><PaymentMethod Id="2"><Name>Invoice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></soap:Body></soap:Envelope>`

  const ret = transformer({ namespaces, soapVersion, hideSoapEnvelope })(
    options
  )(data, stateRev)

  t.is(ret, expected)
})

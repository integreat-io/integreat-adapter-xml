import test from 'ava'

import adapter from './index.js'

// Setup

const xmlData = `<?xml version="1.0" encoding="utf-8"?><env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope"><env:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash</Name></PaymentMethod><PaymentMethod Id="2"><Name>Invoice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></env:Body></env:Envelope>`
const xmlData1_2 = `<?xml version="1.0" encoding="utf-8"?><env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope"><env:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash</Name></PaymentMethod><PaymentMethod Id="2"><Name>Invoice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></env:Body></env:Envelope>`

const normalizedDataSoap = {
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

const normalizedDataEnv = {
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

const options = {}

const namespaces = {
  env: 'http://schemas.xmlsoap.org/soap/envelope',
  '': 'http://example.com/webservices',
}

// Tests

test('should prepare empty options', (t) => {
  const options = {}
  const expected = {
    includeHeaders: false,
    namespaces: {},
    soapVersion: undefined,
    soapAction: undefined,
    soapActionNamespace: undefined,
    hideSoapEnvelope: false,
  }

  const ret = adapter.prepareOptions(options, 'api')

  t.deepEqual(ret, expected)
})

test('should only keep known options', (t) => {
  const options = {
    includeHeaders: true,
    namespaces,
    dontKnow: 'whatthisis',
    soapVersion: '1.2',
    soapAction: true,
    soapActionNamespace: 'http://something-else.test/why',
    hideSoapEnvelope: true,
  }
  const expected = {
    includeHeaders: true,
    namespaces,
    soapVersion: '1.2',
    soapAction: true,
    soapActionNamespace: 'http://something-else.test/why',
    hideSoapEnvelope: true,
  }

  const ret = adapter.prepareOptions(options, 'api')

  t.deepEqual(ret, expected)
})

// Tests -- normalize

test('should normalize xml string data in response', async (t) => {
  const action = {
    type: 'GET',
    payload: { type: 'entry' },
    response: { status: 'ok', data: xmlData1_2 },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: { type: 'entry' },
    response: {
      status: 'ok',
      data: normalizedDataSoap,
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.normalize(action, options)

  t.deepEqual(ret, expected)
})

test('should normalize xml string data in payload', async (t) => {
  const action = {
    type: 'GET',
    payload: { type: 'entry', data: xmlData1_2 },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: normalizedDataSoap,
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.normalize(action, options)

  t.deepEqual(ret, expected)
})

test('should use provided namespaces', async (t) => {
  const namespaces = {
    env: 'http://schemas.xmlsoap.org/soap/envelope',
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
      data: normalizedDataEnv,
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
      data: normalizedDataEnv,
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

test('should include XML content-type header in response', async (t) => {
  const options = { namespaces, includeHeaders: true }
  const action = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: {
      status: 'ok',
      data: normalizedDataEnv,
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: {
      status: 'ok',
      data: xmlData,
      headers: {
        'content-type': 'text/xml;charset=utf-8',
      },
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

test('should include XML content-type header in payload', async (t) => {
  const options = { namespaces, includeHeaders: true }
  const action = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: normalizedDataEnv,
      sourceService: 'api',
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: xmlData,
      sourceService: 'api',
      headers: {
        'content-type': 'text/xml;charset=utf-8',
      },
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

test('should merge headers with existing response headers', async (t) => {
  const options = { namespaces, includeHeaders: true }
  const action = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: {
      status: 'ok',
      data: normalizedDataEnv,
      headers: {
        'content-type': 'application/json',
        soapAction:
          'http://www.stosag.nl/STOSAGServicesEndPoint/SetCC_AuthorizationAndConfiguration',
      },
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: {
      status: 'ok',
      data: xmlData,
      headers: {
        'content-type': 'text/xml;charset=utf-8',
        soapAction:
          'http://www.stosag.nl/STOSAGServicesEndPoint/SetCC_AuthorizationAndConfiguration',
      },
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

test('should merge headers case-insensitively', async (t) => {
  const options = { namespaces, includeHeaders: true }
  const action = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: {
      status: 'ok',
      data: normalizedDataEnv,
      headers: {
        'Content-Type': 'application/json',
      },
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: {
      status: 'ok',
      data: xmlData,
      headers: {
        'content-type': 'text/xml;charset=utf-8',
      },
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

// Tests -- soap

test('should include SOAP 1.1 content-type header, use right namespace, and set soap action header', async (t) => {
  const xmlData = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash</Name></PaymentMethod><PaymentMethod Id="2"><Name>Invoice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></soap:Body></soap:Envelope>`
  const options = {
    namespaces: { '': 'http://example.com/webservices' },
    includeHeaders: true,
    soapVersion: '1.1',
    soapAction: true,
  }
  const action = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: normalizedDataSoap,
      sourceService: 'api',
    },
    response: {
      status: 'ok',
      data: normalizedDataSoap,
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: xmlData,
      sourceService: 'api',
      headers: {
        'content-type': 'text/xml;charset=utf-8',
        SOAPAction: 'http://example.com/webservices/GetPaymentMethodsResponse',
      },
    },
    response: {
      status: 'ok',
      data: xmlData,
      headers: {
        'content-type': 'text/xml;charset=utf-8',
      },
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

test('should include SOAP 1.2 content-type header with soap action, and use right namespace', async (t) => {
  const xmlData = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash</Name></PaymentMethod><PaymentMethod Id="2"><Name>Invoice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></soap:Body></soap:Envelope>`
  const options = {
    namespaces: { '': 'http://example.com/webservices' },
    includeHeaders: true,
    soapVersion: '1.2',
    soapAction: true,
  }
  const action = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: normalizedDataSoap,
      sourceService: 'api',
    },
    response: {
      status: 'ok',
      data: normalizedDataSoap,
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: xmlData,
      sourceService: 'api',
      headers: {
        'content-type':
          'application/soap+xml;charset=utf-8;action="http://example.com/webservices/GetPaymentMethodsResponse"',
      },
    },
    response: {
      status: 'ok',
      data: xmlData,
      headers: {
        'content-type': 'application/soap+xml;charset=utf-8',
      },
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

test('should use provided soapAction', async (t) => {
  const options = {
    namespaces: { '': 'http://example.com/webservices' },
    includeHeaders: true,
    soapVersion: '1.1',
    soapAction: 'http://something-else.test/why/TheAction',
  }
  const action = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: normalizedDataSoap,
      sourceService: 'api',
    },
    response: {
      status: 'ok',
      data: normalizedDataSoap,
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expectedHeaders = {
    'content-type': 'text/xml;charset=utf-8',
    SOAPAction: 'http://something-else.test/why/TheAction',
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret.payload.headers, expectedHeaders)
})

test('should use provided soapAction namespace', async (t) => {
  const options = {
    namespaces: { '': 'http://example.com/webservices' },
    includeHeaders: true,
    soapVersion: '1.1',
    soapAction: true,
    soapActionNamespace: 'http://something-else.test/why/',
  }
  const action = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: normalizedDataSoap,
      sourceService: 'api',
    },
    response: {
      status: 'ok',
      data: normalizedDataSoap,
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expectedHeaders = {
    'content-type': 'text/xml;charset=utf-8',
    SOAPAction: 'http://something-else.test/why/GetPaymentMethodsResponse',
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret.payload.headers, expectedHeaders)
})

test('should hide soap envelope when normalizing', async (t) => {
  const options = { soapVersion: '1.2', hideSoapEnvelope: true }
  const action = {
    type: 'GET',
    payload: { type: 'entry' },
    response: { status: 'ok', data: xmlData1_2 },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: { type: 'entry' },
    response: {
      status: 'ok',
      data: {
        body: {
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
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.normalize(action, options)

  t.deepEqual(ret, expected)
})

test('should add soap envelope when serializing', async (t) => {
  const xmlData = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash</Name></PaymentMethod><PaymentMethod Id="2"><Name>Invoice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></soap:Body></soap:Envelope>`
  const options = {
    namespaces: { '': 'http://example.com/webservices' },
    includeHeaders: true,
    soapVersion: '1.1',
    hideSoapEnvelope: true,
  }
  const data = {
    body: {
      GetPaymentMethodsResponse: {
        GetPaymentMethodsResult: {
          PaymentMethod: [
            { '@Id': '1', Name: { $value: 'Cash' } },
            { '@Id': '2', Name: { $value: 'Invoice' } },
          ],
        },
      },
    },
  }
  const action = {
    type: 'GET',
    payload: {
      type: 'entry',
      data,
      sourceService: 'api',
    },
    response: {
      status: 'ok',
      data,
    },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: xmlData,
      sourceService: 'api',
      headers: {
        'content-type': 'text/xml;charset=utf-8',
      },
    },
    response: {
      status: 'ok',
      data: xmlData,
      headers: {
        'content-type': 'text/xml;charset=utf-8',
      },
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

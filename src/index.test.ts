import test from 'ava'

import adapter from './index.js'

// Setup

const xmlData = `<?xml version="1.0" encoding="utf-8"?><env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"><env:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash &amp; carry</Name></PaymentMethod><PaymentMethod Id="2"><Name>Inv&#248;ice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></env:Body></env:Envelope>`
const xmlData1_2 = `<?xml version="1.0" encoding="utf-8"?><env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope"><env:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash &amp; carry</Name></PaymentMethod><PaymentMethod Id="2"><Name>Inv&#248;ice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></env:Body></env:Envelope>`

const normalizedDataSoap = {
  'soap:Envelope': {
    'soap:Body': {
      GetPaymentMethodsResponse: {
        GetPaymentMethodsResult: {
          PaymentMethod: [
            { '@Id': '1', Name: { $value: 'Cash & carry' } },
            { '@Id': '2', Name: { $value: 'Invøice' } },
          ],
        },
      },
    },
  },
}

const normalizedDataSoapNoEnvelope = {
  body: {
    GetPaymentMethodsResponse: {
      GetPaymentMethodsResult: {
        PaymentMethod: [
          { '@Id': '1', Name: { $value: 'Cash & carry' } },
          { '@Id': '2', Name: { $value: 'Invøice' } },
        ],
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
            { '@Id': '1', Name: { $value: 'Cash & carry' } },
            { '@Id': '2', Name: { $value: 'Invøice' } },
          ],
          DontInclude: undefined,
        },
      },
    },
  },
}

const options = {}

const namespaces = {
  env: 'http://schemas.xmlsoap.org/soap/envelope/',
  '': 'http://example.com/webservices',
}

// Tests

test('should prepare empty options', (t) => {
  const options = {}
  const expected = {
    includeHeaders: true,
    namespaces: {},
    soapVersion: undefined,
    soapPrefix: undefined,
    soapAction: undefined,
    soapActionNamespace: undefined,
    hideSoapEnvelope: true,
    hideXmlDirective: false,
    dontDoubleEncode: false,
    treatNullAsEmpty: false,
  }

  const ret = adapter.prepareOptions(options, 'api')

  t.deepEqual(ret, expected)
})

test('should only keep known options', (t) => {
  const options = {
    includeHeaders: false,
    namespaces,
    dontKnow: 'whatthisis',
    soapVersion: '1.2',
    soapPrefix: 's',
    soapAction: true,
    soapActionNamespace: 'http://something-else.test/why',
    hideSoapEnvelope: false,
    hideXmlDirective: true,
    dontDoubleEncode: true,
    treatNullAsEmpty: true,
  }
  const expected = {
    includeHeaders: false,
    namespaces,
    soapVersion: '1.2',
    soapPrefix: 's',
    soapAction: true,
    soapActionNamespace: 'http://something-else.test/why',
    hideSoapEnvelope: false,
    hideXmlDirective: true,
    dontDoubleEncode: true,
    treatNullAsEmpty: true,
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
    env: 'http://schemas.xmlsoap.org/soap/envelope/',
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
                  { '@def:Id': '1', 'def:Name': { $value: 'Cash & carry' } },
                  { '@def:Id': '2', 'def:Name': { $value: 'Invøice' } },
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
  const options = { namespaces, includeHeaders: false }
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
  const options = { namespaces, includeHeaders: false }
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

test('should not double encode already encoded entities', async (t) => {
  const options = { namespaces, dontDoubleEncode: true, includeHeaders: false } // Tell adapter to not double encode
  const data = {
    'env:Envelope': {
      'env:Body': {
        GetPaymentMethodsResponse: {
          GetPaymentMethodsResult: {
            PaymentMethod: [
              { '@Id': '1', Name: { $value: 'Cash &amp; carry' } },
              { '@Id': '2', Name: { $value: 'Inv&#248;ice' } },
            ],
            DontInclude: undefined,
          },
        },
      },
    },
  }
  const action = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: {
      status: 'ok',
      data,
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

test('should serialize without xml directive', async (t) => {
  const options = { namespaces, hideXmlDirective: true, includeHeaders: false }
  const action = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: normalizedDataEnv,
      sourceService: 'api',
    },
    response: { status: 'ok', data: normalizedDataEnv },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: { type: 'entry', data: xmlData.slice(38), sourceService: 'api' },
    response: { status: 'ok', data: xmlData.slice(38) },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

test('should include XML content-type header in response', async (t) => {
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

test('should not include content-type headers when no data', async (t) => {
  const options = { namespaces }
  const action = {
    type: 'GET',
    payload: {
      type: 'entry',
      sourceService: 'api',
    },
    response: { status: 'ok' },
    meta: { ident: { id: 'johnf' } },
  }
  const expected = {
    type: 'GET',
    payload: {
      type: 'entry',
      sourceService: 'api',
    },
    response: { status: 'ok' },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

test('should merge headers with existing response headers, but not override existing content type', async (t) => {
  const options = { namespaces, includeHeaders: true }
  const action = {
    type: 'GET',
    payload: { type: 'entry', sourceService: 'api' },
    response: {
      status: 'ok',
      data: normalizedDataEnv,
      headers: {
        'content-type': 'application/soap+xml',
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
        'content-type': 'application/soap+xml',
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
        'Content-Type': 'application/soap+xml',
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
        'content-type': 'application/soap+xml',
      },
    },
    meta: { ident: { id: 'johnf' } },
  }

  const ret = await adapter.serialize(action, options)

  t.deepEqual(ret, expected)
})

// Tests -- soap

test('should include SOAP 1.1 content-type header, use right namespace, and set soap action header', async (t) => {
  const xmlData = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash &amp; carry</Name></PaymentMethod><PaymentMethod Id="2"><Name>Inv&#248;ice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></soap:Body></soap:Envelope>`
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
      data: normalizedDataSoapNoEnvelope,
      sourceService: 'api',
    },
    response: {
      status: 'ok',
      data: normalizedDataSoapNoEnvelope,
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
  const xmlData = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash &amp; carry</Name></PaymentMethod><PaymentMethod Id="2"><Name>Inv&#248;ice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></soap:Body></soap:Envelope>`
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
      data: normalizedDataSoapNoEnvelope,
      sourceService: 'api',
    },
    response: {
      status: 'ok',
      data: normalizedDataSoapNoEnvelope,
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

test('should use provided soap prefix when serializing', async (t) => {
  const options = {
    namespaces: { '': 'http://example.com/webservices' },
    includeHeaders: true,
    soapVersion: '1.1',
    soapAction: true,
    soapPrefix: 'env',
  }
  const action = {
    type: 'GET',
    payload: {
      type: 'entry',
      data: normalizedDataSoapNoEnvelope,
      sourceService: 'api',
    },
    response: {
      status: 'ok',
      data: normalizedDataSoapNoEnvelope,
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

test('should use provided soap prefix when normalizing', async (t) => {
  const options = {
    soapVersion: '1.2',
    soapPrefix: 'env',
    hideSoapEnvelope: false,
  }
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
        'env:Envelope': {
          'env:Body': {
            GetPaymentMethodsResponse: {
              GetPaymentMethodsResult: {
                PaymentMethod: [
                  { '@Id': '1', Name: { $value: 'Cash & carry' } },
                  { '@Id': '2', Name: { $value: 'Invøice' } },
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
      data: normalizedDataSoapNoEnvelope,
      sourceService: 'api',
    },
    response: {
      status: 'ok',
      data: normalizedDataSoapNoEnvelope,
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
      data: normalizedDataSoapNoEnvelope,
      sourceService: 'api',
    },
    response: {
      status: 'ok',
      data: normalizedDataSoapNoEnvelope,
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

test('should not hide soap envelope when normalizing', async (t) => {
  const options = { soapVersion: '1.2', hideSoapEnvelope: false }
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

test('should add soap envelope when serializing', async (t) => {
  const xmlData = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod Id="1"><Name>Cash &amp; carry</Name></PaymentMethod><PaymentMethod Id="2"><Name>Inv&#248;ice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></soap:Body></soap:Envelope>`
  const options = {
    namespaces: { '': 'http://example.com/webservices' },
    includeHeaders: true,
    soapVersion: '1.1',
    hideSoapEnvelope: false,
  }
  const data = normalizedDataSoap
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

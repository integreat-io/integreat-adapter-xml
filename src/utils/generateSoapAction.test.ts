import test from 'ava'

import generateSoapAction from './generateSoapAction.js'

// Setup

const namespaces = {
  '': 'http://example.com/webservices',
  pm: 'http://payment.test/methods/',
}

// Tests

test('should generate soap action from data', (t) => {
  const soapPrefix = 'soap'
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        GetPaymentMethods: {
          Id: { $value: '12345' },
        },
      },
    },
  }
  const expected = 'http://example.com/webservices/GetPaymentMethods'

  const ret = generateSoapAction(data, soapPrefix, namespaces)

  t.is(ret, expected)
})

test('should generate soap action from data when body has prefix', (t) => {
  const soapPrefix = 'soap'
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        'pm:GetPaymentMethods': {
          'pm:Id': { $value: '12345' },
        },
      },
    },
  }
  const expected = 'http://payment.test/methods/GetPaymentMethods'

  const ret = generateSoapAction(data, soapPrefix, namespaces)

  t.is(ret, expected)
})

test('should generate soap action from data with different soap prefix', (t) => {
  const soapPrefix = 's'
  const data = {
    's:Envelope': {
      's:Body': {
        GetPaymentMethods: {
          Id: { $value: '12345' },
        },
      },
    },
  }
  const expected = 'http://example.com/webservices/GetPaymentMethods'

  const ret = generateSoapAction(data, soapPrefix, namespaces)

  t.is(ret, expected)
})

test('should generate soap action from data when several root elements', (t) => {
  const soapPrefix = 'soap'
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        WhatIsThis: {},
        GetPaymentMethods: {
          Id: { $value: '12345' },
        },
      },
    },
  }
  const expected = 'http://example.com/webservices/WhatIsThis'

  const ret = generateSoapAction(data, soapPrefix, namespaces)

  t.is(ret, expected)
})

test('should generate soap action with provided namespace', (t) => {
  const soapPrefix = 'soap'
  const actionNamespace = 'http://random.test/why'
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        GetPaymentMethods: {
          Id: { $value: '12345' },
        },
      },
    },
  }
  const expected = 'http://random.test/why/GetPaymentMethods'

  const ret = generateSoapAction(data, soapPrefix, namespaces, actionNamespace)

  t.is(ret, expected)
})

test('should return undefined when element has no provided namespace', (t) => {
  const soapPrefix = 'soap'
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        'unknown:GetPaymentMethods': {
          'unknown:Id': { $value: '12345' },
        },
      },
    },
  }

  const ret = generateSoapAction(data, soapPrefix, namespaces)

  t.is(ret, undefined)
})

test('should return undefined when no data', (t) => {
  const soapPrefix = 'soap'
  const data = null

  const ret = generateSoapAction(data, soapPrefix, namespaces)

  t.is(ret, undefined)
})

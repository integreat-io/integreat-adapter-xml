import test from 'ava'

import setNamespaces from './setNamespaces.js'

// Setup

const namespaces = {
  '': 'http://example.com/webservices',
  soap: 'http://www.w3.org/2003/05/soap-envelope',
}

// Tests

test('should set xsi namespace', (t) => {
  const expected = {
    ...namespaces,
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
  }

  const { namespaces: nextNS, xsiPrefix } = setNamespaces(namespaces)

  t.deepEqual(nextNS, expected)
  t.is(xsiPrefix, 'xsi')
})

test('should pick up xsi namespace from namespace', (t) => {
  const namespacesWithXsi = {
    ...namespaces,
    i: 'http://www.w3.org/2001/XMLSchema-instance',
  }

  const { namespaces: nextNS, xsiPrefix } = setNamespaces(namespacesWithXsi)

  t.deepEqual(nextNS, namespacesWithXsi)
  t.is(xsiPrefix, 'i')
})

test('should set soap namespace for version 1.1', (t) => {
  const soapVersion = '1.1'
  const expected = {
    ...namespaces,
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    soap: 'http://schemas.xmlsoap.org/soap/envelope/',
  }

  const { namespaces: nextNS, soapPrefix } = setNamespaces(
    namespaces,
    soapVersion
  )

  t.deepEqual(nextNS, expected)
  t.is(soapPrefix, 'soap')
})

test('should set soap namespace for version 1.2', (t) => {
  const namespaces = {
    '': 'http://example.com/webservices',
  }
  const soapVersion = '1.2'
  const expected = {
    '': 'http://example.com/webservices',
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    soap: 'http://www.w3.org/2003/05/soap-envelope',
  }

  const { namespaces: nextNS, soapPrefix } = setNamespaces(
    namespaces,
    soapVersion
  )

  t.deepEqual(nextNS, expected)
  t.is(soapPrefix, 'soap')
})

test('should pick up soap namespace prefix', (t) => {
  const namespaces = {
    '': 'http://example.com/webservices',
    env: 'http://www.w3.org/2003/05/soap-envelope',
  }
  const soapVersion = '1.2'
  const expected = {
    '': 'http://example.com/webservices',
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    env: 'http://www.w3.org/2003/05/soap-envelope',
  }

  const { namespaces: nextNS, soapPrefix } = setNamespaces(
    namespaces,
    soapVersion
  )

  t.deepEqual(nextNS, expected)
  t.is(soapPrefix, 'env')
})

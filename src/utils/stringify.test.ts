import test from 'ava'

import stringify from './stringify.js'

// Setup

const xmlData =
  '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Body><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod><Id>1</Id><Name>Cash</Name></PaymentMethod><PaymentMethod><Id>2</Id><Name>Invoice</Name></PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse></soap:Body></soap:Envelope>'

const soapNamespaceOnParent = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><NaeringBrikkeListeResponse xmlns="http://internal.ws.no/webservices/"><NaeringBrikkeListeResult xmlns:a="http://schemas.datacontract.org/2004/07/Common"><a:Melding>Message</a:Melding><a:ReturKode>0</a:ReturKode><a:ReturVerdi>Value</a:ReturVerdi></NaeringBrikkeListeResult></NaeringBrikkeListeResponse></soap:Body></soap:Envelope>`

const soapNoNamespace = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><NaeringBrikkeListeResponse><NaeringBrikkeListeResult xmlns:a="http://schemas.datacontract.org/2004/07/Common"><a:Melding>Message</a:Melding><a:ReturKode>0</a:ReturKode><a:ReturVerdi>Value</a:ReturVerdi></NaeringBrikkeListeResult></NaeringBrikkeListeResponse></soap:Body></soap:Envelope>`

const multiNamespaceSoap = `<?xml version="1.0" encoding="utf-8"?><env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope"><env:Header><m:reservation env:role="http://www.w3.org/2003/05/soap-envelope/role/next" env:mustUnderstand="true" xmlns:m="http://travelcompany.example.org/reservation"><m:reference>uuid:093a2da1-q345-739r-ba5d-pqff98fe8j7d</m:reference><m:dateAndTime>2001-11-29T13:20:00.000-05:00</m:dateAndTime></m:reservation><my-emp:passenger env:role="http://www.w3.org/2003/05/soap-envelope/role/next" env:mustUnderstand="true" xmlns:my-emp="http://mycompany.example.com/employees"><my-emp:name>John Fjon</my-emp:name></my-emp:passenger></env:Header><env:Body><p:itinerary xmlns:p="http://travelcompany.example.org/reservation/travel"><p:departure><p:departing>New York</p:departing><p:arriving>Los Angeles</p:arriving><p:departureDate>2001-12-14</p:departureDate><p:seatPreference>aisle</p:seatPreference></p:departure><p:return><p:departing>Los Angeles</p:departing><p:arriving>New York</p:arriving><p:departureDate>2001-12-20</p:departureDate><p:seatPreference/></p:return></p:itinerary><q:lodging xmlns:q="http://travelcompany.example.org/reservation/hotels"><q:preference>none</q:preference></q:lodging></env:Body></env:Envelope>`

const namespaces = {
  soap: 'http://www.w3.org/2003/05/soap-envelope',
  '': 'http://example.com/webservices',
}

// Tests

test('should stringify object structure to xml', (t) => {
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        GetPaymentMethodsResponse: {
          GetPaymentMethodsResult: {
            PaymentMethod: [
              { Id: { $value: '1' }, Name: { $value: 'Cash' } },
              { Id: { $value: '2' }, Name: { $value: 'Invoice' } },
            ],
          },
        },
      },
    },
  }
  const expected = xmlData

  const { data: ret } = stringify(data, namespaces)

  t.is(ret, expected)
})

test('should stringify object structure to xml without directive', (t) => {
  const hideXmlDirective = true
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        GetPaymentMethodsResponse: {
          GetPaymentMethodsResult: {
            PaymentMethod: [
              { Id: { $value: '1' }, Name: { $value: 'Cash' } },
              { Id: { $value: '2' }, Name: { $value: 'Invoice' } },
            ],
          },
        },
      },
    },
  }
  const expected = xmlData.slice(38) // Skip xml directive

  const { data: ret } = stringify(data, namespaces, hideXmlDirective)

  t.is(ret, expected)
})

test('should stringify object without $value objects', (t) => {
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        GetPaymentMethodsResponse: {
          GetPaymentMethodsResult: {
            PaymentMethod: [
              { Id: '1', Name: 'Cash' },
              { Id: '2', Name: 'Invoice' },
            ],
          },
        },
      },
    },
  }
  const expected = xmlData

  const { data: ret } = stringify(data, namespaces)

  t.is(ret, expected)
})

test('should stringify attributes', async (t) => {
  const data = {
    PaymentMethods: {
      PaymentMethod: [
        { '@Id': '1', '@Name': 'Cash' },
        { '@Id': '2', '@Name': 'Invoice' },
      ],
    },
  }
  const expected = `<?xml version="1.0" encoding="utf-8"?><PaymentMethods xmlns="http://example.com/webservices"><PaymentMethod Id="1" Name="Cash"/><PaymentMethod Id="2" Name="Invoice"/></PaymentMethods>`

  const { data: ret } = stringify(data, namespaces)

  t.is(ret, expected)
})

test('should stringify array with one object to xml', (t) => {
  const data = [
    {
      PaymentMethods: {
        PaymentMethod: [
          { Id: { $value: '1' }, Name: { $value: 'Cash' } },
          { Id: { $value: '2' }, Name: { $value: 'Invoice' } },
        ],
      },
    },
  ]
  const expected =
    '<?xml version="1.0" encoding="utf-8"?><PaymentMethods xmlns="http://example.com/webservices"><PaymentMethod><Id>1</Id><Name>Cash</Name></PaymentMethod><PaymentMethod><Id>2</Id><Name>Invoice</Name></PaymentMethod></PaymentMethods>'

  const { data: ret } = stringify(data, namespaces)

  t.is(ret, expected)
})

test('should stringify array of strings', (t) => {
  const data = {
    GetPaymentMethodsResponse: {
      GetPaymentMethodsResult: {
        PaymentMethod: ['Cash', 'Invoice'],
      },
    },
  }
  const expected =
    '<?xml version="1.0" encoding="utf-8"?><GetPaymentMethodsResponse xmlns="http://example.com/webservices"><GetPaymentMethodsResult><PaymentMethod>Cash</PaymentMethod><PaymentMethod>Invoice</PaymentMethod></GetPaymentMethodsResult></GetPaymentMethodsResponse>'

  const { data: ret } = stringify(data, namespaces)

  t.is(ret, expected)
})

test('should encode chars', async (t) => {
  const data = {
    Text: { $value: '<p>Text æøå; 💩λ @\n\'•\' & ÆØÅ "123"</p>' },
  }
  const expected = `<?xml version="1.0" encoding="utf-8"?><Text xmlns="http://example.com/webservices">&lt;p&gt;Text &#230;&#248;&#229;; &#128169;&#955; @\n&apos;&#8226;&apos; &amp; &#198;&#216;&#197; &quot;123&quot;&lt;/p&gt;</Text>`

  const { data: ret } = stringify(data, namespaces)

  t.is(ret, expected)
})

test('should stringify Date to iso string', (t) => {
  const data = {
    Stats: {
      Views: { $value: '134' },
      LastVisited: { $value: new Date('2021-03-18T11:43:44Z') },
    },
  }
  const expected =
    '<?xml version="1.0" encoding="utf-8"?><Stats xmlns="http://example.com/webservices"><Views>134</Views><LastVisited>2021-03-18T11:43:44.000Z</LastVisited></Stats>'

  const { data: ret } = stringify(data, namespaces)

  t.is(ret, expected)
})

test('should not include unused namespaces', async (t) => {
  const namespaces = {
    '': 'http://example.com/webservices',
    xsi: 'http://www.w3.org/2001/XMLSchema-instance',
    xsd: 'http://www.w3.org/2001/XMLSchema',
    soap: 'http://www.w3.org/2003/05/soap-envelope',
  }
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        GetPaymentMethodsResponse: {
          GetPaymentMethodsResult: {
            PaymentMethod: [
              { Id: { $value: '1' }, Name: { $value: 'Cash' } },
              { Id: { $value: '2' }, Name: { $value: 'Invoice' } },
            ],
          },
        },
      },
    },
  }
  const expected = xmlData

  const { data: ret } = stringify(data, namespaces)

  t.is(ret, expected)
})

test('should handle different namespaces', async (t) => {
  const namespaces = {
    p: 'http://travelcompany.example.org/reservation/travel/',
    q: 'http://travelcompany.example.org/reservation/hotels/',
    soap: 'http://www.w3.org/2003/05/soap-envelope',
  }
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        'p:itinerary': {
          'p:departure': {
            'p:departing': 'New York',
            'p:arriving': 'Los Angeles',
            'p:departureDate': '2001-12-14',
            'p:seatPreference': 'aisle',
          },
          'p:return': {
            'p:departing': 'Los Angeles',
            'p:arriving': 'New York',
            'p:departureDate': '2001-12-20',
            'p:seatPreference': null,
          },
        },
        'q:lodging': {
          'q:preference': 'none',
        },
      },
    },
  }
  const expected =
    '<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Body><p:itinerary xmlns:p="http://travelcompany.example.org/reservation/travel/"><p:departure><p:departing>New York</p:departing><p:arriving>Los Angeles</p:arriving><p:departureDate>2001-12-14</p:departureDate><p:seatPreference>aisle</p:seatPreference></p:departure><p:return><p:departing>Los Angeles</p:departing><p:arriving>New York</p:arriving><p:departureDate>2001-12-20</p:departureDate><p:seatPreference xsi:nil="true" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/></p:return></p:itinerary><q:lodging xmlns:q="http://travelcompany.example.org/reservation/hotels/"><q:preference>none</q:preference></q:lodging></soap:Body></soap:Envelope>'

  const { data: ret } = stringify(data, namespaces)

  t.deepEqual(ret, expected)
})

test('should use overriden xsi namespace', async (t) => {
  const namespaces = {
    soap: 'http://www.w3.org/2003/05/soap-envelope',
    '': 'http://example.com/webservices',
    p3: 'http://www.w3.org/2001/XMLSchema-instance',
  }
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        empty: null,
      },
    },
  }
  const expected = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope"><soap:Body><empty p3:nil="true" xmlns="http://example.com/webservices" xmlns:p3="http://www.w3.org/2001/XMLSchema-instance"/></soap:Body></soap:Envelope>`

  const { data: ret } = stringify(data, namespaces)

  t.deepEqual(ret, expected)
})

test('should set namespace on parent', async (t) => {
  const namespaces = {
    '': 'http://internal.ws.no/webservices/',
    a: 'http://schemas.datacontract.org/2004/07/Common',
    soap: 'http://schemas.xmlsoap.org/soap/envelope/',
  }
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        NaeringBrikkeListeResponse: {
          NaeringBrikkeListeResult: {
            'a:Melding': 'Message',
            'a:ReturKode': '0',
            'a:ReturVerdi': 'Value',
          },
        },
      },
    },
  }
  const expected = soapNamespaceOnParent

  const { data: ret } = stringify(data, namespaces)

  t.deepEqual(ret, expected)
})

test('should not set no-namespace', async (t) => {
  const namespaces = {
    '': '',
    a: 'http://schemas.datacontract.org/2004/07/Common',
    soap: 'http://schemas.xmlsoap.org/soap/envelope/',
  }
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        NaeringBrikkeListeResponse: {
          NaeringBrikkeListeResult: {
            'a:Melding': 'Message',
            'a:ReturKode': '0',
            'a:ReturVerdi': 'Value',
          },
        },
      },
    },
  }
  const expected = soapNoNamespace

  const { data: ret } = stringify(data, namespaces)

  t.deepEqual(ret, expected)
})

test('should return soap and xsi prefixes', (t) => {
  const data = {
    'soap:Envelope': {
      'soap:Body': {
        GetPaymentMethodsResponse: {
          GetPaymentMethodsResult: {
            PaymentMethod: [
              { Id: { $value: '1' }, Name: { $value: 'Cash' } },
              { Id: { $value: '2' }, Name: { $value: 'Invoice' } },
            ],
          },
        },
      },
    },
  }

  const { soapPrefix, xsiPrefix } = stringify(data, namespaces)

  t.is(soapPrefix, 'soap')
  t.is(xsiPrefix, 'xsi')
})

test('should add soap envelope', (t) => {
  const namespaces = {
    env: 'http://www.w3.org/2003/05/soap-envelope',
    m: 'http://travelcompany.example.org/reservation',
    'my-emp': 'http://mycompany.example.com/employees',
    p: 'http://travelcompany.example.org/reservation/travel',
    q: 'http://travelcompany.example.org/reservation/hotels',
    '': 'http://example.com/webservices',
  }
  const soapVersion = '1.2'
  const hideSoapEnvelope = true
  const data = {
    header: {
      'm:reservation': {
        '@env:role': 'http://www.w3.org/2003/05/soap-envelope/role/next',
        '@env:mustUnderstand': 'true',
        'm:reference': {
          $value: 'uuid:093a2da1-q345-739r-ba5d-pqff98fe8j7d',
        },
        'm:dateAndTime': { $value: '2001-11-29T13:20:00.000-05:00' },
      },
      'my-emp:passenger': {
        '@env:role': 'http://www.w3.org/2003/05/soap-envelope/role/next',
        '@env:mustUnderstand': 'true',
        'my-emp:name': { $value: 'John Fjon' },
      },
    },
    body: {
      'p:itinerary': {
        'p:departure': {
          'p:departing': { $value: 'New York' },
          'p:arriving': { $value: 'Los Angeles' },
          'p:departureDate': { $value: '2001-12-14' },
          'p:seatPreference': { $value: 'aisle' },
        },
        'p:return': {
          'p:departing': { $value: 'Los Angeles' },
          'p:arriving': { $value: 'New York' },
          'p:departureDate': { $value: '2001-12-20' },
          'p:seatPreference': { $value: '' },
        },
      },
      'q:lodging': {
        'q:preference': { $value: 'none' },
      },
    },
  }
  const expected = multiNamespaceSoap

  const { data: ret } = stringify(
    data,
    namespaces,
    undefined,
    soapVersion,
    hideSoapEnvelope
  )

  t.is(ret, expected)
})

test('should not add soap envelope when no body', async (t) => {
  const soapVersion = '1.2'
  const hideSoapEnvelope = true
  const data = {
    PaymentMethods: {
      PaymentMethod: [
        { '@Id': '1', '@Name': 'Cash' },
        { '@Id': '2', '@Name': 'Invoice' },
      ],
    },
  }
  const expected = `<?xml version="1.0" encoding="utf-8"?><PaymentMethods xmlns="http://example.com/webservices"><PaymentMethod Id="1" Name="Cash"/><PaymentMethod Id="2" Name="Invoice"/></PaymentMethods>`

  const { data: ret } = stringify(
    data,
    namespaces,
    undefined,
    soapVersion,
    hideSoapEnvelope
  )

  t.is(ret, expected)
})

test('should return undefined when not an object', (t) => {
  t.is(stringify('Hello', namespaces).data, undefined)
  t.is(stringify(32, namespaces).data, undefined)
  t.is(stringify(true, namespaces).data, undefined)
  t.is(stringify(new Date(), namespaces).data, undefined)
  t.is(stringify(null, namespaces).data, undefined)
  t.is(stringify(undefined, namespaces).data, undefined)
})

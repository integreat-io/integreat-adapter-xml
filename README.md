# XML adapter for Integreat

Adapter that lets
[Integreat](https://github.com/integreat-io/integreat) send and receive content
in XML. The package also includes a transformer version.

[![npm Version](https://img.shields.io/npm/v/integreat-adapter-xml.svg)](https://www.npmjs.com/package/integreat-adapter-xml)
[![Maintainability](https://api.codeclimate.com/v1/badges/003c73d057cfe4c20783/maintainability)](https://codeclimate.com/github/integreat-io/integreat-adapter-xml/maintainability)

## Getting started

### Prerequisits

Requires node v18 and Integreat v0.8.

### Installing and using

Install from npm:

```
npm install integreat-adapter-xml
```

Example of use:

```javascript
import integreat from 'integreat'
import httpTransporter from 'integreat-transporter-http'
import xmlAdapter from 'integreat-adapter-xml'
import defs from './config.js'

const great = Integreat.create(defs, {
  transporters: { http: httpTransporter },
  adapters: { xml: xmlAdapter },
})

// ... and then dispatch actions as usual
```

Example service configuration:

```javascript
{
  id: 'store',
  transporter: 'http',
  adapters: ['xml'],
  options: {
    includeHeaders: true,
    namspaces: {
      'env': 'http://www.w3.org/2003/05/soap-envelope',
      '': 'http://example.com/webservices',
    }
  },
  endpoints: [
    { options: { uri: 'https://api.com/entries.xml' } }
  ]
}
```

When coming from a service, an XML string on the payload data or response data
will be parsed and returned as a JS object structure. In reverse, i.e. going to
a service, the data will be stringified as an XML string using the same rules as
when parsing.

The rules behind parsing (and stringifying) is:

- An XML document will be parsed to an object with the name of the root element
  as a prop. Node/elements are themselves represented by objects.
- A node/element will be set as a property on the object of its parent node,
  with its name as key.
- An attribute will be set as a property on the object of its containg element,
  with its name prefixed with `'@'` as key.
- A list of equally named child elements will be set as an array of one object
  for each element, and this array is set as a property on its parent element
  in the same way as single child elements.
- A value node (plain value) is set on the object of its parent element with
  the key `$value`. This is done this way because elements with a value may
  still have attributes. When stringifying, we treat both an object with a
  `$value` prop and a plain value as value nodes.
- Prefixes are included in the props as if they where part of the element or
  attribute name, but there will be a normalization of prefixes and it's
  possible to provide a dictionary of prefixes on the `namespaces` property (see
  below).
- When parsing, encoded chars (e.g. `'&lt;'` or `'&#230;'`) will be decoded
  (e.g. `'<'` or `'æ'`). When stringifying, all UTF-8 chars and reserved XML
  chars (`'<>&'`) will be encoded.

Available options:

- `includeHeaders`: Set to `true` to have the adapter set headers for sending
  with content-type `text/xml;charset=utf-8`. Will only be applied when
  serializing (i.e. going _to_ the service).
- `namespaces`: May be an object with uris as keys and prefixes as values. Any
  namespace matching an uri will use the given prefix. Use an empty string
  `''` to indicate a default namespace that will not have any prefix.

### XML transformer

The package also includes a transformer, that works exactly like the adapter,
except it is intended for use in mutation pipelines with
`{ $transform: 'xml' }`. You may use it like this:

Example of use:

```javascript
import integreat from 'integreat'
import httpTransporter from 'integreat-transporter-http'
import xmlTransformer from 'integreat-adapter-xml/transformer.js'
import defs from './config.js'

const great = Integreat.create(defs, {
  transporters: { http: httpTransporter },
  transformers: { xml: xmlTransformer },
})
```

You may include the `namespaces` option like this:

```javascript
{
  $transform: 'xml',
  namspaces: {
    'env': 'http://www.w3.org/2003/05/soap-envelope',
    '': 'http://example.com/webservices',
  }
}
```

The `includeHeaders` option does not apply to the transformer.

### Running the tests

The tests can be run with `npm test`.

## Contributing

Please read
[CONTRIBUTING](https://github.com/integreat-io/integreat-adapter-xml/blob/master/CONTRIBUTING.md)
for details on our code of conduct, and the process for submitting pull
requests.

## License

This project is licensed under the ISC License - see the
[LICENSE](https://github.com/integreat-io/integreat-adapter-xml/blob/master/LICENSE)
file for details.
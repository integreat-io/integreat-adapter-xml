# XML adapter for Integreat

Adapter that lets
[Integreat](https://github.com/integreat-io/integreat) send and receive content
in XML. The package also includes a transformer version.

[![npm Version](https://img.shields.io/npm/v/integreat-adapter-xml.svg)](https://www.npmjs.com/package/integreat-adapter-xml)
[![Maintainability](https://api.codeclimate.com/v1/badges/003c73d057cfe4c20783/maintainability)](https://codeclimate.com/github/integreat-io/integreat-adapter-xml/maintainability)

## Getting started

### Prerequisits

Requires node v18 and Integreat v1.0.

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

- `includeHeaders`: By default the adapter set content-type headers to
  `'text/xml;charset=utf-8'`, or `'application/soap+xml;charset=utf-8'` when
  `soapVersion` is `'1.2'`, Headers will be set on payload when payload has data
  and response when response has data. Any existing `'content-type'` headers
  will be kept. There's also an option for including `soapAction` header when
  appropriate. Default is `true`, so set to `false` when you don't want headers.
- `namespaces`: May be an object with prefixes as keys and uris as values. Any
  namespace matching an uri will use the given prefix. Use an empty string
  `''` to indicate a default namespace that will not have any prefix. Also,
  prefixes that start with a hyphen (`'-'`) will be treated as a default
  namespace, in case you need different default namespaces in different places.
- `hideXmlDirective`: When set to `true`, the leading
  `<?xml version="1.0" encoding="utf-8"?>` will not be included in the
  serialized XML. This only has an effect when going to the serice, and the
  default is `false` (the directive is included).
- `soapVersion`: When provided, the correct SOAP namespace and content type will
  be used for the given version. The adapter supports `'1.1'` and `'1.2'`.
  Default is no soap version.
- `soapPrefix`: You may specify a soap prefix to use instead of the default
  `'soap'` prefix. This is an alternative to specifying the soap namespace with
  the wanted prefix in `namespaces`.
- `soapAction`: When set to `true`, a soap action will be generated with the
  namespace from the document or `soapActionNamespace`, and set according to the
  given `soapVersion`. For verson 1.1, it will be set as a header, for version
  1.2 it will be added to the content type. When `soapAction` is a string, it
  will be used as the soap action instead of generating one. Default is to set
  no soap action.
- `soapActionNamespace`: When set, the provided namespace (typically an url)
  will be used when generating the soap action, instead of the namespace from
  the root element.
- `hideSoapEnvelope`: When set to `true` – and with a `soapVersion` set, the
  envelope element in soap documents will be removed, and the normalized data
  will have `body` and possibly `header` properties at the top level.
  When serializing, the envelope and any `body` and `header` will be set as
  expected. If there is no `body` or `header`, the `data` itself will be used
  as a soap body. This is just a simple abstraction to avoid starting all paths
  with `soap:Envelope.soap:Body`. When serializing (to the service), the
  elements are "put back", using `body` as the soap body and `header` as the
  soap header. Default is `true`, which means you only need to include a
  `soapVersion` to get this behavior.
- `dontDoubleEncode`: When set to `true`, special characters that are already
  encoded will not be encoded again. For example, `'&#248;'` will not be encoded
  to `'$amp;#248;'`. Default is `false`.
- `treatNullAsEmpty`: Set to `true` do have `null` values become a simple empty
  element. Default is `false`, which means elements containing `null` will be
  marked with the `xsi:nil="true"` attribute.

### XML transformer

The package also includes a transformer, that works exactly like the adapter,
except it is intended for use in mutation pipelines with
`{ $transform: 'xml' }`.

**Note:** The XML transformer will not be affected by flipping a mutation
object, like some other transformers. This is because it's unlikely that we want
the XML to be stringified from a service and parsed to a service. We'll probably
provide a reversed transformer for those rare cases at some point.

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

You may include the `namespaces`, `hideXmlDirective`, `soapVersion`,
`soapPrefix`, and `hideSoapEnvelope` options like this:

```javascript
{
  $transform: 'xml',
  namspaces: {
    'env': 'http://www.w3.org/2003/05/soap-envelope',
    '': 'http://example.com/webservices',
  },
  soapVersion: '1.1',
  soapPrefix: 'env', // Not really needed here, as we have included the soap namespace in `namespaces`
  hideXmlDirective: false,
  hideSoapEnvelope: true
}
```

Note that `hideXmlDirective` is `true` by default in the transformer, unlike the
adapter version.

The `includeHeaders`, `soapAction`, and `soapActionNamespace` options do not
apply to the transformer.

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

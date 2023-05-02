# XML adapter for Integreat

Adapter that lets
[Integreat](https://github.com/integreat-io/integreat) send and receive content
in XML.

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
    includeHeaders: true
  },
  endpoints: [
    { options: { uri: 'https://api.com/entries.xml' } }
  ]
}
```

Data headers for sending with content-type `text/xml;charset=utf-8`, will be set
when you set the `includeHeaders` option to `true`.

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

# fastify-sentry

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)](http://commitizen.github.io/cz-cli/)
[![pipeline status](https://github.com/immobiliare/fastify-metrics/badges/develop/pipeline.svg)](https://github.com/immobiliare/fastify-metrics/commits/develop)
[![coverage report](https://github.com/immobiliare/fastify-metrics/badges/develop/coverage.svg)](https://github.com/immobiliare/fastify-metrics/commits/develop)

> [Fastify](https://www.fastify.io/) plugin that integrates [Sentry](https://sentry.io/) error reporting.

Supports Fastify versions `>=3.0.0`.

This plugin registers a default errorHandler that uses `Sentry` to report errors and also decorates the `fastify` instance with the `Sentry` object.

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
    + [overriding the allowed status codes](#overriding-the-allowed-status-codes)
    + [using a custom error handler](#using-a-custom-error-handler)
    + [using Sentry outside the error handler](#using-sentry-outside-the-error-handler)
  * [Note](#note)
- [API](#api)
  * [Configuration `options`](#configuration-options)
    + [`onErrorFactory(options)`](#onerrorfactoryoptions)
      - [options](#options)
      - [returns](#returns)
- [Contributing](#contributing)

<!-- tocstop -->

## Installation

You can install it with `npm`

```bash
# lastest stable version
$ npm i -S @immobiliarelabs/fastify-sentry
# latest development version
$ npm i -S @immobiliarelabs/fastify-sentry@next
```

or `yarn`

```bash
# lastest stable version
$ yarn add @immobiliarelabs/fastify-sentry
# latest development version
$ yarn @immobiliarelabs/fastify-sentry@next
```

## Usage

```js
const fastify = require('fastify')();

fastify.register(require('@immobiliarelabs/fastify-sentry'), {
    dsn: '<your sentry dsn>',
    environment: 'production',
    release: '1.0.0',
});
```

#### overriding the allowed status codes

```js
const fastify = require('fastify')();

fastify.register(require('@immobiliarelabs/fastify-sentry'), {
    dsn: '<your sentry dsn>',
    environment: 'production',
    release: '1.0.0',
    allowedStatusCodes: [404],
});
```

#### using a custom error handler

```js
const fastify = require('fastify')();

fastify.register(require('@immobiliarelabs/fastify-sentry'), {
    dsn: '<your sentry dsn>',
    environment: 'production',
    release: '1.0.0',
    onErrorFactory: ({ environment, allowedStatusCodes, fastify }) => {
        return (error, request, reply) => {
            reply.send(error);
            if (environment === 'production' && reply.res.statusCode === 500) {
                fastify.Sentry.captureException(error);
            }
        };
    },
});
```

#### using Sentry outside the error handler

```js
const fastify = require('fastify')();

fastify.register(require('@immobiliarelabs/fastify-sentry'), {
    dsn: '<your sentry dsn>',
    environment: 'production',
    release: '1.0.0',
});

fastify.get('/user/:id', async (req, reply) => {
    const user = await getUserFromStorage(req.params.id);
    if (user.blocked) {
        // Beware of using Sentry in routes handlers, it is very slow!
        // It is just shown here just as an example of usage outside fastify
        // error handler.
        fastify.Sentry.captureMessage('Blocked user tried to get in');
        ...
    } else {
        ...
    }
});
```

### Note

Beware of using the Sentry SDK in route handlers outside the default error handler. It is a slow package with a lot of sync code, you will see performance degrading a lot, see [this issue](https://github.com/immobiliare/fastify-metrics/issues/18) and the benchmarks:

-   [error handler without Sentry](./benchmarks/base.txt)
-   [error handler with Sentry](./benchmarks/plugin.txt)

## API

This module exports a [plugin registration function](https://github.com/fastify/fastify/blob/2.x/docs/Plugins-Guide.md#register).

The exported plugin decorates the `fastify` instance with a `Sentry` object and adds a custom `errorHandler` that reports to Sentry all the errors with a status code that is not in the `allowedStatusCodes` list.

### Configuration `options`

> The plugin extends [the standard Sentry options](https://docs.sentry.io/platforms/node/configuration/options/) with the following properties:

| key  | type  | description | default |
| --- | --- | ----- | ------ |
| `environment` | String | Sentry SDK environment. Defaults to `local` (see https://docs.sentry.io/error-reporting/configuration/?platform=node#environment | 'local' |               
| `defaultIntegration` | Boolean | Include the default SDK integrations (see https://docs.sentry.io/error-reporting/configuration/?platform=node#default-integrations and https://docs.sentry.io/platforms/node/default-integrations/ |  `false` |
| `autoSessionTracking` | Boolean | Enable automatic tracking of releases health (see https://docs.sentry.io/product/releases/health/). |`false` |
| `allowedStatusCodes` | Number[] | A list of status code that will not cause a report to Sentry. If you pass a list it **not** merged with the default one | [`400`, `401`, `402`, `403`, `404`, `405`, `406`, `407`, `408`, `409`, `410`, `411`, `412`, `413`, `414`, `415`, `416`, `416`, `416`, `416`, `417`, `418`, `421`, `422`, `423`, `424`, `425`, `426`, `428`, `429`, `431`, `451`] |
| `onErrorFactory`     | Function          | Custom `onError` factory function, see [onErrorFactory](#onerrorfactoryoptions). | default factory which generates an handler that reports to Sentry all errors that haven't the status code listed in the `allowedStatusCodes` list                                                                                |


#### `onErrorFactory(options)`

> The error handler factory which returns a function that will be passed to [`fastify.setErrorHandler`](https://github.com/fastify/fastify/blob/2.x/docs/Server.md#seterrorhandler).

##### options

`Object`

-   `options.environment`: the environment string passed to the plugin options
-   `options.allowedStatusCodes`: the `allowedStatusCodes` list passed to the plugin options
-   `options.fastify`: the fastify instance

##### returns

`Function`

## Contributing

See [the contributing section](./CONTRIBUTING.md).

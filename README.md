<h1 align="center">fastify-sentry</h1>

![release workflow](https://img.shields.io/github/workflow/status/immobiliare/fastify-sentry/Release)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier?style=flat-square)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
![npm (scoped)](https://img.shields.io/npm/v/@immobiliarelabs/fastify-sentry)
![license](https://img.shields.io/github/license/immobiliare/fastify-sentry)

> In our [Fastify](https://www.fastify.io/) applications, no matter how good our code is sometimes errors happens, we may need to catch and send them to [Sentry](https://sentry.io/) for further analysis! This plugin aim to do just that, as easily as possible!

Plug, add your Sentry's `DSN` and you're good to go!
This plugin standardize options and payload format then registers a default errorHandler that uses `Sentry` to report errors, it also decorates the `fastify` instance with the `Sentry` object so you can use it for your custom needs.

## Table of contents

<!-- toc -->

- [Installation](#installation)
- [Usage](#usage)
  * [Customization](#customization)
    + [overriding the allowed status codes](#overriding-the-allowed-status-codes)
    + [using a custom error handler](#using-a-custom-error-handler)
    + [using Sentry outside the error handler](#using-sentry-outside-the-error-handler)
  * [Benchmarks](#benchmarks)
- [API](#api)
  * [Configuration `options`](#configuration-options)
    + [`onErrorFactory(options)`](#onerrorfactoryoptions)
      - [options](#options)
      - [returns](#returns)
- [Compatibility](#compatibility)
- [Powered Apps](#powered-apps)
- [Support & Contribute](#support--contribute)
- [License](#license)

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

### Customization

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
        fastify.Sentry.captureMessage('Blocked user tried to get in');
        ...
    } else {
        ...
    }
});
```

### Benchmarks

As for everything, using Sentry comes at a cost:

- [error handler without Sentry](./benchmarks/base.txt)
- [error handler with Sentry](./benchmarks/plugin.txt)

## API

This module exports a [plugin registration function](https://github.com/fastify/fastify/blob/2.x/docs/Plugins-Guide.md#register).

The exported plugin decorates the `fastify` instance with a `Sentry` object and adds a custom `errorHandler` that reports to Sentry all the errors with a status code that is not in the `allowedStatusCodes` list.

### Configuration `options`

> The plugin extends [the standard Sentry options](https://docs.sentry.io/platforms/node/configuration/options/) with the following properties:

| key  | type  | description | default |
| --- | --- | ----- | ------ |
| `environment` | String | Sentry SDK environment. Defaults to `local` (see [environment](https://docs.sentry.io/error-reporting/configuration/?platform=node#environment) | 'local' |               
| `defaultIntegration` | Boolean | Include the default SDK integrations (see [node#default-integrations](https://docs.sentry.io/error-reporting/configuration/?platform=node#default-integrations) and [default-integrations](https://docs.sentry.io/platforms/node/default-integrations/) |  `false` |
| `autoSessionTracking` | Boolean | Enable automatic tracking of releases health (see [health](https://docs.sentry.io/product/releases/health/)). |`false` |
| `allowedStatusCodes` | Number[] | A list of status code that will not cause a report to Sentry. If you pass a list it **not** merged with the default one | `[400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 416, 416, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451]` |
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

## Compatibility

|  | Version        |
| ---     | ---            |
| fastify | `>=3.0.0`        |
| sentry | `^6.13.3`        |

## Powered Apps

`fastify-sentry` was created by the amazing Node.js team at [ImmobiliareLabs](https://github.com/immobiliare), the Tech dept of [Immobiliare.it](https://www.immobiliare.it), the #1 real estate company in Italy.

We are currently using `fastify-sentry` in our products as well as our internal toolings.

**If you are using fastify-sentry in production [drop us a message](mailto://opensource@immobiliare.it)**.

## Support & Contribute

Made with ❤️ by [ImmobiliareLabs](https://github.com/immobiliare) & [Contributors](./CONTRIBUTING.md#contributors)

We'd love for you to contribute to `fastify-sentry`!
If you have any questions on how to use `fastify-sentry`, bugs and enhancement please feel free to reach out by opening a [GitHub Issue](https://github.com/immobiliare/fastify-sentry/issues).

## License

`fastify-sentry` is licensed under the MIT license.  
See the [LICENSE](./LICENSE) file for more information.


[![Release](https://github.com/immobiliare/fastify-sentry/actions/workflows/release.yml/badge.svg)](https://github.com/immobiliare/fastify-sentry/actions/workflows/release.yml)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier?style=flat-square)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
![npm (scoped)](https://img.shields.io/npm/v/@immobiliarelabs/fastify-sentry)
![license](https://img.shields.io/github/license/immobiliare/fastify-sentry)

# ⚠️ No longer maintained ⚠️

Given that the latest release of the Sentry SDK has an [official integration for Fastify](https://docs.sentry.io/platforms/javascript/guides/fastify/) that already covers all the needs, after some [thought](https://github.com/immobiliare/fastify-sentry/issues/729) we decided to no longer maintain this plugin.
We are grateful for all the people that found it useful and all the people that contributed to it to make it better.

-------

> In our [Fastify](https://www.fastify.io/) applications, no matter how good our code is sometimes errors happens, we may need to catch and send them to [Sentry](https://sentry.io/) for further analysis! This plugin aim to do just that, as easily as possible!

Plug, add your Sentry's `DSN` and you're good to go!
This plugin standardize options and payload format then registers a default errorHandler that uses `Sentry` to report errors, it also decorates the `fastify` instance with the `Sentry` object so you can use it for your custom needs.

> ⚠️ Fastify 4 introduced some breaking changes, please refer to [this](#fastify-version-support) version support table to find what works best for you!

## Table of contents

<!-- toc -->

- [Installation](#installation)
- [Migration guides](#migration-guides)
- [Usage](#usage)
  * [using Sentry in a route handler](#using-sentry-in-a-route-handler)
  * [Benchmarks](#benchmarks)
- [API](#api)
  * [Configuration `options`](#configuration-options)
    + [setErrorHandler](#seterrorhandler)
    + [shouldHandleError](#shouldhandleerror)
    + [errorResponse](#errorresponse)
    + [getTransactionName](#gettransactionname)
    + [extractRequestData](#extractrequestdata)
    + [extractUserData](#extractuserdata)
    + [skipInit](#skipinit)
  * [utils](#utils)
    + [getTransactionName](#gettransactionname-1)
    + [extractRequestData](#extractrequestdata-1)
    + [extractUserData](#extractuserdata-1)
    + [tryToExtractBody](#trytoextractbody)
    + [extractPathForTransaction](#extractpathfortransaction)
    + [shouldHandleError](#shouldhandleerror-1)
    + [errorResponse](#errorresponse-1)
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
$ yarn add @immobiliarelabs/fastify-sentry@next
```

## Migration guides

Please check these [migration guides](./MIGRATION_GUIDE.md) if you are migrating from an older version of the plugin.

## Usage

```js
const fastify = require('fastify')();

fastify.register(require('@immobiliarelabs/fastify-sentry'), {
    dsn: '<your sentry dsn>',
    environment: 'production',
    release: '1.0.0',
});
```

### using Sentry in a route handler

```js
const fastify = require('fastify')();

fastify.register(require('@immobiliarelabs/fastify-sentry'), {
    dsn: '<your sentry dsn>',
    environment: 'production',
    release: '1.0.0',
});

fastify.get('/user/:id', async function (req, reply) {
    const user = await getUserFromStorage(req.params.id);
    if (user.blocked) {
        this.Sentry.captureMessage('Blocked user tried to get in');
        ...
    } else {
        ...
    }
});
```

You can find more examples of usage in the [examples](./examples/) folder :wink:.

### Benchmarks

As for everything, using Sentry comes at a cost. You can see the benchmarks [here](./benchmarks/)

## API

This module exports a [plugin registration function](https://github.com/fastify/fastify/blob/2.x/docs/Plugins-Guide.md#register).

The exported plugin adds the following decorators:

* `fastify.Sentry`: a reference to the `Sentry` instance
* `reply.sentryEventId` `<string>`: the id of a captured exception, accessible when defining a custom `errorResponse` handler in the plugin options
* `reply.sentryTransaction`: the current request transaction, accessible when enabling tracing in `Sentry`

and adds a custom error handler that reports to Sentry all the errors that have a `5xx` status code.

### Configuration `options`

> The plugin extends [the standard Sentry options object](https://docs.sentry.io/platforms/node/configuration/options/) with the following properties:


#### setErrorHandler

> Attach the default error handler to the `fastify` instance.

**type**: `boolean`

**default**: `true`

#### shouldHandleError

> Decide if the error should be sent to `Sentry`

This function is called in the default error handler that the plugin adds.

**type**: `function`

**parameters**:

* `error` `<FastifyError>`
* `request` `<FastifyRequest>`
* `reply` `<FastifyReply>`

**returns**:

`boolean`: `true` if the error should be sent, `false` otherwise.

**default**: a function that returns `true` if the status code of the error is `5xx`

#### errorResponse

> Custom handler to respond the client.

This function is called in the dafult error handler right after the exception is captured, so the `reply` is decorated with event id assigned by the `Sentry` SDK.

**type**: `function`

**parameters**:

* `error` `<FastifyError>`
* `request` `<FastifyRequest>`
* `reply` `<FastifyReply>`

**returns**: `void`

#### getTransactionName

> Get the request transaction name.

**type**: `function`

**parameters**:

* `request` `<FastifyRequest>`

**returns**: `string`

#### extractRequestData

> Extract request metadata to attach the `Sentry` event.

**type**: `function`

**parameters**:

* `request` `<FastifyRequest>`
* `keys` `<string[]>` the fields to extract from the request (`headers`, `method`, `protocol`, `url`, `cookies`, `query_string`, `data`)

**returns**: `object` containing the extracted metadata. It can contain one or more properties named after the `keys` passed as parameter as well as other properties.

**default**: a function that returns an object like this:

```js
{
    headers: {},
    method: 'method,
    protocol: 'https,
    cookies: {},
    query_string: {},
    data: 'request body as string'
}
```

#### extractUserData

> Extract user metadata to attach the `Sentry` event.

**type**: `function`

**parameters**:

* `request` `<FastifyRequest>`

**returns**: `object` containing the extracted metadata.

**default**: a function that looks for a user object in the `request` and returns an object like this:

```js
{
    id: '',
    username: '',
    email: '',
}
```

#### skipInit

> Skip the `Sentry.init` call that initializes the SDK. Useful if working in an environment that already initializes the Sentry SDK.

**type**: `boolean`

**default**: `false`


### utils

The package has a `/utils` export that you can import

with `CommonJS`

```js
const utils = require('@immobiliarelabs/fastify-sentry/utils')
```

or `ESM`

```js
import utils from '@immobiliarelabs/fastify-sentry/utils'
```

and has a set of utilities used internally that can be useful when implementing your custom functions to pass to the plugin initialization.

#### getTransactionName

> This is the default function used to build the transaction name.

#### extractRequestData

> This is the default function used to extract the request metadata.

#### extractUserData

> The default function used to extract the user metadata.

#### tryToExtractBody

> The default function used to extract the body from the request.

#### extractPathForTransaction

> An internal function used to get the transaction name and source.

#### shouldHandleError

> The default function used to decide if an error event should be sent to Sentry.

#### errorResponse

> The default function used to reply to a request that errored.

## Compatibility

|  | Version        |
| ---     | ---            |
| fastify | `>=4.0.0`        |
| sentry | `^7.0.0`        |
| Node.js | `>=18` |

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

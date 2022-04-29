# Migrating from v1 to v2

## Config options

We  don't override any of the Sentry SDK options during the plugin initialization.

### V1

```js
const fastify = require('fastify')();

fastify.register(require('@immobiliarelabs/fastify-sentry'), {
    dsn: ...,
});
```

### V2

> The equivalent of the default config in version 1 would be

```js
const fastify = require('fastify')();

fastify.register(require('@immobiliarelabs/fastify-sentry'), {
    dsn: ...,
    environment: 'Local',
    defaultIntegrations: false,
    autoSessionTracking: false,
});
```

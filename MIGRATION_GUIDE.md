# Migrating from v4 to v5

<!-- toc -->

- [Filtering events](#filtering-events)
  * [v4](#v4)
  * [v5](#v5)
- [Custom error handler](#custom-error-handler)
  * [v4](#v4-1)
  * [v5](#v5-1)

<!-- tocstop -->

## Filtering events

### v4

```js
const fastify = require('fastify');
const sentry = require('@immobiliarelabs/fastify-sentry');

const app = fastify();

app.register(sentry, {
    allowedStatusCodes: [404]
});
```

### v5

```js
const sentry = require('@immobiliarelabs/fastify-sentry');

const app = fastify();

app.register(sentry, {
    shouldHandleError(error, request, reply) {
        if (error.statusCode === 404) {
            return false
        }
        return true
    }
});
```

## Custom error handler

### v4

```js
const fastify = require('fastify');
const sentry = require('@immobiliarelabs/fastify-sentry');

const app = fastify();

app.register(sentry, {
    onErrorFactory({ allowedStatusCodes }) {
        ...
    }
});
```

### v5

```js
const fastify = require('fastify');
const sentry = require('@immobiliarelabs/fastify-sentry');

const app = fastify();

app.register(sentry, {
    setErrorHandler: false
});

app.setErrorHandler(function (error, request, reply) {
    ...
})
```



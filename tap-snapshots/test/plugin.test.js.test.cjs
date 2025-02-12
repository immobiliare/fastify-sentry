/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict';
exports[
  `test/plugin.test.js > TAP > custom extractRequestData > must match snapshot 1`
] = `
Object {
  "breadcrumbs": undefined,
  "environment": "fastify-sentry-test",
  "platform": "node",
  "request": Object {
    "user": Object {},
  },
  "tags": Object {
    "transaction": "GET /oops",
  },
  "transaction": "GET /oops",
  "user": Object {
    "ip_address": "127.0.0.1",
  },
}
`;

exports[
  `test/plugin.test.js > TAP > custom extractRequestData > must match snapshot 2`
] = `
Object {
  "breadcrumbs": undefined,
  "environment": "fastify-sentry-test",
  "platform": "node",
  "request": Object {
    "user": Object {},
  },
  "tags": Object {
    "transaction": "POST /body",
  },
  "transaction": "POST /body",
  "user": Object {
    "ip_address": "127.0.0.1",
  },
}
`;

exports[
  `test/plugin.test.js > TAP > event with transactions disabled > must match snapshot 1`
] = `
Object {
  "cookies": Object {},
  "headers": Object {
    "host": "localhost:80",
    "user-agent": "lightMyRequest",
  },
  "method": "GET",
  "query_string": Object {},
}
`;

exports[
  `test/plugin.test.js > TAP > event with transactions disabled > must match snapshot 2`
] = `
Object {
  "breadcrumbs": undefined,
  "environment": "fastify-sentry-test",
  "platform": "node",
  "tags": undefined,
  "transaction": "GET /oops",
  "user": Object {
    "email": "some@example.com",
    "ip_address": "127.0.0.1",
    "username": "some",
  },
}
`;

exports[
  `test/plugin.test.js > TAP > event with transactions disabled > must match snapshot 3`
] = `
Object {
  "cookies": Object {},
  "data": "{\\"some\\":\\"some\\"}",
  "headers": Object {
    "content-length": "15",
    "content-type": "application/json",
    "host": "localhost:80",
    "user-agent": "lightMyRequest",
  },
  "method": "POST",
  "query_string": Object {},
}
`;

exports[
  `test/plugin.test.js > TAP > event with transactions disabled > must match snapshot 4`
] = `
Object {
  "breadcrumbs": undefined,
  "environment": "fastify-sentry-test",
  "platform": "node",
  "tags": undefined,
  "transaction": "POST /body",
  "user": Object {
    "email": "some@example.com",
    "ip_address": "127.0.0.1",
    "username": "some",
  },
}
`;

exports[
  `test/plugin.test.js > TAP > event with transactions enabled > must match snapshot 1`
] = `
Object {
  "cookies": Object {},
  "headers": Object {
    "host": "localhost:80",
    "user-agent": "lightMyRequest",
  },
  "method": "GET",
  "query_string": Object {},
  "user": Object {
    "email": "some@example.com",
    "username": "some",
  },
}
`;

exports[
  `test/plugin.test.js > TAP > event with transactions enabled > must match snapshot 2`
] = `
Object {
  "breadcrumbs": undefined,
  "environment": "fastify-sentry-test",
  "platform": "node",
  "tags": Object {
    "transaction": "GET /oops",
  },
  "transaction": "GET /oops",
  "user": Object {
    "email": "some@example.com",
    "ip_address": "127.0.0.1",
    "username": "some",
  },
}
`;

exports[
  `test/plugin.test.js > TAP > event with transactions enabled > must match snapshot 3`
] = `
Object {
  "cookies": Object {},
  "data": "{\\"some\\":\\"some\\"}",
  "headers": Object {
    "content-length": "15",
    "content-type": "application/json",
    "host": "localhost:80",
    "user-agent": "lightMyRequest",
  },
  "method": "POST",
  "query_string": Object {},
  "user": Object {
    "email": "some@example.com",
    "username": "some",
  },
}
`;

exports[
  `test/plugin.test.js > TAP > event with transactions enabled > must match snapshot 4`
] = `
Object {
  "breadcrumbs": undefined,
  "environment": "fastify-sentry-test",
  "platform": "node",
  "tags": Object {
    "transaction": "POST /body",
  },
  "transaction": "POST /body",
  "user": Object {
    "email": "some@example.com",
    "ip_address": "127.0.0.1",
    "username": "some",
  },
}
`;

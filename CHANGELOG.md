## [7.0.1](https://github.com/immobiliare/fastify-sentry/compare/v7.0.0...v7.0.1) (2023-08-28)


### Bug Fixes

* **types:** fix missing dsn option ([937e44b](https://github.com/immobiliare/fastify-sentry/commit/937e44ba5c3a50da507820fef5026635837558b3))

# [7.0.0](https://github.com/immobiliare/fastify-sentry/compare/v6.0.10...v7.0.0) (2023-08-25)


### Bug Fixes

* **types:** fix node16 resolution ([87d4038](https://github.com/immobiliare/fastify-sentry/commit/87d4038b1370aee3856730e967fb2e9bc93572c6))

## [6.0.10](https://github.com/immobiliare/fastify-sentry/compare/v6.0.9...v6.0.10) (2023-07-26)

## [6.0.9](https://github.com/immobiliare/fastify-sentry/compare/v6.0.8...v6.0.9) (2023-07-19)

## [6.0.8](https://github.com/immobiliare/fastify-sentry/compare/v6.0.7...v6.0.8) (2023-07-14)

## [6.0.7](https://github.com/immobiliare/fastify-sentry/compare/v6.0.6...v6.0.7) (2023-06-30)

## [6.0.6](https://github.com/immobiliare/fastify-sentry/compare/v6.0.5...v6.0.6) (2023-06-20)

## [6.0.5](https://github.com/immobiliare/fastify-sentry/compare/v6.0.4...v6.0.5) (2023-06-15)

## [6.0.4](https://github.com/immobiliare/fastify-sentry/compare/v6.0.3...v6.0.4) (2023-06-14)

## [6.0.3](https://github.com/immobiliare/fastify-sentry/compare/v6.0.2...v6.0.3) (2023-06-09)

## [6.0.2](https://github.com/immobiliare/fastify-sentry/compare/v6.0.1...v6.0.2) (2023-05-30)

## [6.0.1](https://github.com/immobiliare/fastify-sentry/compare/v6.0.0...v6.0.1) (2023-04-21)


### Reverts

* Revert "ci(npm): adds npm provenance" ([11c6272](https://github.com/immobiliare/fastify-sentry/commit/11c62721f27c4c5a25df276b52d42fe72dbeda27))

# [6.0.0](https://github.com/immobiliare/fastify-sentry/compare/v5.0.2...v6.0.0) (2023-04-21)


### Bug Fixes

* **package:** pin exact sentry packages version ([a7d72fe](https://github.com/immobiliare/fastify-sentry/commit/a7d72fedaf06beb5207306f3160fa960f8751ea2))
* **sentry:** remove domain ([12ad7d0](https://github.com/immobiliare/fastify-sentry/commit/12ad7d0f944a2c293e02d98d61f65cf69a6b7cab))
* **test:** disable autoSessionTracking ([180c559](https://github.com/immobiliare/fastify-sentry/commit/180c5597950d190268a2a1e8008d8ba6fcdbd8ef))


### Build System

* drop node 14 support ([60482e2](https://github.com/immobiliare/fastify-sentry/commit/60482e29db28010850decd7b89b5545b409ed0d6))


### BREAKING CHANGES

* Node 14 is not supported anymore

## [5.0.2](https://github.com/immobiliare/fastify-sentry/compare/v5.0.1...v5.0.2) (2023-01-17)


### Bug Fixes

* hardcode plugin name ([9a5b916](https://github.com/immobiliare/fastify-sentry/commit/9a5b91691c3b9249a0926da006bfd66f873a5d1a))

## [5.0.1](https://github.com/immobiliare/fastify-sentry/compare/v5.0.0...v5.0.1) (2022-12-15)


### Bug Fixes

* make sure user and http method is available in metadata ([1ecbda4](https://github.com/immobiliare/fastify-sentry/commit/1ecbda45bef86ebacdc75e0d22fcec7ad8f02a0c))
* update distributed tracing logic ([ca19506](https://github.com/immobiliare/fastify-sentry/commit/ca1950692cf7b0f44c41d1025a34b0f51df829fb))

# [5.0.0](https://github.com/immobiliare/fastify-sentry/compare/v4.1.2...v5.0.0) (2022-11-08)


### Bug Fixes

* upgrade fastify-plugin from 4.2.1 to 4.3.0 ([0b35f18](https://github.com/immobiliare/fastify-sentry/commit/0b35f181ad031f0b47cd8e57e39261637d0f06f7))


### Features

* improve integration with sentry sdk ([c20e45b](https://github.com/immobiliare/fastify-sentry/commit/c20e45b4231645a0a8cbde3569da7051ccaa6ce2))


### BREAKING CHANGES

* the plugin configuration interface is completely different.

# [5.0.0-next.1](https://github.com/immobiliare/fastify-sentry/compare/v4.1.1...v5.0.0-next.1) (2022-10-13)


### Features

* improve integration with sentry sdk ([c20e45b](https://github.com/immobiliare/fastify-sentry/commit/c20e45b4231645a0a8cbde3569da7051ccaa6ce2))


### BREAKING CHANGES

* the plugin configuration interface is completely different.

## [4.1.2](https://github.com/immobiliare/fastify-sentry/compare/v4.1.1...v4.1.2) (2022-10-28)


### Bug Fixes

* **deps:** sentry broken version chain ([31a372d](https://github.com/immobiliare/fastify-sentry/commit/31a372d4f6c6b8584e16536737e977e25df8f741)), closes [#274](https://github.com/immobiliare/fastify-sentry/issues/274)

## [4.1.1](https://github.com/immobiliare/fastify-sentry/compare/v4.1.0...v4.1.1) (2022-08-24)


### Bug Fixes

* don't override validation errors ([73317b1](https://github.com/immobiliare/fastify-sentry/commit/73317b16072b8650f6aa5dac3d0581be7ac6baba))

# [4.1.0](https://github.com/immobiliare/fastify-sentry/compare/v4.0.1...v4.1.0) (2022-07-18)


### Features

* fastify@4.2.1 fastify-plugin@4.x ([2af8e32](https://github.com/immobiliare/fastify-sentry/commit/2af8e32239c249369e32c36ffc73e894fc092cec)), closes [#183](https://github.com/immobiliare/fastify-sentry/issues/183) [#186](https://github.com/immobiliare/fastify-sentry/issues/186)

## [4.0.1](https://github.com/immobiliare/fastify-sentry/compare/v4.0.0...v4.0.1) (2022-06-22)


### Bug Fixes

* **fastify:** pin to version 4.x ([78d3937](https://github.com/immobiliare/fastify-sentry/commit/78d39377615058cc9f9e549ce4e1af60fb67c24e))

# [4.0.0](https://github.com/immobiliare/fastify-sentry/compare/v3.1.0...v4.0.0) (2022-06-21)


### Features

* **fastify:** v4 ([ae1dac8](https://github.com/immobiliare/fastify-sentry/commit/ae1dac8de03a3d9d24ddec6f4186c91ecb79eed5))


### BREAKING CHANGES

* **fastify:** Updated fastify framework to new major version v4

# [3.1.0](https://github.com/immobiliare/fastify-sentry/compare/v3.0.0...v3.1.0) (2022-05-24)


### Bug Fixes

* **index.js:** support all options for for sentry initialization ([eef8b8a](https://github.com/immobiliare/fastify-sentry/commit/eef8b8a7f442c0b524875a258ae41827eeb4f38d))


### Features

* add support for @fastify/sensible errors ([27f368b](https://github.com/immobiliare/fastify-sentry/commit/27f368b84ff92f8f7a38db7fdea2ea181c2e68db))

# [3.0.0](https://github.com/immobiliare/fastify-sentry/compare/v2.0.1...v3.0.0) (2022-05-10)


### Features

* updates node.js ([39551bc](https://github.com/immobiliare/fastify-sentry/commit/39551bc67cc56edd0ce8ab89a280a24b9fc4ffd7))


### BREAKING CHANGES

* Node.js 12 is deprecated

## [2.0.1](https://github.com/immobiliare/fastify-sentry/compare/v2.0.0...v2.0.1) (2022-05-05)


### Bug Fixes

* change log message when no dsn is passed ([38ead32](https://github.com/immobiliare/fastify-sentry/commit/38ead3228c3eac400f4a02b7c9c49a8c1b77e1a6)), closes [#96](https://github.com/immobiliare/fastify-sentry/issues/96)

# [2.0.0](https://github.com/immobiliare/fastify-sentry/compare/v1.0.1...v2.0.0) (2022-04-29)


### Bug Fixes

* remove overriding of sentry options ([827c299](https://github.com/immobiliare/fastify-sentry/commit/827c29941fc0e3811d5bd0c2af63c37db17b879d)), closes [#22](https://github.com/immobiliare/fastify-sentry/issues/22) [#32](https://github.com/immobiliare/fastify-sentry/issues/32)


### BREAKING CHANGES

* defaultIntegrations and autoSessionTracking are not set to false anymore by default.

## [1.0.1](https://github.com/immobiliare/fastify-sentry/compare/v1.0.0...v1.0.1) (2022-02-04)


### Bug Fixes

* do not force undefined on defaultIntagrations ([7d60f26](https://github.com/immobiliare/fastify-sentry/commit/7d60f26b8ed5e90afa5eeac3e1a92d5485dcb462))

# 1.0.0 (2022-01-25)


### Bug Fixes

* require pkg.json ([e4a210d](https://github.com/immobiliare/fastify-sentry/commit/e4a210d35d6e2b2c1af90b831ac6d50506a8222a))

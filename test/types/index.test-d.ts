import { expectType } from 'tsd'
import Sentry, { Hub } from '@sentry/node'
import fastify from 'fastify'
import plugin from '../..'

const app  = fastify()
app.register(plugin).after(err => {
  if (err) throw err
  expectType<typeof Sentry>(app.Sentry)
})

app.get('/', async (request, reply) => {
  expectType<string>(reply.sentryEventId);
  expectType<ReturnType<Hub['startTransaction']>|null>(reply.sentryTransaction);
})

const app2 = fastify()
app2.register(plugin, {
  dsn: ''
})

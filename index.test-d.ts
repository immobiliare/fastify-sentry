import { expectType } from 'tsd'
import Sentry from '@sentry/node'
import fastify from 'fastify'
import plugin from './index'

const app  = fastify()
app.register(plugin).after(err => {
  if (err) throw err
  expectType<typeof Sentry>(app.Sentry)
})

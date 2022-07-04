import fastify from 'fastify';
import plugin from './index.js'

const app = fastify({ logger: true })
app.addHook('onError', function (re, reply, error, done) {
  console.log('\nonError\n')
  console.log(reply.statusCode)
  done()
})
app.register(plugin, {
  dsn: 'https://accef0e7e3e54ec28ddffde850290f42@sentry.pepita.io/15',
  environment: 'fastify-sentry'
})
app.get('/', async () => {
  throw new Error('Oops.')
})

app.listen({ port: 4000 })

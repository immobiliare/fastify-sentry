import { FastifyPluginAsync } from "fastify"

const example: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async function () {
    return 'this is an example'
  })
}

export default example;

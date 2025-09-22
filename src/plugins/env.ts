import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifyEnv from '@fastify/env'

const envSchema = {
  type: 'object',
  properties: {
    API_HOST: { type: 'string' },
    API_PORT: { type: 'number' },
  }
}

const envPlugin: FastifyPluginAsync = async (fastify, options) => {
  const envOptions = {
    confKey: 'config',
    schema: envSchema,
    dotenv: true
  }
  await fastify.register(fastifyEnv, envOptions)

  fastify.log.info('registered env plugin')
}

export default fp(envPlugin, { name: 'env' })

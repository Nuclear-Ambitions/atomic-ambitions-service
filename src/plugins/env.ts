import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import fastifyEnv from '@fastify/env'

const envSchema = {
  type: 'object',
  properties: {
    API_HOST: { type: 'string' },
    API_PORT: { type: 'number' },
    DATABASE_URL: { type: 'string' },
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'staging', 'production']
    },
  },
  required: ['API_HOST', 'API_PORT', 'DATABASE_URL', 'NODE_ENV']
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

import fastify from 'fastify'
import AutoLoad from '@fastify/autoload'
import { join } from 'path'
import * as dotenv from 'dotenv'
import errorHandler from './middleware/errorHandler'

dotenv.config()

const loggerByEnvironment: Record<string, any> = {
  development: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
      },
    },
  },
  test: false,
};
const environment = process.env.NODE_ENV || 'development'

const server = fastify({
  logger: loggerByEnvironment[environment],
})

// Autoload plugins
server.register(AutoLoad, {
  dir: join(__dirname, 'plugins'),
})

// Autoload routes
server.register(AutoLoad, {
  dir: join(__dirname, 'routes'),
})

// Register global error handler
server.setErrorHandler(errorHandler)

const start = async () => {
  server.log.info('starting server')
  try {
    await server.ready()
    const host = server.config.API_HOST || 'localhost'
    const port = server.config.API_PORT || 3300
    if (!host || !port) {
      throw new Error('API_HOST or API_PORT is not set')
    }
    server.log.info('\n' + server.printRoutes())
    await server.listen({ host, port: Number(port) })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()

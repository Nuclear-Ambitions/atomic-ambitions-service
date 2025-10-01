import { FastifyPluginAsync } from 'fastify'
import { db } from '../../../db/postgres/Database'

const registrationRoutes: FastifyPluginAsync = async (fastify, options) => {

  fastify.get('/', async (request) => {
    const results = await db.selectFrom('users').selectAll().execute()
    return results
  })

  type eventPayload = {
    actor: string | null
    details: string
  }

  fastify.post<{
    Body: eventPayload
  }>('/', async (request, reply) => {
  })

}

export default registrationRoutes
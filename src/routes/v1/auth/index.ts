import { FastifyPluginAsync } from 'fastify'


interface IQuerystring {
  username: string;
  password: string;
}

interface IHeaders {
  'h-Custom': string;
}

interface IReply {
  200: { success: boolean };
  302: { url: string };
  '4xx': { error: string };
}

const authRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get<{
    Querystring: IQuerystring;
    Headers: IHeaders;
    Reply: IReply;
  }>('/', async (request, reply) => {
    const { username, password } = request.query
    const hCustom = request.headers['h-Custom']

    fastify.log.info(`Username: ${username}, Password: ${password}, Custom header: ${hCustom}`)

    reply.code(200).send({ success: true })
  })
}

export default authRoutes
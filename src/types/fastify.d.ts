import 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      API_HOST: string;
      API_PORT: number;
    };
  }
}
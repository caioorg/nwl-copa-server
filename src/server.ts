import Fastify from "fastify";
import cors from '@fastify/cors'
import { polls } from "./routes/poll";
import { users } from "./routes/user";
import { guesses } from "./routes/guess";
import { auth } from "./routes/auth";
import fastifyJwt from "@fastify/jwt";
import { games } from "./routes/game";

async function bootstrap() {
  const fastify = Fastify({
    logger: true
  })

  await fastify.register(fastifyJwt, {
    secret: 'temqueliberaroladrao'
  })

  await fastify.register(cors, {
    origin: true
  })

  await fastify.register(auth)

  await fastify.register(polls)

  await fastify.register(users)

  await fastify.register(guesses)

  await fastify.register(games)

  await fastify.listen({ port: 3333, host: '0.0.0.0' })
}

bootstrap()
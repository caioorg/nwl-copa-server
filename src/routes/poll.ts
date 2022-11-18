import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import ShortUniqueId from 'short-unique-id'
import { prisma } from "../lib/prisma";
import { authenticate } from '../plugins/authenticate';

export async function polls(fastify: FastifyInstance) {

  // returns the number of polls created
  fastify.get('/polls/count', async () => {
    const count = await prisma.poll.count()

    return { count }
  })

  // create a polls with or without authentication
  fastify.post ('/polls', async (request, reply) => {
    const createPollBody = z.object({
      title: z.string(),
    })

    const { title } = createPollBody.parse(request.body)

    const generateCode = new ShortUniqueId({ length: 6 })
    const code = String(generateCode()).toLocaleUpperCase()

    try {
      await request.jwtVerify()

      await prisma.poll.create({
        data: {
          title,
          code,
          ownerId: request.user.sub,
          participants: {
            create: {
              userId: request.user.sub
            }
          }
        }
      })
    } catch {
      // if there is no authenticated user, we create the poll through the execution
      await prisma.poll.create({ data: { title, code } })
    }


    return reply.status(201).send({ code })
  })

  // adding the participant in the poll.
  fastify.post('/polls/join', { onRequest: [authenticate] },async (request, reply) => {
    const joinPollBody = z.object({
      code: z.string(),
    })

    const { code } = joinPollBody.parse(request.body)

    // search for the poll and check if the user who is searching is already in that poll.
    const poll = await prisma.poll.findUnique({
      where: { code },
      include: {
        participants: {
          where: {
            userId: request.user.sub
          }
        }
      }
    })

    // check if a poll already exists.
    if(!poll) return reply.status(400).send({
      message: 'Poll not found.'
    })

    // check if the user you are looking for is already in this poll.
    if(poll.participants.length > 0) {
      return reply.status(400).send({
        message: 'You already joined this poll.'
      })
    }

    // if the poll being sought does not have an owner, the first to enter becomes the owner.
    if(!poll.ownerId) {
      await prisma.poll.update({
        where: { id: poll.id },
        data: { ownerId: request.user.sub }
      })
    }

    await prisma.participant.create({
      data: {
        pollId: poll.id,
        userId: request.user.sub
      }
    })

    return reply.status(201).send()
  })


  fastify.get('/polls', { onRequest: [authenticate]}, async (request) => {
    const polls = await prisma.poll.findMany({
      where: {
        participants: { some: { userId: request.user.sub } }
      },
      include: {
        participants: { select: { id: true, user: { select: { avatarUrl: true } } }, take: 4 },
        _count: { select: { participants: true } },
        owner: { select: { name: true, id: true } }
      }
    })

    return { polls }
  })

  fastify.get('/polls/:id', { onRequest: [authenticate] }, async (request) => {
    const getPollParams = z.object({
      id: z.string()
    })

    const { id } = getPollParams.parse(request.params)

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        participants: { select: { id: true, user: { select: { avatarUrl: true } } }, take: 4 },
        _count: { select: { participants: true } },
        owner: { select: { name: true, id: true } }
      }
    })

    return { poll }
  })
}

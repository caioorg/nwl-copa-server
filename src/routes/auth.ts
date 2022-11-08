import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../plugins/authenticate";

export async function auth(fastify: FastifyInstance) {
  fastify.post('/users', async (request) => {
    const createUserBody = z.object({
      accessToken: z.string()
    })

    const { accessToken } = createUserBody.parse(request.body)

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}`}
    })

    const userData = await userResponse.json()
    
    const userInfoSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      picture: z.string().url()
    })

    const userInfo = userInfoSchema.parse(userData)

    console.log(userInfo)

    let user = await prisma.user.findUnique({
      where: {
        googleId: userInfo.id
      }
    })

    if(!user) {
      user = await prisma.user.create({
        data: {
          name: userInfo.name,
          email: userInfo.email,
          avatarUrl: userInfo.picture,
          googleId: userInfo.id
        }
      })
    }


    const token = fastify.jwt.sign({
        name: user.name, avatarUrl: user.avatarUrl
      }, {
        sub: user.id,
        expiresIn: '7 days'
      })

    return { token }
  })

  fastify.get('/me', { onRequest: [authenticate] }, async (request) => {
    
    return { user: request.user }
  })
}
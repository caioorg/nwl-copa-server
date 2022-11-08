import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'jonh@gmail.com',
      name: 'Jonh Doe',
      avatarUrl: 'https://github.com/caioorg.png'
    }
  })

  const poll = await prisma.poll.create({
    data: {
      title: 'Example Pool',
      code: 'BOL1234',
      ownerId: user.id,
      participants: {
        create: {
          userId: user.id
        }
      }
    }
  })

  await prisma.game.create({
    data: {
      date: '2022-11-04T22:07:04.532Z',
      firstTeamCountryCode: 'DE',
      secondTeamCountryCode: 'BR'
    }
  })

  await prisma.game.create({
    data: {
      date: '2022-11-05T22:07:04.532Z',
      firstTeamCountryCode: 'BR',
      secondTeamCountryCode: 'AR',
      guesses: {
        create: {
          firstTeamPoints: 2,
          secondTeamPoints: 1,
          participant: {
            connect: {
              userId_pollId: {
                userId: user.id,
                pollId: poll.id
              }
            }
          }
          
        }
      }
    }
  })
}

main()
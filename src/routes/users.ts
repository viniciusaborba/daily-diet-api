import { z } from 'zod'
import { knex } from '../database'
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/users', async (req, res) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string(),
      password: z.string(),
    })

    const { email, name, password } = createUserBodySchema.parse(req.body)

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      res.setCookie('sessionId', sessionId, {
        path: '/users',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('user').insert({
      id: randomUUID(),
      name,
      email,
      password,
      session_id: sessionId,
    })

    return res.status(201).send('Usuário criado com sucesso!')
  })

  app.get(
    '/users/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const getUserParamsSchema = z.object({
        id: z.string(),
      })

      const { id } = getUserParamsSchema.parse(req.params)

      const user = await knex('user').where({ id }).first()

      res.status(200).send(user)
    },
  )

  app.get('/users/index', async (req, res) => {
    const users = await knex('user').orderBy('created_at')

    res.status(200).send(users)
  })

  app.delete(
    '/users/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const deleteUserParamsSchema = z.object({
        id: z.string(),
      })

      const { id } = deleteUserParamsSchema.parse(req.params)

      await knex('user').where({ id }).delete()

      return res.status(200).send('Usuário excluído com sucesso')
    },
  )
}

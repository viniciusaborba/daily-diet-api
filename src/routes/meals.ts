import { z } from 'zod'
import { knex } from '../database'
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        isOnTheDiet: z.enum(['yes', 'no']),
      })

      const { sessionId } = req.cookies

      const [user] = await knex('user')
        .where('session_id', sessionId)
        .select('id')

      const userId = user.id

      const { description, name, isOnTheDiet } = createMealBodySchema.parse(
        req.body,
      )

      await knex('meal').insert({
        id: randomUUID(),
        name,
        description,
        isOnTheDiet,
        user_id: userId,
      })

      return res.status(201).send('Criado com sucesso')
    },
  )

  app.delete('/:id', async (req, res) => {
    const getMealIdParamsSchema = z.object({
      id: z.string(),
    })
    const { id } = getMealIdParamsSchema.parse(req.params)

    const { sessionId } = req.cookies

    const [user] = await knex('user')
      .where('session_id', sessionId)
      .select('id')

    const userId = user.id

    await knex('meal')
      .where({ id })
      .andWhere('user_id', userId)
      .first()
      .delete()

    return res.status(200).send('Refeição excluída com sucesso')
  })

  app.get(
    '/user_meal',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const { sessionId } = req.cookies

      const [user] = await knex('user')
        .where('session_id', sessionId)
        .select('id')

      const userId = user.id

      const meals = await knex('meal').where('user_id', userId).select()

      return { meals }
    },
  )

  app.get('/:id', async (req, res) => {
    const getMealParamsSchema = z.object({
      id: z.string(),
    })

    const { id } = getMealParamsSchema.parse(req.params)

    const meal = await knex('meal').where({ id }).first()

    return res.status(200).send(meal)
  })

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const updateMealBodySchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        isOnTheDiet: z.enum(['yes', 'no']),
      })

      const updateMealParamsSchema = z.object({
        id: z.string(),
      })

      const { description, isOnTheDiet, name } = updateMealBodySchema.parse(
        req.body,
      )
      const { id } = updateMealParamsSchema.parse(req.params)

      const { sessionId } = req.cookies

      const [user] = await knex('user')
        .where('session_id', sessionId)
        .select('id')

      const userId = user.id

      await knex('meal')
        .where({ id })
        .andWhere('user_id', userId)
        .first()
        .update({
          name,
          isOnTheDiet,
          description,
        })

      return res.status(200).send('Refeição atualizada com sucesso')
    },
  )

  app.get(
    '/diet',
    {
      preHandler: [checkSessionIdExists],
    },
    async (req, res) => {
      const { sessionId } = req.cookies

      const [user] = await knex('user')
        .where('session_id', sessionId)
        .select('id')

      const userId = user.id

      const [count] = await knex('meal')
        .count('id', { as: 'totalRegisteredMeals' })
        .where('user_id', userId)

      const onTheDietMeals = await knex('meal')
        .count('id', { as: 'totalOnTheDietMeals ' })
        .where('isOnTheDiet', 'yes')
        .andWhere('user_id', userId)

      const offTheDietMeals = await knex('meal')
        .count('id', { as: 'totalOffTheDietMeals' })
        .where('isOnTheDiet', 'no')
        .andWhere('user_id', userId)

      const mealsInfo = {
        totalRegisteredMeals: parseInt(
          JSON.parse(JSON.stringify(count)).totalRegisteredMeals,
        ),

        totalOnTheDietMeals: parseInt(
          JSON.parse(JSON.stringify(onTheDietMeals))[0].totalOnTheDietMeals,
        ),

        totalOffTheDietMeals: parseInt(
          JSON.parse(JSON.stringify(offTheDietMeals))[0].totalOffTheDietMeals,
        ),
      }

      return {
        mealsInfo,
      }
    },
  )
}

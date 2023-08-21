import { FastifyRequest, FastifyReply } from 'fastify'

export async function checkSessionIdExists(
  req: FastifyRequest,
  res: FastifyReply,
) {
  const sessionId = req.cookies.sessionId

  if (!sessionId) {
    return res.status(404).send({
      error: 'Unauthorized!',
    })
  }
}

import { Router } from 'express'
import { getConversationsController } from '~/controllers/conversation.controllers'
import { getConversationsValidator } from '~/middlewares/conversation.middlewares'
import { accessTokenValidator } from '~/middlewares/user.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const conversationRoutes = Router()

/**
 * Description: get conversations
 * Path : /
 * Method: GET
 * Headers: Bearer <access_token>
 * Body: receiver_id : string
 */

conversationRoutes.post(
  '/',
  accessTokenValidator,
  getConversationsValidator,
  wrapRequestHandler(getConversationsController)
)
export default conversationRoutes

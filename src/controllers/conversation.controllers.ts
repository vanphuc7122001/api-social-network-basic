import { NextFunction, Request, Response } from 'express'
import { CONVERSATION_MESSAGES } from '~/constants/messages'
import { GetConverSationReqBody } from '~/models/requests/Conversation.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import conversationService from '~/services/conversation.service'

export const getConversationsController = async (
  req: Request<any, any, GetConverSationReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { receiver_id } = req.body
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await conversationService.getConversations({ user_id, receiver_id })
  return res.json({
    message: CONVERSATION_MESSAGES.GET_CONVERSATIONS_SUCCESS,
    result
  })
}

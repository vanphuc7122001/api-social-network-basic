import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import { FriendReqBody } from '~/models/requests/Friend.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import { FRIEND_MESSAGES } from '~/constants/messages'
import friendService from '~/services/friend.service'

export const addFriendControllers = async (
  req: Request<ParamsDictionary, any, FriendReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { user_id_friend } = req.body
  const result = await friendService.addFriend({ user_id, user_id_friend })
  return res.json(result)
}

export const getFriendsControllers = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await friendService.getFriends(user_id)

  return res.json({
    message: FRIEND_MESSAGES.GET_FRIENDS_SUCCESS,
    result
  })
}

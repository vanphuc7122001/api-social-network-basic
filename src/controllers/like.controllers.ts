import { NextFunction, Request, Response } from 'express'
import { LIKE_MESSAGES } from '~/constants/messages'
import { LikeTweetReqBody, UnLikeReqParams } from '~/models/requests/Like.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import likeService from '~/services/like.service'

export const likeTweetController = async (
  req: Request<any, any, LikeTweetReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.body
  const result = await likeService.likeTweet(user_id, tweet_id)
  return res.json({
    message: LIKE_MESSAGES.LIKE_SUCCESS,
    result
  })
}

export const unlikeTweetController = async (req: Request<UnLikeReqParams>, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.params
  await likeService.unlikeTweet(user_id, tweet_id)
  return res.json({
    message: LIKE_MESSAGES.UNLIKE_SUCCESS
  })
}

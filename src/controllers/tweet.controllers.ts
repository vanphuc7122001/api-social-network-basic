import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import { TWEET_MESSAGES } from '~/constants/messages'
import { CreateTweetReqBody, GetTweetParams } from '~/models/requests/Tweet.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import tweetService from '~/services/tweet.service'

export const createTweetController = async (
  req: Request<ParamsDictionary, any, CreateTweetReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetService.createTweet({ user_id, body: req.body })

  res.json({
    message: TWEET_MESSAGES.CREATE_TWEET_SUCCESS,
    result
  })
}

export const getTweetController = async (req: Request<GetTweetParams>, res: Response, next: NextFunction) => {
  res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCESS
  })
}

import { NextFunction, Request, Response } from 'express'
import { TWEET_MESSAGES } from '~/constants/messages'

export const createTweetController = (req: Request, res: Response, next: NextFunction) => {
  res.json({
    message: TWEET_MESSAGES.CREATE_TWEET_SUCCESS
  })
}

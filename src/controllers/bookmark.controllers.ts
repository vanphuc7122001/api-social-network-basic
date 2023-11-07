import { NextFunction, Request, Response } from 'express'
import { BOOKMARK_MESSAGES } from '~/constants/messages'
import { BookMarkTweetReqBody, UnBookMarkReqParams } from '~/models/requests/Bookmark.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import bookmarkService from '~/services/bookmark.service'

export const bookmarkTweetController = async (
  req: Request<any, any, BookMarkTweetReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.body
  const result = await bookmarkService.bookmarkTweet(user_id, tweet_id)
  return res.json({
    message: BOOKMARK_MESSAGES.BOOKMARK_SUCCESS,
    result
  })
}

export const unbookmarkTweetController = async (
  req: Request<UnBookMarkReqParams>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { tweet_id } = req.params
  await bookmarkService.unbookmarkTweet(user_id, tweet_id)
  return res.json({
    message: BOOKMARK_MESSAGES.UNBOOKMARK_SUCCESS
  })
}

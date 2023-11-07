import { Router } from 'express'
import { bookmarkTweetController, unbookmarkTweetController } from '~/controllers/bookmark.controllers'
import { tweetIdValidator } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/user.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarkRouters = Router()

/**
 * Description : Bookmark a tweet
 * Path: /
 * Method : POST
 * Body: {tweet_id: string}
 * Headers: Bearer <access_token>
 */
bookmarkRouters.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarkTweetController)
)

/**
 * Description :  unbookmark a tweet
 * Path: /tweets/:tweet_id
 * Method : POST
 * Body: {tweet_id: string}
 * Headers: Bearer <access_token>
 */
bookmarkRouters.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unbookmarkTweetController)
)
export default bookmarkRouters

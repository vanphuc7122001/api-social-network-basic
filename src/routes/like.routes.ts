import { Router } from 'express'
import {} from '~/controllers/bookmark.controllers'
import { likeTweetController, unlikeTweetController } from '~/controllers/like.controllers'
import { tweetIdValidator } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/user.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const likeRouters = Router()

/**
 * Description : like a tweet
 * Path: /
 * Method : POST
 * Body: {tweet_id: string}
 * Headers: Bearer <access_token>
 */
likeRouters.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(likeTweetController)
)

/**
 * Description :  unlike a tweet
 * Path: /tweets/:tweet_id
 * Method : POST
 * Body: {tweet_id: string}
 * Headers: Bearer <access_token>
 */
likeRouters.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unlikeTweetController)
)
export default likeRouters

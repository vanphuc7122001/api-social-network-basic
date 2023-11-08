import { Router } from 'express'
import { createTweetController, getTweetChildrenController, getTweetController } from '~/controllers/tweet.controllers'
import {
  audienceValidator,
  createTweetValidator,
  getTweetChildrenValidator,
  tweetIdValidator
} from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/user.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetRouters = Router()

/**
 * Description : create a new tweet
 * Path: /
 * method: POST
 * Body: TweetReqBody
 */
tweetRouters.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
)

/**
 * Description : get tweet detail
 * Path: /:tweet_id
 * method: GET
 * Headers: Bearer <access_token>
 * Params: tweet_id: string
 */
tweetRouters.get(
  '/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

/**
 * Description : get tweet children
 * Path: /:tweet_id/children
 * method: GET
 * Headers: Bearer <access_token>
 * Params: tweet_id : string
 */
tweetRouters.get(
  '/:tweet_id/children',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIdValidator,
  getTweetChildrenValidator,
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
)

export default tweetRouters

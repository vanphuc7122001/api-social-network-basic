import { Router } from 'express'
import { createTweetController, getTweetController } from '~/controllers/tweet.controllers'
import { audienceValidator, createTweetValidator, tweetIdValidator } from '~/middlewares/tweet.middlewares'
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
 */
tweetRouters.get(
  '/:tweet_id',
  accessTokenValidator,
  tweetIdValidator,
  audienceValidator,
  wrapRequestHandler(getTweetController)
)

export default tweetRouters

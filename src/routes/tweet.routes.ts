import { Router } from 'express'
import { createTweetController } from '~/controllers/tweet.controllers'
import { createTweetValidator } from '~/middlewares/tweet.middlewares'
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

export default tweetRouters

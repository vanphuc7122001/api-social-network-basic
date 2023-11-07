import { Router } from 'express'
import { createTweetController } from '~/controllers/tweet.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const tweetRouters = Router()

/**
 * Description : create a new tweet
 * Path: /
 * method: POST
 * Body: TweetReqBody
 */
tweetRouters.post('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(createTweetController))

export default tweetRouters

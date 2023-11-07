import mediaRouters from './media.routes'
import staticRouters from './static.routes'
import tweetRouters from './tweet.routes'
import userRouters from './user.routes'
import { Express } from 'express'

export const initRoutes = (app: Express) => {
  app.use('/api/users', userRouters)
  app.use('/api/medias', mediaRouters)
  app.use('/api/tweets', tweetRouters)
  app.use('/static', staticRouters)
}

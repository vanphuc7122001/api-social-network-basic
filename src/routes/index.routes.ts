import bookmarkRouters from './bookmark.routes'
import likeRouters from './like.routes'
import mediaRouters from './media.routes'
import staticRouters from './static.routes'
import tweetRouters from './tweet.routes'
import userRouters from './user.routes'
import { Express } from 'express'

export const initRoutes = (app: Express) => {
  app.use('/api/users', userRouters)
  app.use('/api/medias', mediaRouters)
  app.use('/api/tweets', tweetRouters)
  app.use('/api/bookmarks', bookmarkRouters)
  app.use('/api/likes', likeRouters)
  app.use('/static', staticRouters)
}

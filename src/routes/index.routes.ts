import { Express } from 'express'

import bookmarkRouters from './bookmark.routes'
import conversationRoutes from './conversation.routes'
import friendRouters from './friend.routes'
import likeRouters from './like.routes'
import mediaRouters from './media.routes'
import searchRouters from './search.routes'
import staticRouters from './static.routes'
import tweetRouters from './tweet.routes'
import userRouters from './user.routes'

export const initRoutes = (app: Express) => {
  app.use('/api/users', userRouters)
  app.use('/api/medias', mediaRouters)
  app.use('/api/tweets', tweetRouters)
  app.use('/api/bookmarks', bookmarkRouters)
  app.use('/api/likes', likeRouters)
  app.use('/api/search', searchRouters)
  app.use('/api/friends', friendRouters)
  app.use('/api/conversations', conversationRoutes)
  app.use('/static', staticRouters)
}

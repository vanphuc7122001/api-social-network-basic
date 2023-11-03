import mediasRouter from './medias.routes'
import staticRouter from './static.routes'
import userRouter from './users.routes'
import { Express } from 'express'

export const initRoutes = (app: Express) => {
  app.use('/api/users', userRouter)
  app.use('/api/medias', mediasRouter)
  app.use('/static', staticRouter)
}

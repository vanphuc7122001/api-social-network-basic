import userRouter from './users.routes'
import { Express } from 'express'

export const initRoutes = (app: Express) => {
  app.use('/api/users', userRouter)
}

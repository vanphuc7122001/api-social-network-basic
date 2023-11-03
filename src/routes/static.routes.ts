import { Router } from 'express'
import { staticController } from '~/controllers/static.controller'

const staticRouter = Router()

staticRouter.get('/images/:name', staticController)

export default staticRouter

import { Router } from 'express'
import { staticImageController, staticVideoStreamController } from '~/controllers/static.controller'

const staticRouter = Router()

staticRouter.get('/images/:name', staticImageController)
staticRouter.get('/videos-stream/:name', staticVideoStreamController)

export default staticRouter

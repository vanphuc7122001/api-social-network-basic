import { Router } from 'express'
import { staticImageController, staticVideoStreamController } from '~/controllers/static.controller'

const staticRouters = Router()

staticRouters.get('/images/:name', staticImageController)
staticRouters.get('/videos-stream/:name', staticVideoStreamController)

export default staticRouters

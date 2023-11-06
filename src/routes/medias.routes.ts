import {
  uploadImagesController,
  uploadSignleImageController,
  uploadVideosController
} from '~/controllers/medias.controllers'
import { wrapRequestHandler } from './../utils/handlers'
import { Router } from 'express'
import { accessTokenValidator } from '~/middlewares/users.middlewares'

const mediasRouter = Router()

/**
 * Description : upload a image
 * Path: /uploads/image
 * Method: POST
 * Body : fileName
 */
mediasRouter.post('/uploads/image', accessTokenValidator, wrapRequestHandler(uploadSignleImageController))

/**
 * Description : upload multiple image
 * Path: /uploads/images
 * Method: POST
 * Body : fileName
 */
mediasRouter.post('/uploads/images', accessTokenValidator, wrapRequestHandler(uploadImagesController))

/**
 * Description : upload videos
 * Path: /uploads/videos
 * Method: POST
 * Body : video
 */
mediasRouter.post('/uploads/videos', accessTokenValidator, wrapRequestHandler(uploadVideosController))

export default mediasRouter

import {
  uploadImagesController,
  uploadSignleImageController,
  uploadVideosController
} from '~/controllers/media.controllers'
import { wrapRequestHandler } from '../utils/handlers'
import { Router } from 'express'
import { accessTokenValidator } from '~/middlewares/users.middlewares'

const mediaRouters = Router()

/**
 * Description : upload a image
 * Path: /uploads/image
 * Method: POST
 * Body : fileName
 */
mediaRouters.post('/uploads/image', accessTokenValidator, wrapRequestHandler(uploadSignleImageController))

/**
 * Description : upload multiple image
 * Path: /uploads/images
 * Method: POST
 * Body : fileName
 */
mediaRouters.post('/uploads/images', accessTokenValidator, wrapRequestHandler(uploadImagesController))

/**
 * Description : upload videos
 * Path: /uploads/videos
 * Method: POST
 * Body : video
 */
mediaRouters.post('/uploads/videos', accessTokenValidator, wrapRequestHandler(uploadVideosController))

export default mediaRouters

import {
  uploadImagesController,
  uploadSignleImageController,
  uploadVideosController
} from '~/controllers/medias.controllers'
import { wrapRequestHandler } from './../utils/handlers'
import { Router } from 'express'

const mediasRouter = Router()

/**
 * Description : upload a image
 * Path: /uploads/image
 * Method: POST
 * Body : fileName
 */
mediasRouter.post('/uploads/image', wrapRequestHandler(uploadSignleImageController))

/**
 * Description : upload multiple image
 * Path: /uploads/images
 * Method: POST
 * Body : fileName
 */
mediasRouter.post('/uploads/images', wrapRequestHandler(uploadImagesController))

/**
 * Description : upload videos
 * Path: /uploads/videos
 * Method: POST
 * Body : video
 */
mediasRouter.post('/uploads/videos', wrapRequestHandler(uploadVideosController))

export default mediasRouter

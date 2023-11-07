import { NextFunction, Request, Response } from 'express'
import { MEDIA_MESSAGES } from '~/constants/messages'
import mediaService from '~/services/media.service'

export const uploadSignleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediaService.handleUploadSignleImage(req)

  return res.send({
    message: MEDIA_MESSAGES.UPLOAD_IMAGE_SINGLE_SUCCESS,
    result
  })
}

export const uploadImagesController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediaService.handleUploadImage(req)
  return res.send({
    message: MEDIA_MESSAGES.UPLOAD_IMAGE_MULTIPLE_SUCCESS,
    result
  })
}

export const uploadVideosController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediaService.handleUploadVideo(req)
  return res.send({
    message: MEDIA_MESSAGES.UPLOAD_VIDEO_MULTIPLE_SUCCESS,
    result
  })
}

import { NextFunction, Request, Response } from 'express'
import { UPLOAD_IMAGES_DIR, UPLOAD_VIDEOS_DIR } from '~/constants/dir'
import { MEDIA_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import fs from 'fs'
import path from 'path'
import mime from 'mime'

export const staticImageController = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params
  return res.sendFile(path.resolve(UPLOAD_IMAGES_DIR, name), (err) => {
    if (err) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        message: MEDIA_MESSAGES.IMAGE_NOT_FOUND
      })
    }
  })
}

export const staticVideoStreamController = (req: Request, res: Response, next: NextFunction) => {
  const range = req.headers.range
  const { name } = req.params
  if (!range) {
    return next(new ErrorWithStatus({ message: MEDIA_MESSAGES.RANGE_IS_REQUIRE, status: HTTP_STATUS.BAD_REQUEST }))
  }

  // get video
  const videoPath = path.resolve(UPLOAD_VIDEOS_DIR, name)

  // get size video
  const videoSize = fs.statSync(videoPath).size

  // size each segment video
  const chunckSize = 10 ** 6 // 1MB

  // get start bytes from header range
  const start = Number(range.replace(/\D/g, ''))

  // get end bytes from header range
  const end = Math.min(start + chunckSize, videoSize - 1)

  // In fact, size for each segment video stream
  // It often will is  chunkSize, except last segment
  const contentLength = end - start + 1
  const contentType = mime.getType(videoPath) as string
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': contentType
  }
  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers)
  const videoStream = fs.createReadStream(videoPath, { start, end })
  videoStream.pipe(res)
}

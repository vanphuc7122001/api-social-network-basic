import { config } from 'dotenv'
import { Request } from 'express'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { isProduction } from '~/constants/config'
import { UPLOAD_IMAGES_DIR } from '~/constants/dir'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Other'
import { getNameFromFullName, handleUploadImage, handleUploadSignleImage, handleUploadVideos } from '~/utils/files'
config()

class MediaService {
  async handleUploadSignleImage(req: Request) {
    const file = await handleUploadSignleImage(req)
    const newName = getNameFromFullName(file.newFilename)
    const newPath = path.resolve(UPLOAD_IMAGES_DIR, `${newName}.jpg`)
    await sharp(file.filepath).jpeg().toFile(newPath)
    fs.unlinkSync(file.filepath)
    return {
      url: isProduction
        ? `${process.env.HOST}static/images/${newName}.jpg`
        : `http://localhost:${process.env.PORT}/static/images/${newName}.jpg`,
      type: MediaType.Image
    }
  }

  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_IMAGES_DIR, `${newName}.jpg`)
        await sharp(file.filepath).jpeg().toFile(newPath)
        fs.unlinkSync(file.filepath)
        return {
          url: isProduction
            ? `${process.env.HOST}static/images/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/static/images/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )

    return result
  }

  async handleUploadVideo(req: Request) {
    const videos = await handleUploadVideos(req)
    const result: Media[] = await Promise.all(
      videos.map(async (video) => {
        return {
          url: isProduction
            ? `${process.env.HOST}static/images/${video.newFilename}`
            : `http://localhost:${process.env.PORT}/static/images/${video.newFilename}`,
          type: MediaType.Video
        }
      })
    )

    return result
  }
}

const mediaService = new MediaService()
export default mediaService

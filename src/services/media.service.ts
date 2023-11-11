import { Request } from 'express'
import { UPLOAD_IMAGES_DIR } from '~/constants/dir'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Other'
import { getNameFromFullName, handleUploadImage, handleUploadSignleImage, handleUploadVideos } from '~/utils/files'
import { uploadFileToS3 } from '~/utils/s3'
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3'
import fsPromise from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import mime from 'mime'

class MediaService {
  async handleUploadSignleImage(req: Request) {
    const file = await handleUploadSignleImage(req)
    const newName = getNameFromFullName(file.newFilename)
    const newFullFileName = `${newName}.jpg`
    const newPath = path.resolve(UPLOAD_IMAGES_DIR, newFullFileName)
    await sharp(file.filepath).jpeg().toFile(newPath)
    const s3Result = await uploadFileToS3({
      filename: newFullFileName,
      filepath: newPath,
      contentType: mime.getType(newPath) as string
    })
    await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
    return {
      url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
      type: MediaType.Image
    }
  }

  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newFullFileName = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGES_DIR, newFullFileName)
        await sharp(file.filepath).jpeg().toFile(newPath)
        const s3Result = await uploadFileToS3({
          filename: 'images/' + newFullFileName,
          filepath: newPath,
          contentType: mime.getType(newPath) as string
        })
        await Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Image
        }
      })
    )

    return result
  }

  async handleUploadVideo(req: Request) {
    const files = await handleUploadVideos(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const s3Result = await uploadFileToS3({
          filename: 'videos/' + file.newFilename,
          filepath: file.filepath,
          contentType: mime.getType(file.filepath) as string
        })
        fsPromise.unlink(file.filepath)
        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Video
        }
      })
    )

    return result
  }
}

const mediaService = new MediaService()
export default mediaService

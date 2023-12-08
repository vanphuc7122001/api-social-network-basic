import { Request } from 'express'

import { UPLOAD_IMAGES_TEM_DIR, UPLOAD_VIDEOS_DIR } from '~/constants/dir'
import formidable, { File } from 'formidable'
import fs from 'fs'

export const initFolder = () => {
  ;[UPLOAD_VIDEOS_DIR, UPLOAD_IMAGES_TEM_DIR].forEach((folder) => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, {
        recursive: true
      })
    }
  })
}

export const handleUploadSignleImage = (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGES_TEM_DIR,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 300 * 1024, // 300KB,
    filter: function ({ name, originalFilename, mimetype }) {
      // name la ten truong nhap len originalFilename la ten file goc mimetype hau to file ex image/jpeg
      const valid = name === 'fileName' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        if (!valid) {
          form.emit('error' as any, new Error('File type is not valid') as any)
        }
      }
      return valid
    }
  })

  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      // console.log('fields', fields, 'files', files)
      // fields la cac truong gui len con lai
      // file la file gui len
      const isEmpty = Boolean(files.fileName)
      if (err) {
        return reject(err)
      }

      if (!isEmpty) {
        return reject(new Error('File is required'))
      }

      // if (files) {
      return resolve((files.fileName as File[])[0])
    })
  })
}

export const handleUploadImage = (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGES_TEM_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 300 * 1024, // 300KB,
    maxTotalFileSize: 300 * 1024,
    filter: function ({ name, originalFilename, mimetype }) {
      // name la ten truong nhap len originalFilename la ten file goc mimetype hau to file ex image/jpeg
      const valid = name === 'fileName' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        if (!valid) {
          form.emit('error' as any, new Error('File type is not valid') as any)
        }
      }
      return valid
    }
  })
  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      // console.log('fields', fields, 'files', files)
      // fields la cac truong gui len con lai
      // file la file gui len
      const isEmpty = Boolean(files.fileName)
      if (err) {
        return reject(err)
      }

      if (!isEmpty) {
        return reject(new Error('File is required'))
      }

      // if (files) {
      return resolve(files.fileName as File[])
    })
  })
}

export const handleUploadVideos = (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_VIDEOS_DIR,
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, // 300KB,
    filter: function ({ name, originalFilename, mimetype }) {
      // name la ten truong nhap len originalFilename la ten file goc mimetype hau to file ex image/jpeg
      const valid = name === 'videos' && Boolean(mimetype?.includes('video/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      const isVideo = Boolean(files.videos)
      if (err) {
        return reject(err)
      }
      if (!isVideo) {
        return reject(new Error('Video is required'))
      }
      const videos = files.videos as File[]
      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string)
        fs.renameSync(video.filepath, `${video.filepath}.${ext}`)
        video.newFilename = `${video.newFilename}.${ext}`
      })
      return resolve(files.videos as File[])
    })
  })
}

export const getNameFromFullName = (fullName: string) => {
  const name = fullName.split('.')
  name.pop()
  return name.join('')
}

const getExtension = (originalName: string) => {
  const arr = originalName.split('.')
  return arr[arr.length - 1]
}

import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { config } from 'dotenv'
import fs from 'fs'
// import path from 'path'

config()

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
})

// const filepath = fs.readFileSync(path.resolve('uploads', 'images', '8548fb02abbc94b20d825a100.jpg'))

// const parallelUploads3 = new Upload({
//   client: s3,
//   params: { Bucket: process.env.AWS_BUCKET_S3, Key: 'images/anh1.png', Body: filepath, ContentType: 'image/jpeg' },

//   tags: [
//     /*...*/
//   ], // optional tags
//   queueSize: 4, // optional concurrency configuration
//   partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
//   leavePartsOnError: false // optional manually handle dropped parts
// })

// parallelUploads3.on('httpUploadProgress', (progress) => {
//   console.log(progress)
// })

// parallelUploads3.done().then((res) => {
//   console.log(res)
// })

export const uploadFileToS3 = ({
  filename,
  filepath,
  contentType
}: {
  filename: string
  filepath: string
  contentType: string
}) => {
  const parallelUploads3 = new Upload({
    client: s3,
    params: {
      Bucket: process.env.AWS_BUCKET_S3,
      Key: filename,
      Body: fs.readFileSync(filepath),
      ContentType: contentType
    },

    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  })

  return parallelUploads3.done()
}

// s3.deleteObject(
//   {
//     Bucket: process.env.AWS_BUCKET_S3,
//     Key: 'anh.jpg'
//   },
//   (err, data) => {
//     if (err) {
//       console.log('error deleting', err)
//     }
//     console.log('delete success', data)
//   }
// )

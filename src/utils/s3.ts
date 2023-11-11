import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { envConfig } from '~/constants/config'
import fs from 'fs'

// import path from 'path'

const s3 = new S3({
  region: envConfig.awsRegion,
  credentials: {
    secretAccessKey: envConfig.awsSecretAccessKey,
    accessKeyId: envConfig.awsAccessKeyId
  }
})

// const filepath = fs.readFileSync(path.resolve('uploads', 'images', '8548fb02abbc94b20d825a100.jpg'))

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
      Bucket: envConfig.s3Bucket,
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

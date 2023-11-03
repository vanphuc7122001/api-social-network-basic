import express from 'express'
import cors from 'cors'
import { initRoutes } from './routes/index.routes'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import databaseService from './services/database.services'
import { initFolder } from './utils/files'
import path from 'node:path'
const app = express()

const port = 4000

initFolder()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/static/videos', express.static(path.resolve('uploads', 'videos')))

initRoutes(app)
databaseService.connect()

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Server listening on ${port}`)
})

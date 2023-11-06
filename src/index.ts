import express from 'express'
import cors, { CorsOptions } from 'cors'
import { initRoutes } from './routes/index.routes'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import databaseService from './services/database.services'
import { initFolder } from './utils/files'
import { UPLOAD_VIDEOS_DIR } from './constants/dir'
const app = express()

const port = 4000

const corsOptions: CorsOptions = {
  origin: process.env.CLIENT_URL,
  methods: 'GET, POST, PUT, DELETE, PATH'
}

initFolder()
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/static/videos', express.static(UPLOAD_VIDEOS_DIR))

initRoutes(app)
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexFollowers()
  databaseService.indexRefreshTokens()
})

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Server listening on ${port}`)
})

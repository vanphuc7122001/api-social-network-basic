import express from 'express'
import cors, { CorsOptions } from 'cors'
import { initRoutes } from './routes/index.routes'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import databaseService from './services/database.service'
import { initFolder } from './utils/files'
import { UPLOAD_VIDEOS_DIR } from './constants/dir'
import { createServer } from 'http'
import { initialSocket } from './utils/socket'
import { envConfig } from './constants/config'

const app = express()

const port = envConfig.port

const corsOptions: CorsOptions = {
  origin: envConfig.clientUrl,
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
  databaseService.indexTweets()
})

app.use(defaultErrorHandler)

const httpServer = createServer(app)

initialSocket(httpServer)
httpServer.listen(port, () => {
  console.log(`Server listening on ${port}`)
})

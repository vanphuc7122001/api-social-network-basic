import express from 'express'
import cors, { CorsOptions } from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
  // store: ... , // Use an external store for more precise rate limiting
})

initFolder()
app.use(cors(corsOptions))
app.use(helmet())
app.use(limiter)
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

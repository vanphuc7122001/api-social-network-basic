import express from 'express'
import { initRoutes } from './routes/index.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
const app = express()

const port = 4000

app.use(express.json())

initRoutes(app)
databaseService.connect()

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Server listening on ${port}`)
})

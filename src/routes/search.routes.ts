import { Router } from 'express'
import { searchController } from '~/controllers/search.controllers'
import { accessTokenValidator } from '~/middlewares/user.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const searchRouters = Router()

/**
 * Description : search tweets
 * Path: /
 * Method: GET
 */

searchRouters.get('/', accessTokenValidator, wrapRequestHandler(searchController))

export default searchRouters

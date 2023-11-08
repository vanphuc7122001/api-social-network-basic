import { Router } from 'express'
import { searchController } from '~/controllers/search.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/user.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const searchRouters = Router()

/**
 * Description : search tweets
 * Path: /
 * Method: GET
 */

searchRouters.get('/', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(searchController))

export default searchRouters

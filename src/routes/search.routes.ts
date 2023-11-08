import { Router } from 'express'
import { searchController } from '~/controllers/search.controllers'
import { searchValidator } from '~/middlewares/search.middlewares'
import { paginationValidator } from '~/middlewares/tweet.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/user.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const searchRouters = Router()

/**
 * Description : search tweets
 * Path: /
 * Method: GET
 */

searchRouters.get(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  paginationValidator,
  searchValidator,
  wrapRequestHandler(searchController)
)

export default searchRouters

import { Router } from 'express'
import { addFriendControllers, getFriendsControllers } from '~/controllers/friend.controllers'
import { addFriendValidator } from '~/middlewares/friend.middlewares'
import { accessTokenValidator } from '~/middlewares/user.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const friendRouters = Router()

/**
 * Description: add a friend
 * Path: '/'
 * Method: POST
 * Body: {user_id_friend: string}
 */

friendRouters.post('/', accessTokenValidator, addFriendValidator, wrapRequestHandler(addFriendControllers))

/**
 * Description: get list friend
 * Path: '/'
 * Method: POST
 * Heades: Bearer <access_token>
 */

friendRouters.get('/', accessTokenValidator, wrapRequestHandler(getFriendsControllers))
export default friendRouters

import { wrapRequestHandler } from './../utils/handlers'
import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
const userRouter = Router()

/**
 * Description: Login system
 * Method : POST
 * Path : /login
 * Body :  {email : string, password : string}
 */
userRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 * Description: Register a new user
 * Method : POST
 * Path : /register
 * Body :  {name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8261}
 */
userRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

/**
 * Description: Logout user
 * Method : POST
 * Path : /register
 * Body :  {name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8261}
 */
userRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

export default userRouter

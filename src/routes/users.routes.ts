import { wrapRequestHandler } from './../utils/handlers'
import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
const userRouter = Router()

userRouter.post('/login', loginValidator, loginController)

/*
body {name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8261}
*/
userRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

export default userRouter

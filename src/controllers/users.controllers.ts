import { Request, Response, NextFunction } from 'express'
import userService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'

export const loginController = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (email === 'dangvanphuc@gmail.com' && password === '12345') {
    return res.status(200).json({
      message: 'Login successfully'
    })
  }
  return res.status(400).json({
    message: 'Login failed'
  })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterReqBody>,
  res: Response,
  next: NextFunction
) => {
  const result = await userService.register(req.body)
  return res.json({
    result,
    message: 'Register successfully'
  })
}

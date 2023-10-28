import { ParamsDictionary } from 'express-serve-static-core'
import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'

export interface RegisterReqBody {
  name: string
  email: string
  date_of_birth: string
  password: string
  confirm_password: string
}

export interface LoginReqBody {
  email: string
  password: string
}

export interface LogoutReqBody {
  refresh_token: string
}

export interface EmailVerifyTokenReqBody {
  email_verify_token: string
}

export interface ForgotPassReqBody {
  email: string
}

export interface VerifyForgotPassReq {
  forgot_password_token: string
}

export interface ResetPassReq {
  forgot_password_token: string
  password: string
  confirm_password: string
}

export interface UpdateMeReqBody {
  name?: string
  date_of_birth?: string
  bio?: string
  location?: string
  website?: string
  username?: string
  avatar?: string
  cover_photo?: string
}

export interface GetProfileReqParams extends ParamsDictionary {
  username: string
}

export interface FollowReqBody {
  followed_user_id: string
}

export interface UnFollowReqParams extends ParamsDictionary {
  followed_user_id: string
}

export interface ChangePassReqBody {
  new_password: string
}
export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
}

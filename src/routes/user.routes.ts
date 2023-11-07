import { wrapRequestHandler } from '../utils/handlers'
import { Router } from 'express'
import {
  changePasswordController,
  emailVerifyTokenController,
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  oauthController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  unfollowController,
  updateMeController,
  verifyForgotPasswordController
} from '~/controllers/user.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
const userRouters = Router()

/**
 * Description: Login system
 * Method : POST
 * Path : /login
 * Body :  {email : string, password : string}
 */
userRouters.post('/login', loginValidator, wrapRequestHandler(loginController))

/**
 * Description: Login with google credentials
 * Path: /oauth/google
 * Method: GET
 *
 */
userRouters.get('/oauth/google', wrapRequestHandler(oauthController))

/**
 * Description: Register a new user
 * Method : POST
 * Path : /register
 * Body :  {name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8261}
 */
userRouters.post('/register', registerValidator, wrapRequestHandler(registerController))

/**
 * Description: Logout user
 * Method : POST
 * Path : /register
 * Headers : Brear Authorization
 * Body :  {name: string, email: string, password: string, confirm_password: string, date_of_birth: ISO8261}
 */
userRouters.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

/**
 * Description: refresh token
 * Method : POST
 * Path : //refresh-token
 * Body :  {refresh_token : string}
 */
userRouters.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

/**
 * Description: Verify email when user client click on link in email
 * Method : POST
 * Path : /verify-email
 * Body : email_verify_token
 */
userRouters.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyTokenController))

/**
 * Description. Resend email when user client click on the link in email
 * Path: /resend-verify-email
 * Method: POST
 * Header: { Authorization: Bearer <access_token> }
 * Body: {}
 */
userRouters.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))

/**
 * Description.  submit email to reset password, send email to user
 * Path: /forgot-password
 * Method: POST
 * Body: {email: string}
 */
userRouters.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

/**
 * Description. Verify link in email to reset password
 * Path: /verify-forgot-password
 * Method: POST
 * Body: {forgot_password_token: string}
 */
userRouters.post(
  '/verify-forgot-password',
  verifyForgotPasswordValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

/**
 * Description: Reset password
 * Path: /reset-password
 * Method: POST
 * Body: {forgot_password_token: string, password: string, confirm_password: string}
 */
userRouters.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

/**
 * Description: Get my profile
 * Path: /me
 * Method: GET
 * Header: { Authorization: Bearer <access_token> }
 */
userRouters.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

/**
 * Description: Update my profile
 * Path: /me
 * Method: PATCH
 * Header: { Authorization: Bearer <access_token> }
 * Body: UserSchema
 */
userRouters.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    'avatar',
    'bio',
    'cover_photo',
    'date_of_birth',
    'location',
    'name',
    'username',
    'website'
  ]),
  wrapRequestHandler(updateMeController)
)

/**
 * Description: Get user profile
 * Path: /:username
 * Method: GET
 */
userRouters.get('/:username', wrapRequestHandler(getProfileController))

/**
 * Description: follow someone
 * Path: /follow
 * Method: POST
 * Headers : {Authorization: Bearer <access_token>}
 * Body: {followed_user_id: string}
 */
userRouters.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)

/**
 * Description: unfollow someone
 * Path: /follow/:user_id
 * Method: DELETE
 * Headers : {Authorization: Bearer <access_token>}
 * Params: {followed_user_id: string}
 */
userRouters.delete(
  '/follow/:followed_user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapRequestHandler(unfollowController)
)

/**
 * Description: change password user
 * Path: /change-password
 * Method: DELETE
 * Headers : {Authorization: Bearer <access_token>}
 * Body: {old_password: string,password: string,  new_password: string}
 */
userRouters.patch(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

/**
 * Description: Login with google credentials
 * Path: /oauth/google
 * Method: POST
 *
 */
userRouters.post('/oauth/google', wrapRequestHandler(oauthController))

export default userRouters

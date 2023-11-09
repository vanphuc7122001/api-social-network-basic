import databaseService from '~/services/database.service'
import User from '~/models/schemas/User.schema'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { config } from 'dotenv'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import { USERS_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'
import Follower from '~/models/schemas/Follower.schema'
import axios from 'axios'
import { sendForgotPasswrodEmail, sendVerifyRegisterEmail } from '~/utils/email'
config()

interface PayloadToken {
  user_id: string
  verify: UserVerifyStatus
  exp?: number
}

class UserService {
  private signAccessToken({ user_id, verify }: PayloadToken) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.EXPRIES_IN_ACCESS_TOKEN
      }
    })
  }

  private signRefreshToken({ user_id, verify, exp }: PayloadToken) {
    if (exp) {
      return signToken({
        payload: {
          user_id,
          token_type: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
    }
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.EXPRIES_IN_REFRESH_TOKEN
      }
    })
  }

  private signEmailVerifyToken({ user_id, verify }: PayloadToken) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.EmailVerifyToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
      options: {
        expiresIn: process.env.EXPRIES_IN_EMAIL_VERIFY_TOKEN
      }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: PayloadToken) {
    return signToken({
      payload: {
        user_id,
        token_type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.EXPRIES_IN_FORGOT_PASSWORD_TOKEN
      }
    })
  }

  private signAccessAndRefreshToken({ user_id, verify }: PayloadToken) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId().toString()

    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    await Promise.all([
      databaseService.users.insertOne(
        new User({
          ...payload,
          _id: new ObjectId(user_id),
          username: `user${user_id}`,
          email_verify_token: email_verify_token as string,
          date_of_birth: new Date(payload.date_of_birth),
          password: hashPassword(payload.password)
        })
      ),
      sendVerifyRegisterEmail({
        email_verify_token,
        toAddress: payload.email,
        subject: 'Verify email when register'
      })
    ])

    /**
     * Flow send email when register successful
     * 1. When register successful server send email attachment link to email of user
     * 2. User click link in email
     * 3. Client send request to server with email_verify_token
     * 4. Server verify email_verify_token
     * 5. Client recieve access token and refresh token
     */

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify: UserVerifyStatus.Unverified
    })

    const { exp, iat } = await this.decodeRefreshToken(refresh_token as string)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token as string, exp, iat })
    )

    return {
      access_token,
      refresh_token
    }
  }

  async findUserById(user_id: string) {
    const result = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    return result
  }

  async login({ user_id, verify }: PayloadToken) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify
    })
    const { exp, iat } = await this.decodeRefreshToken(refresh_token as string)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token as string, exp, iat })
    )
    return {
      access_token,
      refresh_token
    }
  }

  private async getOauthToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URL,
      grant_type: 'authorization_code'
    }

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    return data
  }

  private async getOauthUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })

    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      picture: string
    }
  }

  async oauth(code: string) {
    const { id_token, access_token } = await this.getOauthToken(code)
    const userInfo = await this.getOauthUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.GMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      })
    }

    const isUser = await databaseService.users.findOne({ email: userInfo.email })
    if (isUser) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: isUser._id.toString(),
        verify: isUser.verify
      })
      const { exp, iat } = await this.decodeRefreshToken(refresh_token as string)

      await databaseService.refreshTokens.insertOne(
        new RefreshToken({ user_id: new ObjectId(isUser._id), token: refresh_token as string, exp, iat })
      )
      return {
        access_token,
        refresh_token,
        newUser: 1
      }
    } else {
      const password = Math.random().toString(36).slice(-8)
      const { access_token, refresh_token } = await this.register({
        confirm_password: password,
        date_of_birth: new Date().toISOString(),
        email: userInfo.email,
        name: userInfo.name,
        password
      })
      return {
        access_token,
        refresh_token,
        newUser: 2
      }
    }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
  }

  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({ user_id, verify: UserVerifyStatus.Verified }),
      await databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ])

    const [access_token, refresh_token] = token
    const { exp, iat } = await this.decodeRefreshToken(refresh_token as string)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token as string, exp, iat })
    )

    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail({ user_id, email }: { user_id: string; email: string }) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    await Promise.all([
      databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
        {
          $set: {
            email_verify_token: email_verify_token as string,
            update_at: '$$NOW'
          }
        }
      ]),
      sendVerifyRegisterEmail({ email_verify_token, toAddress: email, subject: 'Resend email when register' })
    ])
  }

  async forgotPassword({ user_id, verify, email }: PayloadToken & { email: string }) {
    const forgot_password_token = await this.signForgotPasswordToken({
      user_id: user_id.toString(),
      verify
    })
    await Promise.all([
      databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            forgot_password_token
          },
          $currentDate: {
            update_at: true
          }
        }
      ),
      sendForgotPasswrodEmail({ forgot_password_token, subject: 'Verify Forgot Password', toAddress: email })
    ])
  }

  async resetPassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashPassword(password)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
  }

  async getMe(user_id: string) {
    const result = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return result
  }

  async updateMe(user_id: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          ...(_payload as UpdateMeReqBody & { date_of_birth?: Date })
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    )

    return user.value
  }

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          email_verify_token: 0,
          forgot_password_token: 0,
          verify: 0,
          created_at: 0,
          updated_at: 0
        }
      }
    )

    if (!user) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }

    return user
  }

  async follow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (!follower) {
      await databaseService.followers.insertOne(
        new Follower({ user_id: new ObjectId(user_id), followed_user_id: new ObjectId(followed_user_id) })
      )
      return {
        message: USERS_MESSAGES.FOLLOW_SUCCESS
      }
    }
    return {
      message: USERS_MESSAGES.FOLLOWED
    }
  }

  async unFollow(user_id: string, followed_user_id: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })

    if (!follower) {
      return {
        message: USERS_MESSAGES.ALREADY_UNFOLLOWED
      }
    }
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    })
    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS
    }
  }

  async changePassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      [
        {
          $set: {
            password: hashPassword(new_password),
            update_at: '$$NOW'
          }
        }
      ]
    )
    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }
  }

  async refreshToken({
    user_id,
    refresh_token,
    verify,
    exp,
    iat
  }: {
    user_id: string
    refresh_token: string
    verify: UserVerifyStatus
    exp: number
    iat: number
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify, exp }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token })
    ])

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        token: new_refresh_token as string,
        user_id: new ObjectId(user_id),
        iat,
        exp
      })
    )
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
    }
  }
}

const userService = new UserService()
export default userService

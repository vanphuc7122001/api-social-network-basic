import databaseService from '~/services/database.services'
import User from '~/models/schemas/User.schema'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/crypto'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { config } from 'dotenv'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import { USERS_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'
import Follower from '~/models/schemas/Follower.schema'
config()

interface PayloadToken {
  user_id: string
  verify: UserVerifyStatus
}

class UsersService {
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

  private signRefreshToken({ user_id, verify }: PayloadToken) {
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

  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId().toString()

    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: new ObjectId(user_id),
        username: `user${user_id}`,
        email_verify_token: email_verify_token as string,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )

    console.log('email verify token', email_verify_token)

    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify: UserVerifyStatus.Unverified
    })

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token as string })
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
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token as string })
    )
    return {
      access_token,
      refresh_token
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

    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.signEmailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified })
    console.log('email verify token ', email_verify_token)
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token: email_verify_token as string,
          update_at: '$$NOW'
        }
      }
    ])
  }

  async forgotPassword({ user_id, verify }: PayloadToken) {
    const forgot_password_token = (await this.signForgotPasswordToken({
      user_id: user_id.toString(),
      verify
    })) as string
    console.log('forgot password token', forgot_password_token)
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          update_at: true
        }
      }
    )
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
}

const usersService = new UsersService()
export default usersService

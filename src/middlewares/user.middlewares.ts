import { NextFunction, Request, Response } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { envConfig } from '~/constants/config'
import { UserVerifyStatus } from '~/constants/enums'
import { USERS_MESSAGES } from '~/constants/messages'
import { USER_EMAIL_REGEX } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import { verifyAccessToken } from '~/utils/commons'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
import databaseService from '~/services/database.service'
import HTTP_STATUS from '~/constants/httpStatus'

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_A_STRING
  },
  isLength: {
    options: {
      min: 1,
      max: 50
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG,
    options: {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    }
  }
}

const confirmPassSchema = ({ paramsConfirm = 'password' }: { paramsConfirm?: string }): ParamSchema => {
  return {
    notEmpty: {
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
    },
    isString: {
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_A_STRING
    },
    isLength: {
      options: {
        min: 1,
        max: 50
      },
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
    },
    isStrongPassword: {
      options: {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      },
      errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
    },
    custom: {
      options: (value, { req }) => {
        if (value != req.body[paramsConfirm as string]) {
          throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
        }
        return true
      }
    }
  }
}

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }

      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: envConfig.jwtSecretForgotPasswordToken
        })

        const { user_id } = decoded_forgot_password_token
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
        if (!user) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }

        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.INVALID_FORGOT_PASSWORD_TOKEN,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }
        ;(req as Request).decoded_forgot_password_token = decoded_forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: capitalize(error.message),
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }

        throw error
      }
    }
  }
}

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 100
    },
    errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  }
}

const dateOfBirthSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_IS_REQUIRED
  },
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
  }
}

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_STRING
  },
  trim: true,
  isLength: {
    options: {
      min: 1,
      max: 400
    },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH
  }
}

const followUserIdSchema: ParamSchema = {
  custom: {
    options: async (value: string) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.INVALID_FOLLOWED_USER_ID,
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      const follow_user = await databaseService.users.findOne({ _id: new ObjectId(value) })

      if (!follow_user) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        })
      }

      return true
    }
  }
}

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_IS_INVALID,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_OR_PASSWORD__INCORRECT,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            req.user = user
            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
        }
      }
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        trim: true,
        custom: {
          options: async (value) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_IS_REQUIRED,
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR
              })
            }
            const isExistEmail = await databaseService.users.findOne({ email: value })
            if (isExistEmail) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_ALREADY_EXISTS,
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR
              })
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPassSchema({}),
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            const access_token = (value || '').split(' ')[1]
            return await verifyAccessToken(access_token, req as Request)
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                status: 401
              })
            }
            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({
                  token: value,
                  secretOrPublicKey: envConfig.jwtSecretRefreshToken
                }),
                databaseService.refreshTokens.findOne({ token: value })
              ])

              if (!refresh_token) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: error.message,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            try {
              const decode_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: envConfig.jwtEmailVerifyToken
              })
              ;(req as Request).decoded_email_verify_token = decode_email_verify_token
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const isEmailUser = USER_EMAIL_REGEX.test(value)
            if (!isEmailUser) {
              throw new ErrorWithStatus({ message: USERS_MESSAGES.EMAIL_IS_INVALID, status: HTTP_STATUS.BAD_REQUEST })
            }

            if (!value) {
              throw new ErrorWithStatus({ message: USERS_MESSAGES.EMAIL_IS_REQUIRED, status: HTTP_STATUS.BAD_REQUEST })
            }

            const user = await databaseService.users.findOne({ email: value })
            if (!user) {
              throw new ErrorWithStatus({ message: USERS_MESSAGES.USER_NOT_FOUND, status: HTTP_STATUS.NOT_FOUND })
            }

            req.user = user
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['query']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema,
      password: passwordSchema,
      confirm_password: confirmPassSchema({})
    },
    ['body']
  )
)

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        notEmpty: undefined
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.BIO_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.BIO_LENGTH
        }
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.LOCATION_LENGTH
        }
      },
      website: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_STRING
        },
        trim: true,
        isLength: {
          options: {
            min: 1,
            max: 200
          },
          errorMessage: USERS_MESSAGES.WEBSITE_LENGTH
        }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.USERNAME_MUST_BE_STRING
        },
        trim: true,
        custom: {
          options: async (value) => {
            const user = await databaseService.users.findOne({ username: value })
            if (user) {
              throw new Error(USERS_MESSAGES.USERNAME_EXISTED)
            }
            return true
          }
        },
        isLength: {
          options: {
            min: 1,
            max: 50
          },
          errorMessage: USERS_MESSAGES.USERNAME_LENGTH
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
)

export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: followUserIdSchema
    },
    ['body']
  )
)

export const unfollowValidator = validate(
  checkSchema(
    {
      followed_user_id: followUserIdSchema
    },
    ['params']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value, { req }) => {
            const { user_id } = (req as Request).decoded_authorization as TokenPayload
            const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            const { password } = user
            const isMatch = password === hashPassword(value)
            if (!isMatch) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.OLD_PASSWORD_NOT_MATCH,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            return true
          }
        }
      },
      new_password: passwordSchema,
      confirm_password: confirmPassSchema({ paramsConfirm: 'new_password' })
    },
    ['body']
  )
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload
  if (verify !== UserVerifyStatus.Verified) {
    next(
      new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    )
  }
  next()
}

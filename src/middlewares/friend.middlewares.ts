import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { validate } from '~/utils/validation'

export const addFriendValidator = validate(
  checkSchema(
    {
      user_id_friend: {
        custom: {
          options: (value) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_ID_IS_REQUIRED,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_ID_MALFORMED,
                status: HTTP_STATUS.BAD_REQUEST
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

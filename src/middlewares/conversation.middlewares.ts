import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { CONVERSATION_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { validate } from '~/utils/validation'

export const getConversationsValidator = validate(
  checkSchema(
    {
      receiver_id: {
        custom: {
          options: (value) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: CONVERSATION_MESSAGES.RECEIVER_ID_IS_REQUIRED,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: CONVERSATION_MESSAGES.RECEIVER_ID_IS_MALFORMED,
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

import { NextFunction, Request, Response } from 'express'
import { ParamSchema, checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums'
import { TWEET_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import { numberEnumToArray } from '~/utils/commons'
import { wrapRequestHandler } from '~/utils/handlers'
import { validate } from '~/utils/validation'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.service'
import HTTP_STATUS from '~/constants/httpStatus'

const tweetType = numberEnumToArray(TweetType)
const tweetAudience = numberEnumToArray(TweetAudience)
const mediaTypes = numberEnumToArray(MediaType)

const limitParamShema: ParamSchema = {
  isNumeric: true,
  custom: {
    options: async (value, { req }) => {
      const num = Number(value)
      if (num > 100 || num < 1) {
        throw new Error('1 <= limit <= 100')
      }
      return true
    }
  }
}

const pageParamSchema: ParamSchema = {
  isNumeric: true,
  custom: {
    options: async (value, { req }) => {
      const num = Number(value)
      if (num < 1) {
        throw new Error('page >= 1')
      }
      return true
    }
  }
}

export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [tweetType],
          errorMessage: TWEET_MESSAGES.INVALID_TYPE
        }
      },
      audience: {
        isIn: {
          options: [tweetAudience],
          errorMessage: TWEET_MESSAGES.INVALID_AUDIENCE
        }
      },
      parent_id: {
        custom: {
          options: (value, { req }) => {
            const type = req.body.type
            // nếu `type` là retweet, qoutetweet, commentweet thì parent_id phải là tweet_id của tweet cha
            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Retweet].includes(type) &&
              !ObjectId.isValid(value)
            ) {
              throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_A_VALID_TWEET_ID)
            }

            // nếu type = tweet thì parent_id phải là null
            if (type === TweetType.Tweet && value !== null) {
              throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_NULL)
            }

            return true
          }
        }
      },
      content: {
        isString: {
          errorMessage: TWEET_MESSAGES.CONTENT_MUST_BE_STRING
        },
        trim: true,
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            const hashtags = req.body.hashtags as string[]
            const mentions = req.body.mentions as string[]

            // nếu type là tweet , qoutetweet, comment và không có hastags, mentions thì content phải là string và không được rổng
            if (
              [TweetType.Comment, TweetType.Tweet, TweetType.QuoteTweet].includes(type) &&
              isEmpty(hashtags) &&
              isEmpty(mentions) &&
              value === ''
            ) {
              throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_A_NON_EMPTY_STRING)
            }

            // nếu type == retweet thì content phải rổng
            if (type === TweetType.Retweet && value !== '') {
              throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_EMPTY)
            }

            return true
          }
        }
      },
      hashtags: {
        isArray: {
          errorMessage: TWEET_MESSAGES.HASTAGS_MUST_BE_ARRAY
        },
        custom: {
          options: (value, { req }) => {
            // Yêu cầu mỗi phần từ trong array là string
            if (value.some((item: any) => typeof item !== 'string')) {
              throw new Error(TWEET_MESSAGES.HASTAGS_MUST_BE_AN_ARRAY_OF_STRING)
            }

            return true
          }
        }
      },
      mentions: {
        isArray: {
          errorMessage: TWEET_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY
        },
        custom: {
          options: (value, { req }) => {
            const isObjectId = value.every((item: any) => {
              return ObjectId.isValid(item)
            })

            // Yêu cầu mỗi phần từ trong array là string và nó phải là ObjectId
            if (!isObjectId) {
              throw new Error(TWEET_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_STRING_AND_MUST_BE_OBJECT_ID)
            }
            return true
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            // Yêu cầu mỗi phần từ trong array là Media Object
            if (
              value.some((item: any) => {
                return typeof item.url !== 'string' || !mediaTypes.includes(item.type)
              })
            ) {
              throw new Error(TWEET_MESSAGES.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: TWEET_MESSAGES.TWEET_ID_IS_REQUIRED,
                status: HTTP_STATUS.NOT_FOUND
              })
            }
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                message: TWEET_MESSAGES.TWEET_ID_MALFORMED,
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR
              })
            }
            const [tweet] = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          username: '$$mention.username',
                          email: '$$mention.email'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'likes'
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweets_children'
                  }
                },
                {
                  $addFields: {
                    like_count: {
                      $size: '$likes'
                    },
                    bookmark_count: {
                      $size: '$bookmarks'
                    },
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweets_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Retweet]
                          }
                        }
                      }
                    },
                    comment_count: {
                      $size: {
                        $filter: {
                          input: '$tweets_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Comment]
                          }
                        }
                      }
                    },
                    qoute_count: {
                      $size: {
                        $filter: {
                          input: '$tweets_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.QuoteTweet]
                          }
                        }
                      }
                    }
                  }
                },
                {
                  $project: {
                    tweets_children: 0
                  }
                }
              ])
              .toArray()
            if (!tweet) {
              throw new ErrorWithStatus({
                message: TWEET_MESSAGES.TWEET_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            ;(req as Request).tweet = tweet

            return true
          }
        }
      }
    },
    ['body', 'params']
  )
)

export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  if (tweet.audience == TweetAudience.TwitterCircle) {
    // tác giả tweet
    const author = await databaseService.users.findOne({
      _id: new ObjectId(tweet.user_id)
    })
    // kiểm tra tài khoản của tác giả có ổn hay không
    if (!author || author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    }
    // kiểm tra người xem tweet này có trong tweet circle hay không
    const { user_id } = req.decoded_authorization as TokenPayload
    const isInTweetCircles = author.twitter_circle.some((user_circle_id) => user_circle_id.equals(user_id))
    // nếu bạn không phải là tác giả và không nằm trong tweet circle
    if (!author._id.equals(user_id) && !isInTweetCircles) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: TWEET_MESSAGES.TWEET_IS_NOT_PUBLIC
      })
    }
  }
  next()
})

export const getTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [tweetType],
          errorMessage: TWEET_MESSAGES.INVALID_TYPE
        }
      },
      limit: limitParamShema,
      page: pageParamSchema
    },
    ['query']
  )
)

export const paginationValidator = validate(
  checkSchema(
    {
      limit: limitParamShema,
      page: pageParamSchema
    },
    ['query']
  )
)

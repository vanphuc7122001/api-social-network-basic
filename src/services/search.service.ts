import { MediaType, MediaTypeQuery, TweetAudience, TweetType } from '~/constants/enums'
import databaseService from './database.service'
import { ObjectId } from 'mongodb'

class SearchService {
  async search({
    limit,
    page,
    content,
    user_id,
    media_type
  }: {
    limit: number
    page: number
    content: string
    user_id: string
    media_type: MediaTypeQuery
  }) {
    const $match: any = {
      $text: {
        $search: content
      }
    }

    if (media_type) {
      if (media_type === MediaTypeQuery.Image) {
        $match['medias.type'] = MediaType.Image
      }

      if (media_type === MediaTypeQuery.Video) {
        $match['medias.type'] = MediaType.Video
      }
    }

    const user_object_id = new ObjectId(user_id)
    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate([
          {
            $match
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: TweetAudience.Everyone
                },
                {
                  $and: [
                    {
                      audience: TweetAudience.TwitterCircle
                    },
                    {
                      'user.twitter_circle': {
                        $in: [user_object_id]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $skip: limit * (page - 1)
          },
          {
            $limit: limit
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
              tweets_children: 0,
              user: {
                password: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                twitter_circle: 0,
                date_of_birth: 0
              }
            }
          }
        ])
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: TweetAudience.Everyone
                },
                {
                  $and: [
                    {
                      audience: TweetAudience.TwitterCircle
                    },
                    {
                      'user.twitter_circle': {
                        $in: [user_object_id]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ])

    const tweet_ids = tweets.map((tweet) => tweet._id)
    const date = new Date()
    await Promise.all([
      databaseService.tweets.updateMany(
        {
          _id: {
            $in: tweet_ids
          }
        },
        {
          $inc: { user_views: 1 },
          $set: {
            updated_at: date
          }
        }
      ),
      tweets.forEach((tweet) => {
        tweet.updated_at = date
        tweet.user_views += 1
      })
    ])

    return {
      tweets,
      total: total[0]?.total || 0
    }
  }
}

const searchService = new SearchService()
export default searchService

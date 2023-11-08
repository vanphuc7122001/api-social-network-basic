import { CreateTweetReqBody } from '~/models/requests/Tweet.requests'
import databaseService from './database.service'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/HashTag.schema'
import { TweetType } from '~/constants/enums'

class TweetService {
  private async checkAndCreateHashTags(hashtags: string[]) {
    const hashtagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashTags.findOneAndUpdate(
          {
            name: hashtag
          },
          {
            $setOnInsert: new Hashtag({ name: hashtag })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      })
    )

    return hashtagDocuments.map((hashtag) => (hashtag.value as WithId<Hashtag>)._id.toString())
  }
  async createTweet({ user_id, body }: { user_id: string; body: CreateTweetReqBody }) {
    const hashtags = await this.checkAndCreateHashTags(body.hashtags)
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags,
        medias: [...body.medias],
        mentions: body.mentions,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )
    const tweet = await databaseService.tweets.findOne({ _id: result.insertedId })
    return tweet
  }

  async increaseView(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const result = await databaseService.tweets.findOneAndUpdate(
      {
        _id: new ObjectId(tweet_id)
      },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        projection: {
          guest_views: 1,
          user_views: 1
        }
      }
    )

    return result.value as WithId<{
      guest_views: number
      user_views: number
    }>
  }

  async getTweetChildren({
    tweet_id,
    tweet_type,
    limit,
    page,
    user_id
  }: {
    tweet_id: string
    tweet_type: TweetType
    limit: number
    page: number
    user_id?: string
  }) {
    const tweets = await databaseService.tweets
      .aggregate<Tweet>([
        {
          $match: {
            parent_id: new ObjectId(tweet_id),
            type: tweet_type
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
            tweets_children: 0
          }
        }
      ])
      .toArray()

    const ids = tweets.map((tweet) => tweet._id as ObjectId)
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
    const date = new Date()

    const [total] = await Promise.all([
      databaseService.tweets.countDocuments({
        parent_id: new ObjectId(tweet_id),
        type: tweet_type
      }),
      databaseService.tweets.updateMany(
        {
          _id: {
            $in: ids
          }
        },
        {
          $inc: inc,
          $set: {
            updated_at: date
          }
        }
      )
    ])

    tweets.forEach((tweet) => {
      tweet.updated_at = date
      if (user_id) {
        tweet.user_views += 1
      } else {
        tweet.guest_views += 1
      }
    })

    return {
      tweets,
      total
    }
  }
}

const tweetService = new TweetService()
export default tweetService

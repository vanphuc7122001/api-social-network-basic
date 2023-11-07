import { CreateTweetReqBody } from '~/models/requests/Tweet.requests'
import databaseService from './database.service'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId } from 'mongodb'

class TweetService {
  async createTweet({ user_id, body }: { user_id: string; body: CreateTweetReqBody }) {
    const result = await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        hashtags: [],
        medias: [...body.medias],
        mentions: body.mentions,
        parent_id: body.parent_id,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )

    console.log('result', result)
    return true
  }
}

const tweetService = new TweetService()
export default tweetService

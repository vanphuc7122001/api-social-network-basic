import { ObjectId, WithId } from 'mongodb'
import databaseService from './database.service'
import Like from '~/models/schemas/Like.schema'

class LikeService {
  async likeTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.likes.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Like({ tweet_id: new ObjectId(tweet_id), user_id: new ObjectId(user_id) })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    return result.value as WithId<Like>
  }

  async unlikeTweet(user_id: string, tweet_id: string) {
    await databaseService.likes.deleteOne({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
  }
}

const likeService = new LikeService()
export default likeService

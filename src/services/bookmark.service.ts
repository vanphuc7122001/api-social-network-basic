import { ObjectId, WithId } from 'mongodb'
import databaseService from './database.service'
import Bookmark from '~/models/schemas/Bookmark.schema'

class BookmarkService {
  async bookmarkTweet(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      {
        user_id: new ObjectId(user_id),
        tweet_id: new ObjectId(tweet_id)
      },
      {
        $setOnInsert: new Bookmark({ tweet_id: new ObjectId(tweet_id), user_id: new ObjectId(user_id) })
      },
      {
        upsert: true,
        returnDocument: 'after'
      }
    )

    return result.value as WithId<Bookmark>
  }

  async unbookmarkTweet(user_id: string, tweet_id: string) {
    await databaseService.bookmarks.deleteOne({
      user_id: new ObjectId(user_id),
      tweet_id: new ObjectId(tweet_id)
    })
  }
}

const bookmarkService = new BookmarkService()
export default bookmarkService

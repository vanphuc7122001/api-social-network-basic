import { Collection, Db, MongoClient } from 'mongodb'
import { envConfig } from '~/constants/config'
import { Friend } from '~/models/schemas/Friend.schema'

import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follower.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import HashTag from '~/models/schemas/HashTag.schema'
import Bookmark from '~/models/schemas/Bookmark.schema'
import Like from '~/models/schemas/Like.schema'
import Conversation from '~/models/schemas/Conversations.schema'
const uri = `mongodb+srv://${envConfig.dbUserName}:${envConfig.dbPassword}@twitter.ven5idz.mongodb.net/?retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(envConfig.dbName)
  }

  async connect() {
    // eslint-disable-next-line no-useless-catch
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log('Connection error')
      throw error
    }
  }

  async indexUsers() {
    const exists = await this.users.indexExists(['email_1_password_1', 'email_1', 'username_1'])
    if (!exists) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }

  async indexRefreshTokens() {
    const exists = await this.refreshTokens.indexExists(['token_1', 'exp_1'])
    if (!exists) {
      this.refreshTokens.createIndex({ token: 1 })
      this.refreshTokens.createIndex(
        {
          exp: 1
        },
        {
          expireAfterSeconds: 0
        }
      )
    }
  }

  async indexFollowers() {
    const exists = await this.followers.indexExists(['user_id_1', 'followed_user_id_1'])
    if (!exists) {
      this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
    }
  }
  async indexTweets() {
    const exists = await this.tweets.indexExists('content_text')
    if (!exists) {
      this.tweets.createIndex({ content: 'text' })
    }
  }

  get users(): Collection<User> {
    return this.db.collection(envConfig.dbUserCollection)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.dbRefreshTokenCollection)
  }

  get followers(): Collection<Follower> {
    return this.db.collection(envConfig.dbFollowerCollection)
  }

  get tweets(): Collection<Tweet> {
    return this.db.collection(envConfig.dbTweetCollection)
  }

  get hashTags(): Collection<HashTag> {
    return this.db.collection(envConfig.dbHashTagCollection)
  }

  get bookmarks(): Collection<Bookmark> {
    return this.db.collection(envConfig.dbBookmarkCollection)
  }

  get likes(): Collection<Like> {
    return this.db.collection(envConfig.dbLikeCollection)
  }

  get friends(): Collection<Friend> {
    return this.db.collection(envConfig.dbFriendCollection)
  }

  get conversations(): Collection<Conversation> {
    return this.db.collection(envConfig.dbConversationCollection)
  }
}

const databaseService = new DatabaseService()
export default databaseService

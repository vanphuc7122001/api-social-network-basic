import { ObjectId } from 'mongodb'
import { TweetAudience, TweetType } from '~/constants/enums'

export interface CreateTweetReqBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | ObjectId //  chỉ null khi tweet gốc
  hashtags: ObjectId[]
  mentions: ObjectId[]
  medias: ObjectId[]
}

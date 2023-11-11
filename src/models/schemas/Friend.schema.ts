import { ObjectId } from 'mongodb'

interface FriendType {
  _id?: ObjectId
  user_id: ObjectId
  user_id_friend: ObjectId
  created_at?: Date
  updated_at?: Date
}

export class Friend {
  _id?: ObjectId
  user_id: ObjectId
  user_id_friend: ObjectId
  created_at?: Date
  updated_at?: Date
  constructor({ _id, user_id, user_id_friend }: FriendType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.user_id_friend = user_id_friend
    this.created_at = date
    this.updated_at = date
  }
}

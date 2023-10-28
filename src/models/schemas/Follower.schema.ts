import { ObjectId } from 'mongodb'

interface FollowerType {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId
  created_at?: Date
  update_at?: Date
}

export default class Follower {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId
  created_at?: Date
  update_at?: Date
  constructor({ _id, user_id, followed_user_id, created_at, update_at }: FollowerType) {
    const date = new Date()
    this._id = _id
    this.user_id = user_id
    this.followed_user_id = followed_user_id
    this.created_at = created_at || date
    this.update_at = update_at || date
  }
}

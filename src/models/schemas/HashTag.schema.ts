import { ObjectId } from 'mongodb'

interface HashtagType {
  _id?: ObjectId
  name: string
  create_at?: Date
}

export default class Hashtag {
  _id?: ObjectId
  name: string
  create_at?: Date
  constructor({ _id, name, create_at }: HashtagType) {
    this._id = _id || new ObjectId()
    this.name = name
    this.create_at = create_at || new Date()
  }
}

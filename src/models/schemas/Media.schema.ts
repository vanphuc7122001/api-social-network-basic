import { ObjectId } from 'mongodb'
import { MediaType } from '~/constants/enums'

interface MediaTypeData {
  _id?: ObjectId
  url: string
  type: MediaType
}

export default class Media {
  _id?: ObjectId
  url: string
  type: MediaType
  constructor({ _id, url, type }: MediaTypeData) {
    this._id = _id
    this.url = url
    this.type = type
  }
}

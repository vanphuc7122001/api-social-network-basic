import { Friend } from '~/models/schemas/Friend.schema'
import { ObjectId } from 'mongodb'
import { FRIEND_MESSAGES } from '~/constants/messages'
import databaseService from './database.service'
import User from '~/models/schemas/User.schema'

class FriendService {
  async addFriend({ user_id, user_id_friend }: { user_id: string; user_id_friend: string }) {
    await databaseService.friends.insertOne(
      new Friend({
        user_id: new ObjectId(user_id),
        user_id_friend: new ObjectId(user_id_friend)
      })
    )

    return {
      message: FRIEND_MESSAGES.FRIEND_SUCESS
    }
  }

  async getFriends(user_id: string) {
    const friends = await databaseService.friends
      .aggregate<User>([
        {
          $match: {
            user_id: new ObjectId(user_id)
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id_friend',
            foreignField: '_id',
            as: 'friends'
          }
        },
        {
          $project: {
            friends: {
              _id: 1,
              name: 1,
              email: 1
            },
            _id: 0
          }
        },
        {
          $unwind: {
            path: '$friends'
          }
        }
      ])
      .toArray()

    return friends
  }
}

const friendService = new FriendService()
export default friendService

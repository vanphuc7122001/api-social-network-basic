import { ObjectId } from 'mongodb'
import databaseService from './database.service'
import Conversation from '~/models/schemas/Conversations.schema'

class ConversationService {
  async getConversations({ user_id, receiver_id }: { user_id: string; receiver_id: string }) {
    const conversations = await databaseService.conversations
      .aggregate<Conversation>([
        {
          $match: {
            $or: [
              {
                sender_id: new ObjectId(receiver_id),
                receiver_id: new ObjectId(user_id)
              },
              {
                sender_id: new ObjectId(user_id),
                receiver_id: new ObjectId(receiver_id)
              }
            ]
          }
        },
        {
          $project: {
            _id: 0,
            created_at: 0,
            updated_at: 0
          }
        }
      ])
      .toArray()

    return conversations
  }
}

const conversationService = new ConversationService()

export default conversationService

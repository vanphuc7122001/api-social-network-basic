import { Server } from 'socket.io'
import { verifyAccessToken } from './commons'
import { TokenPayload } from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'
import { Server as HttpServer } from 'http'
import databaseService from '~/services/database.service'
import Conversation from '~/models/schemas/Conversations.schema'

export const initialSocket = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000'
    }
  })

  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}

  io.on('connection', async (socket) => {
    console.log(`user connected: ${socket.id}`)
    const { Authorization } = socket.handshake.auth
    const access_token = Authorization?.split(' ')[1]
    try {
      const decode_authenication = (await verifyAccessToken(access_token)) as TokenPayload
      const { user_id } = decode_authenication
      users[user_id] = {
        socket_id: socket.id
      }
      socket.handshake.auth.user_id = user_id
    } catch (error) {
      console.log(error, (error as any).message)
    }

    socket.on('send_message', async (payload) => {
      const receiver_socket_id = users[payload.to]?.socket_id
      if (!receiver_socket_id) {
        console.log('err when sending private message')
        return
      } else {
        const user_id = socket.handshake.auth.user_id
        const conversations = {
          _id: new ObjectId().toString(),
          content: payload.content,
          sender_id: user_id,
          receiver_id: payload.to
        }

        await databaseService.conversations.insertOne(
          new Conversation({
            content: payload.content,
            receiver_id: payload.to,
            sender_id: user_id
          })
        )

        socket.to(receiver_socket_id).emit('receive_message', { payload: conversations })
      }
    })

    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect()
      }
    })
    socket.on('disconnect', () => {
      // delete users[user_id]
      console.log(`user ${socket.id} disconnected`)
    })
  })
}

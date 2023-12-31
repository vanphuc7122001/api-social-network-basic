import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import { TWEET_MESSAGES } from '~/constants/messages'
import { CreateTweetReqBody, GetTweetParams, Pagination } from '~/models/requests/Tweet.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import { TweetType } from '~/constants/enums'
import tweetService from '~/services/tweet.service'

export const createTweetController = async (
  req: Request<ParamsDictionary, any, CreateTweetReqBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await tweetService.createTweet({ user_id, body: req.body })

  res.json({
    message: TWEET_MESSAGES.CREATE_TWEET_SUCCESS,
    result
  })
}

export const getTweetController = async (req: Request<GetTweetParams>, res: Response, next: NextFunction) => {
  const result = await tweetService.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views
  }
  res.json({
    message: TWEET_MESSAGES.GET_TWEET_SUCESS,
    result: tweet
  })
}

export const getTweetChildrenController = async (
  req: Request<GetTweetParams, any, any, Pagination>,
  res: Response,
  next: NextFunction
) => {
  const tweet_type = Number(req.query.tweet_type) as TweetType
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const user_id = req.decoded_authorization?.user_id
  const { total, tweets } = await tweetService.getTweetChildren({
    tweet_id: req.params.tweet_id,
    limit,
    page,
    tweet_type,
    user_id
  })
  res.json({
    message: TWEET_MESSAGES.GET_TWEET_CHILDREN_SUCESS,
    result: {
      tweets,
      limit,
      page,
      tweet_type,
      total_pages: Math.ceil(total / limit)
    }
  })
}

export const getNewFeedController = async (
  req: Request<ParamsDictionary, any, any, Pagination>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const { total, tweets } = await tweetService.getNewFeed({ user_id, limit, page })
  return res.json({
    message: TWEET_MESSAGES.GET_NEW_FEED_SUCCESS,
    result: {
      tweets,
      limit,
      page,
      total_page: Math.ceil(total / limit)
    }
  })
}

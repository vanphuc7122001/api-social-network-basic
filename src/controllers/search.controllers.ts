import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import { SearchQuery } from '~/models/requests/Search.requests'
import searchService from '~/services/search.service'
import { SEARCH_MESSAGES } from '~/constants/messages'

export const searchController = async (
  req: Request<ParamsDictionary, any, any, SearchQuery>,
  res: Response,
  next: NextFunction
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const user_id = req.decoded_authorization?.user_id as string
  const { total, tweets } = await searchService.search({
    limit,
    page,
    content: req.query.content,
    user_id,
    media_type: req.query.media_type,
    people_follow: req.query.people_follow
  })
  return res.json({
    message: SEARCH_MESSAGES.SEARCH_SUCCESS,
    result: {
      tweets,
      limit,
      page,
      total_pages: Math.ceil(total / limit)
    }
  })
}

import { Request, Response, NextFunction } from 'express'
import { omit } from 'lodash'

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  return res.status(err.status || 500).json(omit(err, ['status']))
}

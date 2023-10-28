import { NextFunction, RequestHandler, Response, Request } from 'express'

export const wrapAsync = (func: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      //   func(req, res, next).catch(next) => dành cho trường hợp đồng bộ
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}

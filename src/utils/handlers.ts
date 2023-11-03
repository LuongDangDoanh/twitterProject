import { NextFunction, RequestHandler, Response, Request } from 'express'

export const wrapAsync = <P>(func: RequestHandler<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      //   func(req, res, next).catch(next) => dành cho trường hợp đồng bộ
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}

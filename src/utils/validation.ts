import { Request, Response, NextFunction } from 'express'
import { body, validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema'
import { ErrorWithStatus, EntityError } from '~/models/Erro'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    const errorObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })
    // xử lý errorObject
    for (const key in errorObject) {
      //lấy message của từng cái lỗi
      const { msg } = errorObject[key]
      // nếu msg có dạng ErrorWithStatus và status !== 422 thì ném
      // cho default error handler
      if (msg instanceof ErrorWithStatus && msg.status !== 422) {
        return next(msg)
      }
      //lưu các lỗi 422 từ errorObject vào entityError
      entityError.errors[key] = msg
    }
    //ở đây nó xử lý lỗi lun chứ ko ném về error handler tổng
    next(entityError)
  }
}

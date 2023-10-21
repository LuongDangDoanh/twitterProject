import { Request, Response } from 'express'
import User from '~/models/User.schema'
import { RegisterReqBody } from '~/models/requests/User.request'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'test@gmail.com' && password === '123456') {
    return res.json({
      message: 'login successfully',
      data: [
        { name: 'Điệp', yob: 1999 },
        { name: 'Doanh', yob: 1999 },
        { name: 'Hưng', yob: 1999 }
      ]
    })
  }
  return res.status(401).json({
    error: 'login failed'
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    const result = await usersService.register(req.body)
    res.json({
      message: 'register successfully',
      result
    })
  } catch (error) {
    return res.status(400).json({
      message: 'register failed',
      error
    })
  }
}

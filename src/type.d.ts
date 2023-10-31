// file này dùng để định nghĩa lại những cái có sẵn
import { Request, Response } from 'express'
import { TokenPayLoad } from './models/requests/User.request'
declare module 'express' {
  interface Request {
    user?: User
    decoded_authorization?: TokenPayLoad
    decoded_refresh_token?: TokenPayLoad
    decoded_email_verify_token?: TokenPayLoad
  }
}

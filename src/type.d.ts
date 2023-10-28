// file này dùng để định nghĩa lại những cái có sẵn
import { Request, Response } from 'express'
declare module 'express' {
  interface Request {
    user?: User
  }
}

import Jwt from 'jsonwebtoken'
import { config } from 'dotenv'
config()
export const signToken = ({
  payload,
  privateKey = process.env.JWT_SECRET as string,
  options = { algorithm: 'HS256', expiresIn: '1d' }
}: {
  payload: string | object | Buffer
  privateKey?: string
  options?: Jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    Jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) reject(err)
      resolve(token as string)
    })
  })
}

import { createHash } from 'crypto'
import { config } from 'dotenv'
config()
// viết 1 cái hàm nhận vào 1 chuỗi và mã hóa theo chuẩn SHA256
//! SHA256 là 1 chuỗi rất khó để detect ngược lại
function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

// viết 1 hàm nhận vào password và max hóa
export function hassPassword(password: string) {
  return sha256(password + (process.env.SALT as string))
}

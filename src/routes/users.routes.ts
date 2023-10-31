import { Router } from 'express'
import { emailVerifyTokenController, loginController, logoutController, registerController } from '~/controllers/users.controllers'
import { emailVerifyTokenValidator, loginValidator, refreshTokenValidator, registerValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
import { accessTokenValidator } from '../middlewares/users.middlewares'

const usersRouter = Router()

/*
des: đăng nhập
path: /users/login
method: POST
body: {email, password}
*/
usersRouter.get('/login', loginValidator, wrapAsync(loginController))

/*
des: đăng nhập
path: /users/login
method: POST
body: {email, password}
*/

usersRouter.post('/register', registerValidator, wrapAsync(registerController))
//   (req, res, next) => {
//     next(new Error('Error from request handle 1'))
//     // throw new Error('Error from request handle 1')
//     // try {
//     //   throw new Error('Error from request handle 1')
//     // } catch (error) {
//     //   next(error)
//     // }
//   },
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/*
des: verify email\
Khi người dùng đăng kí họ sẽ nhận được email có link dạng
http://localhost:7000/users/verify-email?token=<email_verify_token>
nếu mà em nhấp vào link thì sẽ tạo ra req gửi lên email_verify_token lên server
server kiểm tra email_verify_token lấy ra user_id
thì từ decoded_email_verify_token lấy ra user_id
vả vào user_id đó để update email_verify_token thành '', verify = 1, update_at
PATH: /users/verify-email
METHOD: POST
BODY: {email_verify_token}: string
*/
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapAsync(emailVerifyTokenController))

export default usersRouter

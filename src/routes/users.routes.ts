import { Router } from 'express'
import {
  emailVerifyTokenController,
  forgotPassWordController,
  loginController,
  logoutController,
  registerController,
  resendEmailVerifyController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import {
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
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

/*
des: resend email verify token
    khi mail thất lạc, hoặc cái email_verify_token bị hết hạn, thì nguioiwf dùng có nhu cầu resend email_verify_token

    method: post
    path: /users/resend-verify-email
    headers: {Authorization : "bearer <access_token>"} //đăng nhập mới đc resend
    body: {}
*/
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendEmailVerifyController))

/*
 des: khi người dùng quên mật khẩu, họ gửi email để xin  mình tạo cho họ forot_password_token
 path: /users/forgot-password
 method: post
 body: {email: string}
*/
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPassWordController))

/*
 des: khi người dùng nhấp vào link trong email để rết password
 họ sẽ gửi 1 req kèm theo forgot_passowrd_token lến server
 server sẽ kiểm tra forgot_passowrd_token có hợp lệ hay ko?
 sau đó sẽ chuyển hướng người dùng đến trang reset password
 path: /users/verify-forgot-password
 method: post
 body: {forgot_password_token: string}
*/
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapAsync(verifyForgotPasswordTokenController)
)

export default usersRouter

import { Router } from 'express'
import {
  changePasswordController,
  emailVerifyTokenController,
  followController,
  forgotPassWordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendEmailVerifyController,
  resetPassWordController,
  unfollowController,
  updateMeController,
  verifyForgotPasswordTokenController
} from '~/controllers/users.controllers'
import {
  changePasswordValidator,
  emailVerifyTokenValidator,
  followValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  unfollowValidator,
  updateMeValidator,
  verifiedUserValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
import { accessTokenValidator } from '../middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.request'
import { filterMiddleware } from '~/middlewares/common.middlewares'

const usersRouter = Router()

/*
des: đăng nhập
path: /users/login
method: POST
body: {email, password}
*/
usersRouter.post('/login', loginValidator, wrapAsync(loginController))

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
/*
  des: reset password
  path: '/reset-password'
  method: POST
  Header: không cần, vì  ngta quên mật khẩu rồi, thì sao mà đăng nhập để có authen đc
  body: {forgot_password_token: string, password: string, confirm_password: string}
  */
usersRouter.post(
  '/reset-password',
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator,
  wrapAsync(resetPassWordController)
)

/*
  des: get profile của user
  path: '/me'
  method: get
  Header: {Authorization: Bearer <access_token>}
  body: {}
  */
usersRouter.get('/me', accessTokenValidator, wrapAsync(getMeController))

usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  filterMiddleware<UpdateMeReqBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  updateMeValidator,
  wrapAsync(updateMeController)
)

/*
  des: get profile của user khác bằng unsername
  path: '/:username'
  method: get
  không cần header vì, chưa đăng nhập cũng có thể xem
  */
usersRouter.get('/:username', wrapAsync(getProfileController))
//chưa có controller getProfileController, nên bây giờ ta làm

/*
  des: Follow someone
  path: '/follow'
  method: post
  headers: {Authorization: Bearer <access_token>}
  body: {followed_user_id: string}
  */
usersRouter.post('/follow', accessTokenValidator, verifiedUserValidator, followValidator, wrapAsync(followController))
//accessTokenValidator dùng dể kiểm tra xem ngta có đăng nhập hay chưa, và có đc user_id của người dùng từ req.decoded_authorization
//verifiedUserValidator dùng để kiễm tra xem ngta đã verify email hay chưa, rồi thì mới cho follow người khác
//trong req.body có followed_user_id  là mã của người mà ngta muốn follow
//followValidator: kiểm tra followed_user_id truyền lên có đúng định dạng objectId hay không
//  account đó có tồn tại hay không
//followController: tiến hành thao tác tạo document vào collection followers
/*
    des: unfollow someone
    path: '/follow/:user_id'
    method: delete
    headers: {Authorization: Bearer <access_token>}
  g}
    */
usersRouter.delete(
  '/follow/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  unfollowValidator,
  wrapAsync(unfollowController)
)
/*
  des: change password
  path: '/change-password'
  method: PUT
  headers: {Authorization: Bearer <access_token>}
  Body: {old_password: string, password: string, confirm_password: string}
g}
  */
usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapAsync(changePasswordController)
)
//changePasswordValidator kiểm tra các giá trị truyền lên trên body cớ valid k ?

//unfollowValidator: kiểm tra user_id truyền qua params có hợp lệ hay k?\
/*
    des: refreshtoken
    path: '/refresh-token'
    method: POST
    Body: {refresh_token: string}
  g}
    */
usersRouter.post('/refresh-token', refreshTokenValidator, wrapAsync(refreshTokenController))
//khỏi kiểm tra accesstoken, tại nó hết hạn rồi mà
//refreshController chưa làm

export default usersRouter

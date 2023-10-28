import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'
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

export default usersRouter

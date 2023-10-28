# AcessToken Middleware dành cho logout

# tạo dựng chức năng logout

- `logout` phải là method `post` vì
  - `post` là thông qua một nút nhấn
  - `get` thì thường thông qua link để lấy dữ liệu, vậy thì người dùng sẽ dùng 1 url để logout, trông rất kỳ cục
  - ngoài ra ta còn mong muốn người dùng phải gữi lên cho mình một `rft`
  - vậy nên ta tạo logout với method `post` với 1
    header: Authorization: Bear access_token (dùng để biết account nào muốn logout)
    và body:{refresh_token} (dùng để xóa token trong collection refresh_tokens)
- vậy để logout người dùng sẽ truyền lên access_token và refresh_token, gữi qua route là `users/logout` và xử lý `access_token` bằng 1 middleware như sau:
  - validate access_token (kiểm tra client có gữi lên không, xem có đúng không)
  - gán decoded_authorization(json của payload: thông tin người gữi - user_iD) vào req : để sau này mình cần biết ai đã gữi req thì mình có xài
- xử lý `refresh_token` middleware như sau:
  - validate refresh_token(có gữi lên hay k, hết thời gian không, có trong database hay không)
  - gán decoded_authorization và req
- middleware xử lý xóa refresh_token
- trả về message logout thành công

- tham khảo luồng xử lý logout ở đây

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="800" height="450" src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FBeECRO014VsTDbyiWkgUyy%2FUntitled%3Ftype%3Ddesign%26node-id%3D0%253A1%26mode%3Ddesign%26t%3DjFTd64xLgUqRUEYh-1" allowfullscreen></iframe>

# bắt đầu xử lý

- vào route và thêm `logout`
  ```ts
  /*
    des: lougout
    path: /users/logout
    method: POST
    Header: {Authorization: Bearer <access_token>}
    body: {refresh_token: string}
    */
  usersRouter.post("/logout"); //ta sẽ thêm middleware sau
  ```
- thêm trong `message.ts` các thông báo lỗi
  ```ts
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required'
  ```
- giơ ta tạo middleware đầu tiền giúp validate accesstoken tên là `accessTokenValidator`
  và accessToken chỉ nằm ở Header nên ta sẽ cho checkSchema vào đúng `header` mà thôi
  đồng thời cũng fix lại các validator trên chỉ check `body` mà thôi ngoài ra `checkSchema` còn có thể check riêng các phần khác của req như `'body' | 'cookies' | 'headers' | 'params' | 'query'`

  ```ts
    export const loginValidator = validate(
        checkSchema(
            {
            ...
            },
            ['body']
        )
    )

    export const registerValidator = validate(
        checkSchema(
            {...
            },
            ['body']
        )
    )

    export const accessTokenValidator = validate(
        checkSchema(
            {
            Authorization: {
                notEmpty: {
                //kiểm tra có gữi lên không
                errorMessage: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
                },
                custom: {
                //value là giá trị của Authorization, req là req của client gữi lên server
                options: async (value: string, { req }) => {
                    //value của Authorization là chuỗi "Bearer <access_token>"
                    //ta sẽ tách chuỗi đó ra để lấy access_token bằng cách split
                    const access_token = value.split(' ')[1]
                    //nếu nó có truyền lên , mà lại là chuỗi rỗng thì ta sẽ throw error
                    if (!access_token) {
                        //throw new Error(USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED)
                        //này trả ra 422(k khợp validator) thì k hay, ta phải trả ra 401(UNAUTHORIZED)
                        throw new ErrorWithStatus({
                            message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                            status: HTTP_STATUS.UNAUTHORIZED
                        })
                    }
                    //kiểm tra xem access_token có hợp lệ hay không
                    const user = await databaseService.users.findOne({ access_token })
                    //tạm thời dừng đây 1 tý, ta cần phải viết hàm để verify access_token bằng jwt npm
                }
                }
            }
            },
            ['headers']
        )
    )
  ```

  - làm verify cho accesstoken bằng hàm có sẵn của [jwt npm](https://www.npmjs.com/package/jsonwebtoken) nhưng ta sẽ chuyển nó thành `promise` cho phù hợp với việc xử lý lỗi dồn về 1 `error handler`
    ![Alt text](image-86.png)

  - vào `jwt.ts` code thêm `verifyToken`

    ```ts
    export const verifyToken = ({
      token,
      secretOrPublicKey = process.env.JWT_SECRET as string,
    }: {
      token: string;
      secretOrPublicKey?: string;
    }) => {
      //trả về JwtPayload(thông tin người gữi req) nếu token hợp lệ
      return new Promise<jwt.JwtPayload>((resolve, reject) => {
        //method này sẽ verify token, nếu token hợp lệ thì nó sẽ trả về payload
        //nếu token không hợp lệ thì nó sẽ throw error
        //secretOrPublicKey dùng để verify token
        //nếu token được tạo ra bằng secret|PublicKey thì ta dùng secret|PublicKey key để verify
        //từ đó biết rằng access_token được tạo bởi chính server
        jwt.verify(token, secretOrPublicKey, (error, decoded) => {
          if (error) throw reject(error);
          resolve(decoded as jwt.JwtPayload);
        });
      });
    };
    ```

    quay lại code tiếp `accessTokenValidator` đoạn `options` và dùng `verifyToken` vừa viết
    đồng thời xử lý lỗi để lỗi trong đẹp, và tường minh hơn

    ```ts
     export const accessTokenValidator = validate(
        checkSchema(
            {
                Authorization: {
                    options: async (value: string, { req }) => {
                        ...
                        //nếu nó có truyền lên , mà lại là chuỗi rỗng thì ta sẽ throw error
                        if (!access_token) {
                            //throw new Error(USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED)
                            //này trả ra 422(k khợp validator) thì k hay, ta phải trả ra 401(UNAUTHORIZED)
                            throw new ErrorWithStatus({
                                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                                status: HTTP_STATUS.UNAUTHORIZED
                            })
                        }
                        //kiểm tra xem access_token có hợp lệ hay không
                        try {
                          const decoded_authorization = await verifyToken({ token: access_token })
                          //nếu không có lỗi thì ta lưu decoded_authorization vào req để khi nào muốn biết ai gữi req thì dùng
                          req.decoded_authorization = decoded_authorization
                        } catch (error) {
                          throw new ErrorWithStatus({
                            //(error as JsonWebTokenError).message sẽ cho chuỗi `accesstoken invalid`, không đẹp lắm
                            //ta sẽ viết hóa chữ đầu tiên bằng .capitalize() của lodash
                            message: capitalize((error as JsonWebTokenError).message),
                            status: HTTP_STATUS.UNAUTHORIZED
                          })
                        }
                        return true //nếu không có lỗi thì trả về true
                    }
                }
            }
        )
    ```

    test thử

    ```ts
    //bên route
    usersRouter.post(
      "/logout",
      accessTokenValidator,
      wrapAsync((req, res) => {
        res.json({ message: "Logout success" });
      })
    );
    ```

    login xong lấy `ac` và `rf`
    ![Alt text](image-87.png)
    tạo request `logout post` và cài thêm ac vào
    thêm Authorization cho header
    ![Alt text](image-88.png)
    thêm refresh cho body, nhưng chưa code nên bỏ trống
    ![Alt text](image-89.png)
    test
    ![Alt text](image-90.png)
    ví dụ truyền sai authorization - thiếu bearer
    ![Alt text](image-91.png)

# refresh token middleware và logout logic

- khi mà `logout`, `client` phải truyền lên `access_token` thông qua `headers` để mình biết `client` là ai
- ngoài ra còn phải truyền lên `refresh_token` để mình tiến hành xóa trên `database` vậy nên ta phải kiểm tra `refresh_token` là thật hay giả
- tiến hành làm `refreshToken middleware`

  - trong file `messages.ts` thêm `REFRESH_TOKEN_IS_INVALID: 'Refresh token is invalid'`
  - trong `users.middlewares.ts` tạo middleware `refreshTokenValidator` có nội dung validator như sau

    ```ts
    export const refreshTokenValidator = validate(
      checkSchema(
        {
          refresh_token: {
            notEmpty: {
              errorMessage: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
            },

            custom: {
              options: async (value: string, { req }) => {
                try {
                  const decoded_refresh_token = await verifyToken({
                    token: value,
                  });
                  //verify giá trị của refresh_token xem có hợp lệ hay không, quá trình này có thể phát sinh lỗi
                  //nếu không có lỗi thì lưu decoded_refresh_token vào req để khi nào muốn biết ai gữi req thì dùng
                  //decoded_refresh_token có dạng như sau
                  //{
                  //  user_Id: '64e3c037241604ad6184726c',
                  //  token_type: 1,
                  //  iat: 1693883172,
                  //  exp: 1702523172
                  //}

                  req.decoded_refresh_token = decoded_refresh_token;
                } catch (error) {
                  throw new ErrorWithStatus({
                    message: USERS_MESSAGES.REFRESH_TOKEN_IS_INVALID,
                    status: HTTP_STATUS.UNAUTHORIZED, //401
                  });
                }
                console.log(req.decoded_refresh_token); //xem xong ,test xong tắt
                return true; //nếu không có lỗi thì trả về true
              },
            },
          },
        },
        ["body"]
      )
    );
    ```

  - ta vào `users.routes.ts` thêm middleware này vào 1 route nào đó để test cho tiện, cụ thể là bỏ vào logout luôn để test

    ```ts
    usersRouter.post(
      "/logout",
      accessTokenValidator,
      refreshTokenValidator,
      wrapAsync((req, res) => {
        res.json({ message: "Logout success" });
      })
    );
    ```

  - ta test thử:
    - 1. ta thử logout và sẽ bị jwt hết hạn
         ![Alt text](image-92.png)
    - 2. ta đăng nhập lại để có `ac` và `rf`
         ![Alt text](image-93.png)
    - 3. copy `ac` bỏ vào logout>Auth>BearerToken, tắt biến Authorization khi mình dùng Auth rồi
         ![Alt text](image-94.png)
         ![Alt text](image-96.png)
    - 4. copy `rf` bỏ vào logout>body,
         nếu bỏ trống `rf` ta sẽ có lỗi `"Refresh token is required"` 422
         nếu sai thì ta sẽ có `"Refresh token is invalid"` 401
         ![Alt text](image-95.png)
  - theo mô hình thì sau khi check `rf` tồn tại trong request, verify xong, thì kiểm tra nó có tồn tại trong db hay không, chứ không phải là gán vào req liền
    ![Alt text](image-98.png)
  - nên giờ ta tiến hành code tiếp middleware`refreshTokenValidator` trong `users.middlewares.ts`, cụ thể là ngoài việc verify, ta kiểm tra `rf` này có trong db hay không

    - tạo `message.ts` là `USED_REFRESH_TOKEN_OR_NOT_EXIST: 'Used refresh token or not exist',`
    - `refreshTokenValidator` fix thành

      ```ts
      export const refreshTokenValidator = validate(
        checkSchema(
          {
            ...
            custom: {
              options: async (value: string, { req }) => {
                try {
                  // const decoded_refresh_token = await verifyToken({ token: value }) //không dùng nữa
                  //thay thành: vừa verify vừa tìm trong db xem có refresh_token này không
                  const [decoded_refresh_token, refresh_token] = await Promise.all([
                    verifyToken({ token: value }),
                    databaseService.refreshTokens.findOne({ token: value })
                  ])
                  //nếu không có refresh_token này trong db thì ta sẽ throw error
                  if (refresh_token === null) {
                    throw new ErrorWithStatus({
                      message: USERS_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                      status: HTTP_STATUS.UNAUTHORIZED //401
                    })
                  }
                  //nếu có thì ta lưu decoded_refresh_token vào req để khi nào muốn biết ai gữi req thì dùng
                  req.decoded_refresh_token = decoded_refresh_token
                } catch (error) {
                  //trong middleware này ta throw để lỗi về default error handler xử lý
                  if (error instanceof JsonWebTokenError) {
                    //nếu lỗi thuộc verify thì ta sẽ trả về lỗi này
                    throw new ErrorWithStatus({
                      message: capitalize((error as JsonWebTokenError).message),
                      //để báo lỗi tường minh hơn
                      status: HTTP_STATUS.UNAUTHORIZED //401
                    })
                  }
                  //còn nếu không phải thì ta sẽ trả về lỗi do ta throw ở trên try
                  throw error // này là lỗi đã tạo trên try
                  //việc phân biệt lỗi này giúp server trả ra lỗi tường mình và cụ thể hơn
              }
              return true //nếu không có lỗi thì trả về true
            }
            ...
          }
      )
      ```

  - test lại code bằng post man xem có ổn không ?

## làm logout logic

- trong `route logout` ta chưa có `logoutController`, chỉ là 1 cái hàm res.json đơn điệu, chưa làm gì cả
  ```ts
  usersRouter.post(
    "/logout",
    accessTokenValidator,
    refreshTokenValidator,
    wrapAsync((req, res) => {
      res.json({ message: "Logout success" });
    })
  );
  ```
  tý ta sẽ tạo `logoutController` nên giờ ta thay trước cho route
  ```ts
  usersRouter.post(
    "/logout",
    accessTokenValidator,
    refreshTokenValidator,
    wrapAsync(logoutController)
  );
  ```
- giờ ta sẽ vào `users.controllers.ts` tạo `logoutController` nhưng trước tiên ta nhớ rằng để logout ta sẽ truy cập vào database và xóa refresh_token đi, và khi xóa xong thì ta sẽ có message thông báo logout thành công nên

  - 1. `message.ts` thêm `LOGOUT_SUCCESS: 'Logout success'`
  - 2. `users.service.ts` thêm hàm logout - nhiệm vụ là vào db tìm và xóa refresh_token đc chỉ định, return ra thông báo LOGOUT_SUCCESS
    ```ts
      async logout(refresh_token: string) {
        await databaseService.refreshTokens.deleteOne({ token: refresh_token })
        return {
          message: USERS_MESSAGES.LOGOUT_SUCCESS
        }
      }
    ```
  - 3. `logoutController` lấy `rf` từ `req.body` do client gữi lên
       gọi usersService.logout(rf) để tìm và xóa
    ```ts
    //route này nhận vào refresh_token và access_token
    export const logoutController = async (req: Request, res: Response) => {
      const { refresh_token } = req.body;
      const result = await usersService.logout(refresh_token); //hàm trả ra chuỗi báo logout thành công
      return res.json(result);
    };
    ```

# tinh chỉnh hiệu năng 1 tý để flow code tốt hơn

- ở trong `logoutController`

```ts
export const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  req. //thì nó không nhắc code ta là trong req có gì
  ...
}
```

- đó là vì req của ta chỉ đang là any mà thôi, ta sẽ định dạng cho req của mình, để sau này nó sẽ nhắc code cho ta tốt hơn
- `decoded_refresh_token` và `decoded_authorization` là `JwtPayload`
  ![Alt text](image-99.png)
  và ở đây nó luôn thiếu `user_id` và `token_type`
- nên ta sẽ tạo interface mới tên `TokenPayload` kế thừa `JWTPayload` và cho `decoded_refresh_token` và `decoded_authorization` tạo ra từ nó

  - ta vào file định dạng `req` là `User.requests.ts` và thêm interface

    ```ts
    //định nghĩa req cho thằng logoutController
    export interface LogoutReqBody {
      refresh_token: string;
    }
    export interface TokenPayload extends JwtPayload {
      user_id: string;
      token_type: TokenType;
    }
    ```

  - định nghĩa `Request` có gì bằng `type.d.ts`

    ```ts
    declare module "express" {
      interface Request {
        user?: User;
        decoded_authorization?: TokenPayload;
        decoded_refresh_token?: TokenPayload;
      }
    }
    ```

  - ở `jwt.ts` cho khi `verify` xong thì trả ra `decode` có dạng là `TokenPayload`

    ```ts
    export const verifyToken = ({
    ...
    }) => {

      return new Promise<TokenPayload>((resolve, reject) => {//TokenPayload
        jwt.verify(token, secretOrPublicKey, (error, decoded) => {
          if (error) throw reject(error)
          resolve(decoded as TokenPayload)//đổi thành TokenPayload
        })
      })
    }
    ```

  - lúc này ở `user.middlewares.ts` ta có thể viết thành

    ```ts
    //trong accessTokenValidator
    //req.decoded_authorization = decoded_authorization //bỏ và thay thành
    (req as Request).decoded_authorization = decoded_authorization;

    //tương tự với  refreshTokenValidator
    //req.decoded_refresh_token = decoded_refresh_token //bỏ và thay thành
    (req as Request).decoded_refresh_token = decoded_refresh_token;
    ```

    ta sẽ fix lại 1 tý logoutController và test lại sẽ
    thấy rằng lúc này ta sẽ đc nhắc code

    ```ts
    export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
      const { refresh_token } = req.body. //giả xử có chấm nữa thì nó sẽ hiện refresh_token
      req. //lúc này ở đây cũng sẽ nhắc code cho ta
      ...
    }
    ```

- trong `.env` ta thấy rằng ta chỉ dùng 1 JWT_SECRET để sign và verify cho cả access, refresh và sau này là mail
  điều này vô hình chung làm cho code của ta k bảo mật và chặc chẽ, nên giờ ta sẽ tạo riêng cho chúng 3 cái token khác nhau luôn

  ```
    // JWT_SECRET = '123!@#' thay thành
    JWT_SECRET_ACCESS_TOKEN = '123!@#1'
    JWT_SECRET_REFRESH_TOKEN = '123!@#2'
    JWT_SECRET_EMAIL_VERIFY_TOKEN = '123!@#2'
  ```

  - code lại `signToken` và `verifyToken` trong `jwt.ts`

  ```ts
  export const signToken = ({
    payload,
    //privateKey = process.env.JWT_SECRET as string,
    privateKey,
    options = { algorithm: 'HS256' }
  }: {
  payload: object | string | Buffer
  privateKey: string // bỏ ? để ép truyền vào

  //tương tự với verifyToken
  export const verifyToken = ({
    token,
    //secretOrPublicKey = process.env.JWT_SECRET as string
    secretOrPublicKey,
  }: {
    token: string
    secretOrPublicKey: string
  ```

  - ta làm vậy thì cách xài verify đã thay đổi, nên nó sẽ lỗi ở những chỗ dùng signToken và verifyToken

    - 1.  `users.services.ts > UsersService `

    ```ts
    class UsersService {
      private signAccessToken(user_Id: string) {
        return signToken({
          payload: { user_Id, token_type: TokenType.AccessToken },
          options: { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_IN },
          privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string //thêm
        })
      }
      private signRefreshToken(user_Id: string) {
        return signToken({
          payload: { user_Id, token_type: TokenType.RefreshToken },
          options: { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_IN },
          privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string //thêm
        })
      }
      ...
    ```

    - 2.trong `users.middlewares.ts`

    ```ts
    //trong accessTokenValidator ,đoạn
    // const decoded_authorization = await verifyToken({ token: access_token }) đổi thành
    const decoded_authorization = await verifyToken({
      token: access_token,
      secretOrPublicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
    });
    //////
    //trong refreshTokenValidator, đoạn
    //const [decoded_refresh_token, refresh_token] = await Promise.all([
    //  verifyToken({ token: value }),
    //  databaseService.refreshTokens.findOne({ token: value })
    //])
    //đổi thành
    const [decoded_refresh_token, refresh_token] = await Promise.all([
      verifyToken({
        token: value,
        secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      }),
      databaseService.refreshTokens.findOne({ token: value }),
    ]);
    ```

- nếu request login|logout thiếu access_token hay refresh_token thì ta sẽ trả về lỗi 422(sai validator), điều này mình không thích, vì lỗi thiếu đó mình muốn là 401: UnAuthorized
  vậy nên mình sẽ fix lại các middlewares `accessTokenValidator` và `refreshTokenValidator`

  ```ts
  //đoạn của accessTokenValidator, ta thêm trim để xóa khoảng cách thừa và
  export const accessTokenValidator = validate(
    checkSchema(
      {
        Authorization: {
          custom: {
            //value là giá trị của Authorization, req là req của client gữi lên server
            options: async (value: string, { req }) => {
              //value của Authorization là chuỗi "Bearer <access_token>"
              //ta sẽ tách chuỗi đó ra để lấy access_token bằng cách split
              const access_token = (value || '').split(' ')[1]
              //nếu value là null thì ta sẽ gán nó bằng chuỗi rỗng
              //thì khi băm ra nó vẫn là chuỗi ""
      ...


  //đoạn của refreshTokenValidator, ta thêm trim để xóa khoảng cách thừa và
  export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true, //thêm
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED //401
              })
            }
            try {
              ...
  ```

- giờ ta test lại postman 1 lần

# tối ưu hóa postman

- tạo enviroment cho postman
  ![Alt text](image-100.png)
  chọn add
- tạo các biến
  ![Alt text](image-101.png)
- cho logout xài biến luôn
  ![Alt text](image-103.png)
  ![Alt text](image-104.png)
- set access_token cho toàn thư mục
  folder>users>authorization>type>Bearer Token>
  ![Alt text](image-105.png)
  logout chỉ cần `inherit autho from parent`
  ![Alt text](image-106.png)

- tự động lưu access và refresh token vào envi
  - login ta thêm script
  ```js
  pm.test("Login thành công", function () {
    pm.response.to.have.status(200);
    let responseJson = pm.response.json();
    const { access_token, refresh_token } = responseJson.result;
    pm.environment.set("access_token", access_token);
    pm.environment.set("refresh_token", refresh_token);
  });
  ```
- và test lại bth giữa login và logout

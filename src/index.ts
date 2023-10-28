import { connect } from 'http2'
import express, { NextFunction, Request, Response } from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'
const PORT = 7000
const app = express()
app.use(express.json())
databaseService.connect()

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.use('/users', usersRouter)
//
app.use(defaultErrorHandler)
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

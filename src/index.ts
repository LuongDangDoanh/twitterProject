import { connect } from 'http2'
import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
const PORT = 6000
const app = express()
app.use(express.json())
databaseService.connect()

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.use('/users', usersRouter)
//
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})

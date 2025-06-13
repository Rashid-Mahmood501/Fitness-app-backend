const express = require('express')
const connectDB = require('./src/config/database')
const authRoutes = require('./src/routes/auth.routes')


const app = express()
const port = 3000

app.use(express.json())
app.use('/api', authRoutes)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}).catch((err) => {
  console.log('Error connecting to MongoDB', err)
})

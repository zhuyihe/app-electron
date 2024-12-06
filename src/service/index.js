const app = require('express')()
const server = require('http').createServer(app)
const port = process.env.PORT || 5555
const bodyParser = require('body-parser')
const cors = require('cors')
const routes = require('./routes')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb', parameterLimit: 1000000 }))
app.use(
    bodyParser.json({
        limit: '10mb'
    })
)

app.use('/', routes)
const service = () => {
    server.listen(port, () => {
        console.log(`server is running on port http://localhost:${port}`)
    })
}

export default service

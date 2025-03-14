const express = require('express')
const { validationResult, body, param } = require('express-validator')
const bcrypt = require('bcrypt')
const uuid = require("uuid")
const mongoose = require("mongoose")
require("dotenv").config()

const app = express()

const saltRounds = 10

app.use(express.json())

console.log(`mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}?authSource=admin`)

mongoose.connect(
    `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}?authSource=admin`, 
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
).then(
    () => console.log("Connected to MongoDB"),
    err => {
        console.log(err)
        process.exit(1)
    }
)

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuid.v4,
        unique: true
    },
    name: String,
    email: {
        type: String,
        unique: true
    },
    password: String,
    createAt: Date,
})

const UsersModel = mongoose.model("users", userSchema)

app.post('/users', body(['name', 'password']).isString(), body('email').isEmail(), async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        res.status(400).json({errors: result.array(), message: 'Validation failed', status: 400})
        return
    }

    const id = uuid.v4()
    const name = req.body.name
    const email = req.body.email
    const password = req.body.password
    const password_hash = bcrypt.hashSync(password, saltRounds)

    if (await UsersModel.exists({email: email})) {
        res.status(400).json({errors: {
            "type": "field",
            "value": email,
            "msg": "Email already exists",
            "path": "email",
            "location": "body"
        }, message: 'Email already exists', status: 400})
        return
    }

    const row = {
        id: id,
        name: name,
        email: email,
        createAt: new Date(),
    }

    const user = new UsersModel({...row, password: password_hash})
    user.save().then(
        () => res.json({
            message: 'User created successfully',
            data: row,
            status: 200
        }),
        err => res.status(500).json({
            message: err,
            status: 500
        }),
    )
})

app.get('/users', (req, res) => {
    UsersModel.find({}).then(
        users => {
            const new_users = users.map(user => {
                const m_user = {...(user.toJSON())}
                delete m_user.password
                delete m_user._id
                delete m_user.__v
                return m_user
            })

            res.json({
                data: new_users,
                count: new_users.length,
                status: 200
            })
        },
        err => res.status(500).json({
            message: err,
            status: 500
        }),
    )
})

app.get('/users/:id', param('id').isUUID(), async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        res.status(400).json({errors: result.array(), message: 'Validation failed', status: 400})
        return
    }

    const id = req.params.id

    const user = await UsersModel.findOne({id: id})
    if (user === null) {
        res.status(404).json({errors: {
            "type": "field",
            "value": id,
            "msg": "User not found",
            "path": "id",
            "location": "params"
        }, message: 'User not found', status: 404})
        return
    }

    const m_user = user.toJSON()
    delete m_user.password
    delete m_user._id
    delete m_user.__v
    
    res.json({
        data: m_user,
        status: 200
    })
})

app.put('/users/:id', param('id').isUUID(), body(['name', 'password']).isString(), body('email').isEmail(), async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        res.status(400).json({errors: result.array(), message: 'Validation failed', status: 400})
        return
    }

    const id = req.params.id

    const user = await UsersModel.findOne({id: id})
    if (user === null) {
        res.status(404).json({errors: {
            "type": "field",
            "value": id,
            "msg": "User not found",
            "path": "id",
            "location": "params"
        }, message: 'User not found', status: 404})
        return
    }

    const m_user = user.toJSON()

    const old_user = {...m_user}
    delete old_user.password
    delete old_user._id
    delete old_user.__v

    const cari = await UsersModel.findOne({email: req.body.email})
    if (cari !== null) {
        if (cari.id !== id) {
            res.status(400).json({errors: {
                "type": "field",
                "value": req.body.email,
                "msg": "Email already used",
                "path": "email",
                "location": "body"
            }, message: 'Email already used', status: 400})
            return
        }
    }
    
    user.name = req.body.name
    user.email = req.body.email
    if (req.body.password !== "") {
        const password_hash = bcrypt.hashSync(req.body.password, saltRounds)
        user.password = password_hash
    }
    
    UsersModel.updateOne({id: id}, user).then(
        () => {
            const mm_user = user.toJSON()
            delete mm_user.password
            delete mm_user._id
            delete mm_user.__v
            res.json({
                message: `Update user ${id}`,
                old_user: old_user,
                data: mm_user,
                status: 200
            })
        },
        err => res.status(500).json({
            message: err,
            status: 500
        }),
    )
})

app.delete('/users/:id', param('id').isUUID(), async (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        res.status(400).json({errors: result.array(), message: 'Validation failed', status: 400})
        return
    }

    const id = req.params.id

    const user = await UsersModel.findOne({id: id})
    if (user === null) {
        res.status(404).json({errors: {
            "type": "field",
            "value": id,
            "msg": "User not found",
            "path": "id",
            "location": "params"
        }, message: 'User not found', status: 404})
        return
    }

    const m_user = user.toJSON()
    delete m_user.password
    delete m_user._id
    delete m_user.__v

    UsersModel.deleteOne({id: id}).then(
        () => res.json({
            message: `Delete user ${id}`,
            data: m_user,
            status: 200
        }),
        err => res.status(500).json({
            message: err,
            status: 500
        }),
    )
})

const port = 3000
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
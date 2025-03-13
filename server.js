const express = require('express')
const { validationResult, body, param } = require('express-validator')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const app = express()

var users = []

const saltRounds = 10

app.use(express.json())

app.post('/users', body(['name', 'password']).isString(), body('email').isEmail(), (req, res) => {
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

    if (users.filter(user => user.email === email).length > 0) {
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
    }

    users.push({
        ...row,
        password: password_hash
    })

    res.json({
        message: 'User created successfully',
        status: 200,
        data: row,
    })
})

app.get('/users', (req, res) => {
    const result = users.map(user => {
        const m_user = {...user}
        delete m_user.password
        return m_user
    })

    res.json({
        data: result,
        count: result.length,
        status: 200
    })
})

app.get('/users/:id', param('id').isUUID(), (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        res.status(400).json({errors: result.array(), message: 'Validation failed', status: 400})
        return
    }

    const id = req.params.id

    if (users.filter(user => user.id === id).length === 0) {
        res.status(404).json({errors: {
            "type": "field",
            "value": id,
            "msg": "User not found",
            "path": "id",
            "location": "params"
        }, message: 'User not found', status: 404})
        return
    }

    const user = { ...(users.filter(user => user.id === id)[0])}
    delete user.password
    
    res.json({
        data: user,
        status: 200
    })
})

app.put('/users/:id', param('id').isUUID(), body(['name', 'password']).isString(), body('email').isEmail(), (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        res.status(400).json({errors: result.array(), message: 'Validation failed', status: 400})
        return
    }

    const id = req.params.id

    if (users.filter(user => user.id === id).length === 0) {
        res.status(404).json({errors: {
            "type": "field",
            "value": id,
            "msg": "User not found",
            "path": "id",
            "location": "params"
        }, message: 'User not found', status: 404})
        return
    }

    const user = users.filter(user => user.id === id)[0]
    const old_user = {...user}
    delete old_user.password
    
    const cari = users.filter(user => user.email === req.body.email)
    if (cari.length > 0) {
        if (cari[0].id !== id) {
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
    user.password = bcrypt.hashSync(req.body.password, saltRounds)

    const new_user = {...user}
    delete new_user.password

    res.json({
        message: `Update user ${id}`,
        old_user: old_user,
        data: new_user,
        status: 200
    })
})

app.delete('/users/:id', param('id').isUUID(), (req, res) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
        res.status(400).json({errors: result.array(), message: 'Validation failed', status: 400})
        return
    }

    const id = req.params.id

    if (users.filter(user => user.id === id).length === 0) {
        res.status(404).json({errors: {
            "type": "field",
            "value": id,
            "msg": "User not found",
            "path": "id",
            "location": "params"
        }, message: 'User not found', status: 404})
        return
    }

    const user = users.filter(user => user.id === id)[0]
    users = users.filter(user => user.id !== id)
    delete user.password
    res.json({
        message: `Delete user ${id}`,
        data: user,
        status: 200
    })
})

const port = 3000
app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
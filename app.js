require('dotenv').config();

const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const cors = require('cors');

const { JWT_SECRET } = process.env;

const dynamoClient = require('./dynamo');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

function auth(req, res, next) {
    const token = req.headers.authorization.split(' ')[1];
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
}

// get list of todos
app.get('/todo', auth, async (req, res) => {
    const tableName = 'todos';
    const userId = req.user.id;
    const todos = await dynamoClient.getItems(tableName) || [];
    res.send(todos.filter(todo => todo.status == 'active' && todo.userId == userId));
});

// create a todo
app.post('/todo', auth, async (req, res) => {
    const { text } = req.body;
    const tableName = 'todos';

    const todo = {
        id: randomUUID(),
        userId: req.user.id,
        status: 'active',
        text
    }
    await dynamoClient.saveItem(tableName, todo);
    res.send(todo);
});

// edit a todo
app.put('/todo/:id', async (req, res) => {
    const { text } = req.body;
    const { id } = req.params;
    const tableName = 'todos';

    const todo = {
        id,
        text
    }
    await dynamoClient.saveItem(tableName, todo);
    res.send(todo);
});

// delete a todo
app.delete('/todo/:id', async (req, res) => {
    const tableName = 'todos';
    const { id } = req.params;

    const todo = {
        id,
        status: 'inactive',
    };

    await dynamoClient.saveItem(tableName, todo);
    res.send(todo);
});

// user register
app.post('/register', async (req, res) => {
    const { name, login, password } = req.body;

    const tableName = 'users';
    const id = randomUUID();
    await dynamoClient.saveItem(tableName, {
        id,
        name,
        login,
        password,
    });

    const token = jwt.sign({ id, name, login }, JWT_SECRET);
    res.send(token);
});

// user login
app.post('/login', async (req, res) => {
    const { login, password } = req.body;
    const tableName = 'users';

    const users = await dynamoClient.getItems(tableName);

    const user = users && users.find(u => u.login == login && u.password == password);

    const token = jwt.sign({
        id: user.id,
        name: user.name,
        login: user.login
    }, JWT_SECRET);

    res.send(token);
});

app.listen(3000, () => console.log('Listening on 3000'));
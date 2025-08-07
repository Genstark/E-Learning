const express = require('express');
const app = express();
const { MongoClient} = require('mongodb');
const cors = require('cors');
require('dotenv').config();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

// Middleware to parse JSON requests
app.use(express.json());

const uri = process.env.MONGO;
const client = new MongoClient(uri);
client.connect().then(() => {
    client.db("E-Learning");
    console.log("Connected to MongoDB successfully");
}).catch(err => {
    console.error("Failed to connect to MongoDB:", err);
});

app.get('/api', async (req, res) => {
    const name = req.query.name || 'World';
    res.send('Hello World! '+name);
});

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        await client.db("E-Learning").collection("users").insertOne({
            name,
            email,
            password
        });
        res.status(201).json({ message: 'User created successfully', success: true });
    } catch (error) {
        console.error('something invalid from input');
        console.error("Error inserting user:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        await client.db("E-Learning").collection("users").insertOne({
            name,
            email,
            password
        });
        res.status(201).json({ message: 'User created successfully', success: true });
    } catch (error) {
        console.error('something invalid from input');
        console.error("Error inserting user:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log(`Server is running on port http://localhost:3000`);
});
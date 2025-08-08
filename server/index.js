const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
    res.send('Hello World! ' + name);
});

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const hashedName = await bcrypt.hash(name, 10);
    const hashedEmail = await bcrypt.hash(email, 10);
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await client.db("E-Learning").collection("users").insertOne({
            name: hashedName,
            email: hashedEmail,
            password: hashedPassword
        });
        res.status(201).json({ message: 'User created successfully', ok: true });
    } catch (error) {
        console.error('something invalid from input');
        console.error("Error inserting user:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const allUsers = await client.db("E-Learning").collection("users").find().toArray();
        // const user = await client.db("E-Learning").collection("users").findOne({ email });
        if (!allUsers) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        for(let i=0; i < allUsers.length; i++) {
            if (await bcrypt.compare(email, allUsers[i].email)) {
                const isUserEmail = await bcrypt.compare(email, allUsers[i].email);
                const isPasswordValid = await bcrypt.compare(password, allUsers[i].password);
                if (isPasswordValid && isUserEmail) {
                    return res.status(200).json({ message: 'Login successful', ok: true });
                }
            }
        }
        res.status(401).json({ error: 'Invalid email or password' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/submit', async (req, res) => {
    const { timeTaken, clearedTargets } = req.body;
    if (typeof timeTaken !== 'number' || typeof clearedTargets !== 'number') {
        return res.status(400).json({ error: 'Invalid data' });
    }
    console.log(timeTaken, clearedTargets);
    try {
        await client.db("E-Learning").collection("number-bowling-score").insertOne({
            timeTaken,
            clearedTargets,
            submittedAt: new Date()
        });
        res.status(201).json({ message: 'Score submitted successfully', ok: true });
    } catch (error) {
        console.error("Error submitting score:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/number-bowling/data', async (req, res) => {
    try {
        const bowlingData = await client.db("E-Learning").collection("number-bowling-score").find().toArray();
        if (bowlingData.length > 0) {
            res.status(200).json(bowlingData);
        }
        else {
            res.status(404).json({ message: 'No bowling data found' });
        }
    } catch (error) {
        console.error("Error fetching bowling data:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log(`Server is running on port http://localhost:3000`);
});
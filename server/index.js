const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const { generateSecretKey } = require('./utils/generateSecreteKey');
const { rollDice } = require('./utils/randomRollDice');
const path = require('path');
const ngrok = require('@ngrok/ngrok');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
let rolldicenumber = [];

// Middleware to parse JSON requests
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(express.static(path.join(__dirname, 'dist'), { 'extensions': ['html', 'css', 'js'] }));

function authenticateToken(req, res, next) {
    const token = req.header('Authorization').replace('Bearer ', '');
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.user = decoded;
        next();
    } catch (ex) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const uri = process.env.MONGO;
const client = new MongoClient(uri);
client.connect().then(() => {
    client.db("E-Learning");
    console.log("Successfully connected");
}).catch(err => {
    console.error("Failed to connect:", err);
});

app.get('/api/validate-token', authenticateToken, (req, res) => {
    res.json({ message: 'Token is valid' });
});

app.get('/api', async (req, res) => {
    const name = req.query.name || 'World';
    const last = req.query.last || '!';
    res.status(200).json({ message: `Hello ${name} ${last}`, key: generateSecretKey() });
    // res.send(`Hello World! ${name} ${last}`);
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
        for (let i = 0; i < allUsers.length; i++) {
            if (await bcrypt.compare(email, allUsers[i].email)) {
                const isUserEmail = await bcrypt.compare(email, allUsers[i].email);
                const isPasswordValid = await bcrypt.compare(password, allUsers[i].password);
                if (isPasswordValid && isUserEmail) {
                    const token = jwt.sign({ email: allUsers[i].email }, generateSecretKey(), { expiresIn: '3d' });
                    return res.status(200).json({ message: 'Login successful', ok: true, token });
                }
            }
        }
        res.status(401).json({ error: 'Invalid email or password' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/roll-dice', (req, res) => {
    try {
        res.status(200).json({ result: rolldicenumber });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/submit', async (req, res) => {
    const { timeTaken, clearedTargets, totalTime } = req.body;
    if (typeof timeTaken !== 'number' || typeof clearedTargets !== 'number') {
        return res.status(400).json({ error: 'Invalid data' });
    }
    try {
        await client.db("E-Learning").collection("number-bowling-score").insertOne({
            timeTaken,
            clearedTargets,
            totalTime,
            submittedAt: new Date(),
        });
        res.status(201).json({ message: 'Score submitted successfully', ok: true });
    } catch (error) {
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
        res.status(500).json({ error: 'Internal server error' });
    }
});

// testing api
function rankPlayers(players) {
    // Sort players
    const sorted = [...players].sort((a, b) => {
        const totalA = a.mcqscore + a.totalNumberSolved;
        const totalB = b.mcqscore + b.totalNumberSolved;

        // 1. Sort by total solved (desc)
        if (totalA !== totalB) {
            return totalB - totalA;
        }

        // 2. If solved same → sort by time (asc, lower is better)
        return a.totalInSeconds - b.totalInSeconds;
    });

    // Assign ranks (dense style: 1,1,2)
    let rank = 1;
    sorted[0].rank = rank;

    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];

        const prevTotal = prev.mcqscore + prev.totalNumberSolved;
        const currTotal = curr.mcqscore + curr.totalNumberSolved;

        if (prevTotal === currTotal && prev.totalInSeconds === curr.totalInSeconds) {
            curr.rank = prev.rank; // tie → same rank
        } else {
            curr.rank = ++rank;
        }
    }

    return sorted;
}

app.get('/api/submit/data', async (req, res) => {
    try {
        const submitData = await client.db("E-Learning").collection("daily-tasks").find().toArray();
        const rankedData = rankPlayers(submitData);
        if (rankedData.length > 0) {
            res.status(200).json(rankedData);
        }
        else {
            res.status(404).json({ message: 'No submit data found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/submit/daily-tasks', async (req, res) => {
    const response = req.body;
    try {
        await client.db("E-Learning").collection("daily-tasks").insertOne(response);
        console.log("Daily tasks submitted successfully");
    } catch (error) {
        console.error("Error submitting daily tasks:", error);
    }
    console.log(response);
    res.status(200).json({ message: 'Daily tasks submitted successfully', ok: true });
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

let job = cron.schedule("* * * * * *", async () => {
    rolldicenumber = await rollDice();

    // Agar dice me number aa gaya (length > 0) to per minute schedule par switch kar do
    if (rolldicenumber.length > 0) {
        job.stop(); // pehle job band karo
        job = cron.schedule("0 0 * * *", async () => {
            rolldicenumber = await rollDice();
        });
        console.log("✅ Switched to 24-hour schedule");
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port http://localhost:${process.env.PORT || 3000}`);
});

const canRunNgrok = false; // Set to true if you want to run ngrok
if (canRunNgrok) {
    ngrok.connect({ addr: process.env.PORT || 3000, authtoken: process.env.NGROK })
        .then(listener => console.log(`Ingress established at: ${listener.url()}`));
}
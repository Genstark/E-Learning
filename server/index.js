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
const googleAPI = require('./utils/googleAPI');
const { encryptToken, decryptToken } = require('./utils/Encryption');
require('dotenv').config();

const app = express();
let rolldicenumber = [];
let questions = [];
let SECRET_KEY = null;

// Middleware to parse JSON requests
app.use(cors({
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(express.static(path.join(__dirname, '../dist'), { 'extensions': ['html', 'css', 'js'] }));

async function authenticateToken(req, res, next) {
    // Token can be sent via Authorization header or cookie
    let token = req.header('Authorization');
    if (token && token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '');
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Token missing', credentials: false });
    }

    try {
        const decodedToken = await decryptToken({action:'decrpyt', token});
        const decoded = jwt.verify(decodedToken, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (ex) {
        return res.status(401).json({ error: 'Invalid token', credentials: false });
    }
}

const uri = process.env.MONGO;
const client = new MongoClient(uri);

client.connect().then(async () => {
    const db = client.db("E-Learning");
    // Ensure unique indexes on email and name fields
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ name: 1 }, { unique: true });
    console.log("Successfully connected to MongoDB and ensured indexes");
}).catch(err => {
    console.error("Failed to connect:", err);
});

app.get('/api/validate-token', authenticateToken, (req, res) => {
    try {
        if (!req.user) {
            console.log("Token is invalid");
            return res.status(401).json({ error: 'Invalid token', ok: false });
        }
        // console.log("Token is valid for user:", req.user);
        res.status(200).json({ message: 'Token is valid', ok: true, user: req.user });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error', ok: false });
    }
});

app.post('/api', async (req, res) => {
    const data = req.body;
    const token = await decryptToken(data);
    res.status(200).json({ 'token': token, key: SECRET_KEY });
    // res.send(`Hello World!`);
});

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Use $or to check both email and name in a single query for better performance
        const existingUser = await client.db("E-Learning").collection("users").findOne({
            $or: [{ email }, { name }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(409).json({ error: 'Email already in use', ok: false });
            }
            if (existingUser.name === name) {
                return res.status(409).json({ error: 'Username already in use', ok: false });
            }
        }
    } catch (error) {
        console.error("Error checking existing user:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }

    // const hashedName = await bcrypt.hash(name, 10);
    // const hashedEmail = await bcrypt.hash(email, 10);
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await client.db("E-Learning").collection("users").insertOne({
            name,
            email,
            password: hashedPassword
        });
        res.status(200).json({ message: 'User created successfully', ok: true });
    } catch (error) {
        console.error('something invalid from input');
        console.error("Error inserting user:", error);
        res.status(500).json({ error: 'Internal server error', ok: false });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    try {
        const user = await client.db("E-Learning").collection("users").findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        if (await bcrypt.compare(password, user.password)) {
            let token = jwt.sign({ email: user.email, username: user.name }, SECRET_KEY, { expiresIn: '23h' });
            token = await encryptToken({ action: 'encrypt', token });
            res.cookie('token', token, { httpOnly: false, secure: true, sameSite: 'Strict', maxAge: 23 * 60 * 60 * 1000 });
            return res.status(200).json({ message: 'Login successful', ok: true, token, user: user.name });
        }
        res.status(401).json({ error: 'Invalid email or password' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/roll-dice', async (req, res) => {
    try {
        // console.log(questions);
        res.status(200).json({ result: rolldicenumber, 'questions': questions });
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

app.get('/api/daily-tasks/scoreboard', async (req, res) => {
    try {
        const scoreboardData = await client.db("E-Learning").collection("daily-tasks").find().toArray();
        if (scoreboardData.length === 0) {
            return res.status(404).json({ message: 'No scoreboard data found' });
        }
        const rankedData = await rankPlayers(scoreboardData);
        console.log(rankedData);
        res.status(200).json({scoreData: rankedData, ok: true});
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

function rankPlayers(players) {
    // Sort players
    return [...players].sort((a, b) => {
        const totalA = a.mcqscore + a.totalNumberSolved;
        const totalB = b.mcqscore + b.totalNumberSolved;

        // 1. Sort by total solved (desc)
        if (totalA !== totalB) {
            return totalB - totalA;
        }

        // 2. If solved same → sort by time (asc, lower is better)
        return a.totalInSeconds - b.totalInSeconds;
    });
}

app.post('/api/submit/daily-tasks', async (req, res) => {
    const response = req.body;
    const findEmail = await client.db("E-Learning").collection("users").findOne({ name: response.userName });
    if (!findEmail) {
        return res.status(400).json({ error: 'User not found', ok: false });
    }
    response.userEmail = findEmail.email;
    try {
        await client.db("E-Learning").collection("daily-tasks").insertOne(response);
        console.log("Daily tasks submitted successfully");
    } catch (error) {
        console.error("Error submitting daily tasks:", error);
    }
    res.status(200).json({ message: 'Daily tasks submitted successfully', ok: true });
});

// home page route
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

let job = cron.schedule("* * * * * *", async () => {
    if (!SECRET_KEY) {
        SECRET_KEY = generateSecretKey();
        console.log("Generated new SECRET_KEY");
    }
    if (rolldicenumber.length == 0 && questions.length == 0) {
        console.log("Running initial fetch for dice and questions");
        rolldicenumber = await rollDice();
        questions = await googleAPI.generateText("generate most tough and tough questions scientific");
        console.log('Questions and dice fetched');
    }
    // Agar dice me number aa gaya (length > 0) to per minute schedule par switch kar do
    if (rolldicenumber.length > 0 && questions.length > 0) {
        job.stop(); // pehle job band karo
        job = cron.schedule("0 0 * * *", async () => {
            rolldicenumber = await rollDice();
            questions = await googleAPI.generateText("generate most tough and tough questions scientific");
            console.log('Questions and dice fetched');
            SECRET_KEY = generateSecretKey();
            console.log("Generated new SECRET_KEY");
        });
        console.log("✅ Switched to 24-hour schedule for both dice and questions");
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
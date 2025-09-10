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

function authenticateToken(req, res, next) {
    // Token can be sent via Authorization header or cookie
    let token = req.header('Authorization');
    if (token && token.startsWith('Bearer ')) {
        token = token.replace('Bearer ', '');
        // console.log("Token from header:", req.cookies.token);
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ error: 'Token missing', credentials: false });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (ex) {
        return res.status(401).json({ error: 'Invalid token', credentials: false });
    }
}

const uri = process.env.MONGO;
const client = new MongoClient(uri);
client.connect().then(() => {
    client.db("E-Learning");
    console.log("Successfully connected");
}).catch(err => {
    console.error("Failed to connect:", err);
});

app.get('/api/validate-token', authenticateToken, (req, res) => {
    console.log("Token is valid for user:", req.user);
    try {
        if(!req.user) {
            return res.status(401).json({ error: 'Invalid token', ok: false });
        }
        res.status(200).json({ message: 'Token is valid', ok: true, user: req.user });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error', ok: false });
    }
});

app.get('/api', async (req, res) => {
    const name = req.query.name || 'World';
    const last = req.query.last || '!';
    res.status(200).json({ message: `Hello ${name} ${last}`, key: SECRET_KEY });
    // res.send(`Hello World! ${name} ${last}`);
});

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const existingUser = await client.db("E-Learning").collection("users").findOne({ email });
        const usernaemeExist = await client.db("E-Learning").collection("users").findOne({ name });
        if (usernaemeExist) {
            return res.status(409).json({ error: 'Username already in use', ok: false });
        }
        if (existingUser) {
            return res.status(409).json({ error: 'Email already in use', ok: false }); // Conflict
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
        const allUsers = await client.db("E-Learning").collection("users").find().toArray();
        // const allUsers = await client.db("E-Learning").collection("users").findOne({ email });
        if (!allUsers) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        for (let i = 0; i < allUsers.length; i++) {
            if (allUsers[i].email === email) {
                if (await bcrypt.compare(password, allUsers[i].password)) {
                    const token = jwt.sign({ email: allUsers[i].email }, SECRET_KEY, { expiresIn: '23h' });
                    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 23 * 60 * 60 * 1000 });
                    return res.status(200).json({ message: 'Login successful', ok: true, token });
                }
            }
            // if (await bcrypt.compare(email, allUsers[i].email)) {
            //     const isUserEmail = await bcrypt.compare(email, allUsers[i].email);
            //     const isPasswordValid = await bcrypt.compare(password, allUsers[i].password);
            //     if (isPasswordValid && isUserEmail) {
            //         const token = jwt.sign({ email: allUsers[i].email }, generateSecretKey(), { expiresIn: '23h' });
            //         res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'Strict', maxAge: 23 * 60 * 60 * 1000 });
            //         return res.status(200).json({ message: 'Login successful', ok: true, token });
            //     }
            // }
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


app.get('/api/daily-tasks/scoreboard', async (req, res) => {
    try {
        const scoreboardData = await client.db("E-Learning").collection("daily-tasks").find().toArray();
        if(scoreboardData.length === 0) {
            return res.status(404).json({ message: 'No scoreboard data found' });
        }
        const rankedData = rankPlayers(scoreboardData);
        console.log(rankedData);
        res.status(200).json(rankedData);
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
    console.log(response._id);
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
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
const cron = require('node-cron'); // not required but useful for scheduling
const googleAPI = require('./utils/googleAPI');
const { encryptToken, decryptToken } = require('./utils/Encryption');
const { uploadData, downloadData, downloadDataByDate } = require('./utils/uploadingData');
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
        const decodedToken = await decryptToken({ action: 'decrpyt', token });
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

app.get('/api/validate-token', authenticateToken, async (req, res) => {
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

app.post('/api/reset-email', async (req, res) => {
    if (req.body.task === 'confirmation') {
        const { userName, userEmail } = req.body;
        const findUser = await client.db("E-Learning").collection("users").findOne({ name: userName, email: userEmail });
        if (!findUser) {
            console.log('user not found');
            return res.status(400).json({ error: 'User not found', ok: false });
        }
        res.status(200).json({ message: 'got the message', ok: true, userName: findUser.name, userEmail: findUser.email });
    }

    if (req.body.task === 'resetEmail') {
        const { userName, userEmail, confirmEmail } = req.body;
        try {
            await client.db("E-Learning").collection("users").updateOne(
                { email: userEmail },
                { $set: { email: confirmEmail } }
            );
            res.status(200).json({ message: 'Email updated successfully', ok: true });
        } catch (error) {
            console.error("Error updating email:", error);
            res.status(500).json({ error: 'Internal server error', ok: false });
        }
    }
});

app.post('/api/reset-password', async (req, res) => {
    if (req.body.task === 'confirmation') {
        const { userEmail, userName } = req.body;
        const findEmail = await client.db("E-Learning").collection("users").findOne({ email: userEmail });
        const findName = await client.db("E-Learning").collection("users").findOne({ name: userName });
        if (!findEmail || !findName || findEmail.email !== findName.email) {
            return res.status(400).json({ error: 'User not found', ok: false });
        }
        res.status(200).json({ message: 'got the message', ok: true, userEmail: findEmail.email, userName: findName.name });
    }

    if (req.body.task === 'resetPassword') {
        const { userEmail, confirmPassword } = req.body;
        const hashedPassword = await bcrypt.hash(confirmPassword, 10);
        try {
            await client.db("E-Learning").collection("users").updateOne(
                { email: userEmail },
                { $set: { password: hashedPassword } }
            );
            res.status(200).json({ message: 'Password reset successfully', ok: true });
        } catch (error) {
            console.error("Error resetting password:", error);
            res.status(500).json({ error: 'Internal server error', ok: false });
        }
    }
});

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Use $or to check both email and name in a single query for better performance
        const existingUser = await client.db("E-Learning").collection("users").findOne({ $or: [{ email }, { name }] });

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
            res.cookie('token', token, { httpOnly: false, secure: true, sameSite: "Strict", maxAge: 23 * 60 * 60 * 1000 });
            return res.status(200).json({ message: 'Login successful', ok: true, token, user: user.name });
        }
        res.status(401).json({ error: 'Invalid email or password' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check if user already submitted daily tasks
app.get('/api/repeat-check/:user', async (req, res) => {
    try {
        const scoreboardData = await client.db("E-Learning").collection("daily-tasks").find({ userName: req.params.user }).toArray();
        const checkTodayDate = new Date().toISOString().slice(0, 10);
        const findTodayEntry = scoreboardData.find(entry => entry.submissionDate === checkTodayDate);
        if (scoreboardData && findTodayEntry) {
            return res.status(200).json({ message: 'player found', ok: true, user: req.user, data: scoreboardData });
        }
        else {
            return res.status(200).json({ message: 'player not found', ok: false });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error', ok: false });
    }
});

// Get dice roll and questions
app.get('/api/roll-dice', async (req, res) => {
    try {
        const collectTaskData = await client.db("E-Learning").collection("daily-task-data").find().toArray();
        const today = new Date().toISOString().slice(0, 10);

        const todayDoc = collectTaskData.find(d => d.date === today);

        if (todayDoc) {
            // Use today's stored data and return immediately
            rolldicenumber = todayDoc.rolldicenumber || [];
            questions = todayDoc.questions || [];
            return res.status(200).json({ result: rolldicenumber, questions, ok: true });
        } else {
            // No entry for today → clear all previous data and generate fresh data for today
            await client.db("E-Learning").collection("daily-task-data").deleteMany({});
            await client.db("E-Learning").collection("daily-tasks").deleteMany({});

            // Generate new data for today and store it
            rolldicenumber = await rollDice();
            questions = await googleAPI.generateText("generate most tough and tough scientific questions");
            while (questions.length < 10) {
                questions = await googleAPI.generateText("generate most tough and tough scientific questions");
                if (questions.length === 10) {
                    break;
                }
            }
            console.log('Storing new daily task data for today');
            await client.db("E-Learning").collection("daily-task-data").insertOne(
                { date: today, rolldicenumber, questions }
            );
            console.log('New daily task data stored successfully');
            return res.status(200).json({ result: rolldicenumber, questions, ok: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get scoreboard data
app.get('/api/daily-tasks/scoreboard', async (req, res) => {
    try {
        // const scoreboardData = await client.db("E-Learning").collection("daily-tasks").find().toArray();
        // if (scoreboardData.length === 0) {
        //     return res.status(404).json({ message: 'No scoreboard data found' });
        // }
        const getScore = await downloadData('download');
        const scoreboardData = getScore && getScore.data ? getScore.data : [];
        const rankedData = await rankPlayers(scoreboardData);
        res.status(200).json({ scoreData: rankedData, ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/profile/:user', async (req, res) => {
    try {
        const username = req.params.user;
        const userProfileData = await client.db("E-Learning").collection("users").findOne({ name: username }, { projection: { _id: 0, password: 0 } });
        if (!userProfileData) {
            return res.status(404).json({ message: 'User not found', ok: false });
        }
        res.status(200).json({ data: userProfileData, ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', ok: false });
    }
});

app.get('/api/user-privious-score/:user/:date', async (req, res) => {
    try {
        const username = req.params.user;
        const last_score_date = req.params.date;
        const download = await downloadDataByDate('downLoadByDate', last_score_date);
        for (let i=0; i < download.data.length; i++) {
            if (download.data[i].userName === username) {
                return res.status(200).json({ message: 'got the username', ok: true, user: username, data: download.data[i] });
            }
        }
        res.status(404).json({ message: 'Data not found', ok: false, user: username, data: false });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error', ok: false });
    }
});

app.get('/api/user-score/:user', async (req, res) => {
    try {
        const username = req.params.user;
        const userScoreData = await client.db("E-Learning").collection("daily-tasks").find({ userName: username }).toArray();
        if (userScoreData === null || userScoreData.length === 0) {
            const userEmail = await client.db("E-Learning").collection("users").findOne({ name: username }, { projection: { _id: 0, email: 1 } });
            if (!userEmail) {
                return res.status(404).json({ message: 'User not found', ok: false });
            }
            return res.status(200).json({ message: 'No today score found', ok: false, email: userEmail.email });
        }
        const todayDate = new Date().toISOString().slice(0, 10);
        for (let i = 0; i < userScoreData.length; i++) {
            if (userScoreData[i].submissionDate === todayDate) {
                return res.status(200).json({ data: userScoreData[i], ok: true });
            }
        }
        res.status(200).json({ message: 'No score data for today', ok: false, data: { email: userScoreData[0].userEmail } });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', ok: false });
    }
});

app.get('/api/download-score', async (req, res) => {
    // const getsocreboardData = await client.db("E-Learning").collection("daily-tasks").find().toArray();
    console.log('get all scoreboard data');
    const upload = await downloadData('download');
    if(!upload || !upload.data) {
        return res.status(404).json({ message: 'No scoreboard data found', ok: false });
    }
    res.status(200).json({ message: 'Uploaded to S3', ok: true, upload });
});

function convertTimeToSeconds(timeStr) {
    // Convert "0:22" → 22, "1:05" → 65
    const [min, sec] = timeStr.split(':').map(Number);
    return min * 60 + sec;
}

function rankPlayers(players) {
    // First, map to ensure each player has totalInSeconds calculated
    const updatedPlayers = players.map(player => ({
        ...player,
        totalInSeconds: convertTimeToSeconds(player.totalTime),
        totalScore: player.mcqScore + player.numberBowlingScore
    }));

    // Sort players
    const sorted = [...updatedPlayers].sort((a, b) => {
        // 1️⃣ Sort by total score (descending)
        if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore;
        }

        // 2️⃣ If total score is same → sort by time (ascending)
        return a.totalInSeconds - b.totalInSeconds;
    });

    // Optional: Add rank numbers
    return sorted.map((player, index) => ({
        ...player,
        rank: index + 1
    }));
}

// Endpoint to submit daily tasks
app.post('/api/submit/daily-tasks', async (req, res) => {
    const response = req.body;
    const findEmail = await client.db("E-Learning").collection("users").findOne({ name: response.userName });
    if (!findEmail) {
        return res.status(400).json({ error: 'User not found', ok: false });
    }
    response.userEmail = findEmail.email;
    try {
        await client.db("E-Learning").collection("daily-tasks").insertOne(response);
        const getScoreboardData = await client.db("E-Learning").collection("daily-tasks").find().toArray();
        const shortscoreData = await rankPlayers(getScoreboardData);
        await uploadData(shortscoreData, 'upload');
        console.log("Daily tasks submitted successfully");
    } catch (error) {
        console.error("Error submitting daily tasks:", error);
    }
    res.status(200).json({ message: 'Daily tasks submitted successfully', ok: true });
});

// home page route
app.get(/.*/, async (req, res) => {
    // const indexpath = await fetch(process.env.DEPLOY_PAGE_URL, { method: 'GET' });
    // res.send(await indexpath.text());
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

let job = cron.schedule("* * * * * *", async () => {
    if (!SECRET_KEY) {
        SECRET_KEY = await generateSecretKey();
        console.log("Generated new SECRET_KEY");
    }
    job.stop();
    job = cron.schedule("0 0 * * *", async () => {
        SECRET_KEY = await generateSecretKey();
        console.log("Generated new SECRET_KEY");
    });
    console.log("✅ Switched to 24-hour schedule for both dice and questions");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});


const canRunNgrok = (process.env.npm_lifecycle_event === 'prod');
if (canRunNgrok) {
    ngrok.connect({ addr: PORT, authtoken: process.env.NGROK })
        .then(listener => console.log(`Ingress established at: ${listener.url()}`));
}
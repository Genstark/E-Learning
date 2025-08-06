const express = require('express');
const app = express();

// Middleware to parse JSON requests
app.use(express.json());

app.get('/api', (req, res) => {
    const name = req.query.name;
    res.send('Hello World! '+name);
});

app.listen(3000, () => {
    console.log(`Server is running on port http://localhost:3000`);
});
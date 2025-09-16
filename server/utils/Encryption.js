require('dotenv').config();

async function encryptToken(token) {
    const response = await fetch(process.env.ENCRYPTION, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(token),
    });
    const data = await response.json();
    return data.token;
}

async function decryptToken(token) {
    console.log(token)
    const response = await fetch(process.env.ENCRYPTION, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(token)
    });
    const data = await response.json();
    return data.token;
}

module.exports = { encryptToken, decryptToken };
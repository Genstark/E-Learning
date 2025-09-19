require('dotenv').config();

const tokenCache = new Map(); // Simple in-memory cache

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
    const cacheKey = JSON.stringify(token);
    if (tokenCache.has(cacheKey)) {
        return tokenCache.get(cacheKey);
    }
    const response = await fetch(process.env.ENCRYPTION, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(token)
    });
    const data = await response.json();
    tokenCache.set(cacheKey, data.token);
    // Expire cache after 10 minutes
    setTimeout(() => tokenCache.delete(cacheKey), 10 * 60 * 1000);
    return data.token;
}

module.exports = { encryptToken, decryptToken };

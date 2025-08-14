const crypto = require('crypto');
const generateSecretKey = () => {
    return crypto.randomBytes(64).toString('base64');
};
module.exports = { generateSecretKey };
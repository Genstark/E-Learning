require('dotenv').config();
async function uploadData(data, action) {
    console.log(data);
    const response = await fetch(process.env.UPLOADING, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scoreData: data, action }),
    });
    const result = await response.json();
    return result;
}

module.exports = { uploadData };
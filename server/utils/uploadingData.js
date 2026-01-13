require('dotenv').config();
async function uploadData(data, action) {
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

async function downloadData(action) {
    const response = await fetch(process.env.DOWNLOADING, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
    });
    const result = await response.json();
    return result;
}

async function downloadDataByDate(action, datestring) {
    const response = await fetch(process.env.DOWNLOADING, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, datestring }),
    });
    const result = await response.json();
    return result;
}

module.exports = { uploadData, downloadData, downloadDataByDate };
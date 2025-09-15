function encrypt(text) {
    return 'running '+text;
}

function decrypt(text) {
    return text.replace('running ', '');
}

module.exports = { encrypt, decrypt };
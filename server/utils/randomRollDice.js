async function rollDice() {
    const dice = [];
    for (let i = 0; i < 4; i++) {
        dice.push(Math.floor(Math.random() * 6) + 1);
    }
    return dice;
}

module.exports = {
    rollDice
};
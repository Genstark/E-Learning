<!-- eslint-disable vue/multi-word-component-names -->
<!-- BowlingGame.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import Header from '@/components/Header.vue';
// import Footer from '@/components/Footer.vue';
import { evaluate } from 'mathjs';
import { onUnmounted } from 'vue';

onUnmounted(() => {
    console.log('NumberBowling component unmounted');
});

const targetNumbers = ref(
    Array.from({ length: 10 }, (_, i) => ({ value: i + 1, disabled: false }))
);

const dice = ref([]);
const userInput = ref('');
const animatingDice = ref(false);
const message = ref('');

// Timer
const startTime = ref(null);
const elapsedTime = ref(0);
const penaltyTime = ref(0);
let timerInterval = null;

// Penalty countdown
const isPenaltyActive = ref(false);
const penaltyTimeRemaining = ref(0);
let penaltyInterval = null;

// Add a new ref to track if game is stopped
const isStopped = ref(false);
const gameStarted = ref(false);

// Add refs for roll cooldown
const isRollCooldown = ref(false);
const rollCooldownRemaining = ref(0);
let rollCooldownInterval = null;

// 🎳 Best Scoreboard
const bestScores = ref([]);

onMounted(() => {
    const saved = localStorage.getItem("bestScores");
    if (saved) bestScores.value = JSON.parse(saved);
});

const usedTargets = computed(() => targetNumbers.value.filter(n => n.disabled).length);

function rollDice() {
    // ⚠️ If penalty is active, don't allow rolling
    if (isPenaltyActive.value) {
        message.value = `⏳ Wait ${penaltyTimeRemaining.value}s before rolling again!`;
        return;
    }

    // ⚠️ If roll cooldown is active, don't allow rolling
    if (isRollCooldown.value) {
        message.value = `🎲 Wait ${rollCooldownRemaining.value}s before rolling again!`;
        return;
    }

    // 👇 Mark game as started
    gameStarted.value = true;

    // Start timer if first roll OR resume after stop
    if (startTime.value === null) {
        // Calculate offset: current elapsed time minus penalty already applied
        const offset = elapsedTime.value - penaltyTime.value;
        startTime.value = Date.now() - (offset * 1000); // Adjust start time to preserve elapsed time

        timerInterval = setInterval(() => {
            const baseTime = Math.floor((Date.now() - startTime.value) / 1000);
            elapsedTime.value = baseTime + penaltyTime.value;
        }, 100);

        // Clear stopped state
        if (isStopped.value) {
            isStopped.value = false;
            message.value = 'Game resumed!';
            setTimeout(() => {
                if (message.value === 'Game resumed!') {
                    message.value = '';
                }
            }, 2000);
        }
    } else if (usedTargets.value > 0 && usedTargets.value < 10) {
        // 🚨 Apply 2-minute penalty for rolling dice again during game
        // BUT STILL ROLL THE DICE!
        isPenaltyActive.value = true;
        penaltyTimeRemaining.value = 120; // 👈 Changed from 60 to 120 (2 minutes)
        penaltyTime.value += 120; // 👈 Changed from 60 to 120
        message.value = '⚠️ 2-minute penalty applied! Dice rolled.'; // 👈 Updated message

        penaltyInterval = setInterval(() => {
            penaltyTimeRemaining.value--;
            if (penaltyTimeRemaining.value <= 0) {
                clearInterval(penaltyInterval);
                penaltyInterval = null;
                isPenaltyActive.value = false;
                message.value = 'Penalty ended. You can roll dice now.';
                setTimeout(() => {
                    if (message.value === 'Penalty ended. You can roll dice now.') {
                        message.value = '';
                    }
                }, 2000);
            }
        }, 1000);
        
        // ✅ DON'T RETURN - Let dice roll happen below
        // return; // ❌ REMOVE THIS LINE
    }

    // Roll 4 dice
    dice.value = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    animatingDice.value = true;
    setTimeout(() => {
        animatingDice.value = false;
    }, 500);

    // 🎲 Start 1-minute cooldown after rolling dice
    isRollCooldown.value = true;
    rollCooldownRemaining.value = 60;

    if (rollCooldownInterval) {
        clearInterval(rollCooldownInterval);
    }

    rollCooldownInterval = setInterval(() => {
        rollCooldownRemaining.value--;
        if (rollCooldownRemaining.value <= 0) {
            clearInterval(rollCooldownInterval);
            rollCooldownInterval = null;
            isRollCooldown.value = false;
        }
    }, 1000);
}

async function validateExpression() {
    const expr = userInput.value.trim();

    if (!expr) {
        message.value = 'Please enter an expression.';
        return;
    }

    // Reject pure single/multiple digits without any operator/parentheses
    if (/^\d+$/.test(expr)) {
        message.value = 'Please enter an expression using operators (e.g. (6+6)/3). Single numbers alone are not allowed.';
        return;
    }

    let result;
    try {
        if (!/^[\d\s+\-*/().]+$/.test(expr)) {
            throw new Error('Invalid characters used.');
        }
        result = evaluate(expr);
        if (typeof result !== 'number' || !isFinite(result)) {
            throw new Error('Invalid result.');
        }
        // Normalize small floating point rounding errors
        if (Math.abs(result - Math.round(result)) < 1e-9) result = Math.round(result);
    } catch (err) {
        message.value = 'Invalid expression.';
        return;
    }

    const matchedTarget = targetNumbers.value.find(n => !n.disabled && n.value === result);
    if (!matchedTarget) {
        message.value = 'Result does not match any active number.';
        return;
    }

    const usedNumbers = expr.match(/\d+/g)?.map(Number) || [];
    const diceCopy = [...dice.value];
    for (const num of usedNumbers) {
        const i = diceCopy.indexOf(num);
        if (i === -1) {
            message.value = 'Used number not on dice or reused.';
            return;
        }
        diceCopy.splice(i, 1);
    }

    matchedTarget.disabled = true;
    message.value = `Great! You cleared ${result}.`;
    userInput.value = '';

    // 🎉 Game finished
    if (usedTargets.value === 10 && timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        if (penaltyInterval) {
            clearInterval(penaltyInterval);
            penaltyInterval = null;
        }

        const hours = String(Math.floor(elapsedTime.value / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((elapsedTime.value % 3600) / 60)).padStart(2, '0');
        const seconds = String(elapsedTime.value % 60).padStart(2, '0');
        const formattedTime = `${hours}:${minutes}:${seconds}`;

        // Save Best Score
        bestScores.value.push({
            time: elapsedTime.value,
            formatted: formattedTime,
            date: new Date().toLocaleString()
        });
        bestScores.value.sort((a, b) => a.time - b.time);
        bestScores.value = bestScores.value.slice(0, 5);
        localStorage.setItem("bestScores", JSON.stringify(bestScores.value));
        alert(`🎉 Game finished! Time: ${formattedTime}`);
    }
}

function resetGame() {
    // ⚠️ Check if game needs to be stopped first
    if (startTime.value !== null && !isStopped.value) {
        message.value = '⚠️ Please click "Stop" button first before resetting the game!';
        return;
    }

    const isGameActive = startTime.value !== null && usedTargets.value > 0 && usedTargets.value < 10;

    if (isGameActive && !isStopped.value) {
        // 🚨 Apply penalty countdown for reset during game
        isPenaltyActive.value = true;
        penaltyTimeRemaining.value = 60;
        penaltyTime.value += 60;
        message.value = '⚠️ 1-minute penalty applied for reset!';

        if (penaltyInterval) {
            clearInterval(penaltyInterval);
        }

        penaltyInterval = setInterval(() => {
            penaltyTimeRemaining.value--;
            if (penaltyTimeRemaining.value <= 0) {
                clearInterval(penaltyInterval);
                penaltyInterval = null;
                isPenaltyActive.value = false;
                message.value = 'Penalty ended. You can now roll dice.';
                setTimeout(() => {
                    if (message.value === 'Penalty ended. You can now roll dice.') {
                        message.value = '';
                    }
                }, 2000);
            }
        }, 1000);
        return;
    }

    // Reset everything
    targetNumbers.value = Array.from({ length: 10 }, (_, i) => ({
        value: i + 1,
        disabled: false
    }));
    dice.value = [];
    userInput.value = '';
    message.value = 'Game reset successfully!';
    animatingDice.value = false;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (penaltyInterval) {
        clearInterval(penaltyInterval);
        penaltyInterval = null;
    }
    if (rollCooldownInterval) {
        clearInterval(rollCooldownInterval);
        rollCooldownInterval = null;
    }

    startTime.value = null;
    elapsedTime.value = 0;
    penaltyTime.value = 0;
    isPenaltyActive.value = false;
    penaltyTimeRemaining.value = 0;
    isRollCooldown.value = false;
    rollCooldownRemaining.value = 0;
    isStopped.value = false;
    gameStarted.value = false; // 👈 YE LINE ADD KARO

    localStorage.setItem("bestScores", JSON.stringify(bestScores.value));

    setTimeout(() => {
        if (message.value === 'Game reset successfully!') {
            message.value = '';
        }
    }, 2000);
}

function stop() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (penaltyInterval) {
        clearInterval(penaltyInterval);
        penaltyInterval = null;
    }
    if (rollCooldownInterval) {
        clearInterval(rollCooldownInterval);
        rollCooldownInterval = null;
    }
    isPenaltyActive.value = false;
    penaltyTimeRemaining.value = 0;
    isRollCooldown.value = false;
    rollCooldownRemaining.value = 0;
    startTime.value = null;
    isStopped.value = true; // Mark as stopped
    message.value = 'Game stopped. Click "Roll Dice" to resume or "Reset" to start over.';
}
</script>

<template>
    <Header />
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div class="w-full max-w-7xl">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <!-- Left Side: Game -->
                <div class="bg-white rounded-xl shadow-2xl p-6 transition-all duration-300 flex flex-col items-center">
                    <h2 class="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
                        🎲 Number Bowling
                    </h2>

                    <!-- Dice -->
                    <div class="flex justify-center space-x-4 mb-6">
                        <div v-for="(d, i) in dice" :key="i" :class="{ 'animate-dice-roll': animatingDice }"
                            class="w-16 h-16 rounded-xl bg-purple-100 text-purple-800 border-2 border-purple-500 text-3xl font-bold flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                            {{ d }}
                        </div>
                    </div>

                    <!-- Targets -->
                    <div class="grid grid-cols-5 gap-3 mb-6">
                        <div v-for="num in targetNumbers" :key="num.value" :class="[
                            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                            num.disabled
                                ? 'bg-gray-300 text-gray-500 line-through scale-95 animate-cleared-target'
                                : 'bg-purple-100 text-purple-800 border border-purple-400 hover:bg-purple-200 hover:scale-105'
                        ]">
                            {{ num.value }}
                        </div>
                    </div>

                    <!-- Input -->
                    <input type="text" v-model="userInput" placeholder="e.g. (6+6)/3" @keyup.enter="validateExpression"
                        class="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-purple-400 text-center text-base mb-4 shadow-sm" />

                    <!-- Buttons -->
                    <div class="flex space-x-3 mb-3">
                        <button @click="validateExpression"
                            class="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-md shadow">
                            ✅ Submit
                        </button>

                        <button @click="rollDice" :disabled="isPenaltyActive || isRollCooldown || isStopped" :class="[
                            'flex-1 font-medium py-2 rounded-md shadow transition-all',
                            (isPenaltyActive || isRollCooldown || isStopped)
                                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                        ]">
                            🎲 Roll Dice
                        </button>

                        <button @click="resetGame" :disabled="!isStopped && gameStarted" :class="[
                            'flex-1 font-medium py-2 rounded-md shadow transition-all',
                            (!isStopped && gameStarted)
                                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                        ]">
                            🔄 Reset
                        </button>

                        <button @click="stop" :disabled="!gameStarted || isStopped" :class="[
                            'flex-1 font-medium py-2 rounded-md shadow transition-all',
                            (!gameStarted || isStopped)
                                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                        ]">
                            ⏹ Stop
                        </button>
                    </div>

                    <!-- Message -->
                    <p class="text-sm text-gray-600 italic mb-2 min-h-[20px]">{{ message }}</p>

                    <!-- Penalty Countdown Display -->
                    <div v-if="isPenaltyActive"
                        class="mb-3 p-3 bg-red-50 border-2 border-red-300 rounded-lg w-full text-center animate-pulse">
                        <p class="text-red-700 font-bold text-lg">
                            ⏳ Penalty Active: {{ penaltyTimeRemaining }}s remaining
                        </p>
                        <p class="text-red-600 text-xs mt-1">Cannot roll dice or reset until penalty ends</p>
                    </div>

                    <!-- Timer -->
                    <div class="flex flex-col text-sm text-gray-700 text-center">
                        <p>
                            🕒 Time:
                            {{ String(Math.floor(elapsedTime / 3600)).padStart(2, '0') }}:
                            {{ String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, '0') }}:
                            {{ String(elapsedTime % 60).padStart(2, '0') }}
                        </p>
                        <!-- <p v-if="penaltyTime > 0" class="text-red-600 font-bold">
                            ⏰ Total Penalty: +{{ Math.floor(penaltyTime / 60) }}:{{ String(penaltyTime % 60).padStart(2, '0') }}
                        </p> -->
                        <p>✅ Cleared: {{ usedTargets }} / 10</p>
                    </div>
                </div>

                <!-- Right Side: Scoreboard -->
                <div class="bg-white shadow-xl rounded-lg p-6">
                    <h3 class="text-xl font-bold text-indigo-700 mb-4">🏆 Best Scores</h3>
                    <div class="space-y-3 max-h-96 overflow-y-auto">
                        <div v-for="(score, i) in bestScores" :key="i"
                            class="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg border">
                            <span class="font-medium text-lg">#{{ i + 1 }}</span>
                            <span class="text-lg font-semibold text-indigo-600">{{ score.formatted }}</span>
                            <span class="text-xs text-gray-500">{{ score.date }}</span>
                        </div>
                        <div v-if="bestScores.length === 0" class="text-center text-gray-500 py-8">
                            <p class="text-lg">No scores yet!</p>
                            <p class="text-sm">Complete your first game to see your score here.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- rules for number bowling -->
    <div
        class="bg-gradient-to-br from-purple-50 to-indigo-100 shadow-2xl rounded-2xl p-8 mt-8 border border-indigo-200">
        <div class="flex items-center mb-4 gap-2">
            <span class="text-2xl">📖</span>
            <h3 class="text-2xl font-extrabold text-indigo-800 tracking-tight">How to Play <span
                    class="text-purple-600">Number Bowling</span></h3>
        </div>
        <ol class="list-decimal list-inside space-y-3 text-gray-800 text-base leading-relaxed pl-2">
            <li>
                <span class="font-semibold text-purple-700">Roll Dice: </span>
                <span>Click <span
                        class="inline-block bg-purple-200 text-purple-800 px-2 py-0.5 rounded font-mono text-sm">
                        🎲 Roll Dice</span> to roll four dice. Use these numbers to form expressions.</span>
            </li>
            <li>
                <span class="font-semibold text-purple-700">Form Expressions: </span>
                <span>Combine the dice numbers with <span class="font-mono bg-gray-100 px-1 rounded">+</span>
                    <span class="font-mono bg-gray-100 px-1 rounded">-</span>
                    <span class="font-mono bg-gray-100 px-1 rounded">*</span>
                    <span class="font-mono bg-gray-100 px-1 rounded">/</span>
                    <span class="font-mono bg-gray-100 px-1 rounded">()</span> and parentheses to match a
                    <span class="font-bold text-indigo-700">target number (1-10)</span>.</span>
            </li>
            <li>
                <span class="font-semibold text-purple-700">Submit: </span>
                <span>Enter your expression and click
                    <span class="inline-block bg-green-200 text-green-800 px-2 py-0.5 rounded font-mono text-sm">✅
                        Submit</span> or press <span class="font-mono bg-gray-100 px-1 rounded">Enter</span>.</span>
            </li>
            <li>
                <span class="font-semibold text-purple-700">Clear Targets: </span>
                <span>If correct, the matching target number is cleared. Each die number can be used only once per
                    expression.</span>
            </li>
            <li>
                <span class="font-semibold text-purple-700">Penalties: </span>
                <span>Rolling dice again or resetting mid-game adds a <span class="text-red-600 font-bold">+2 min
                        penalty</span> and you must <span class="text-red-600 font-bold">wait 120 seconds</span> before
                    you can roll dice again.</span>
            </li>
            <li>
                <span class="font-semibold text-purple-700">Finish: </span>
                <span>Clear all numbers 1-10 to finish. Your best times appear on the <span
                        class="font-bold text-indigo-700">leaderboard</span>!</span>
            </li>
            <li>
                <span class="font-semibold text-purple-700">Controls: </span>
                <span>Use the <span
                        class="inline-block bg-red-200 text-red-800 px-2 py-0.5 rounded font-mono text-sm">🔄
                        Reset</span> button to restart anytime. The
                    <span class="inline-block bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-mono text-sm">⏹
                        Stop</span> button pauses the game.</span>
            </li>
        </ol>
        <div class="mt-6 flex items-center gap-2 text-indigo-700 font-semibold text-lg">
            <span class="text-xl">💡</span>
            <span>Tip: Use all dice creatively. Avoid penalties for fastest time!</span>
        </div>
    </div>
    <!-- <Footer /> -->
</template>

<style scoped></style>
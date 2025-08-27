<!-- eslint-disable vue/multi-word-component-names -->
<!-- BowlingGame.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import { evaluate } from 'mathjs';

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
const penaltyTime = ref(0); // ✅ separate penalty tracker
let timerInterval = null;

// Reset penalty countdown
const isPenaltyActive = ref(false);
const penaltyTimeRemaining = ref(0);
let penaltyInterval = null;

// 🎳 Best Scoreboard
const bestScores = ref([]);

onMounted(() => {
    const saved = localStorage.getItem("bestScores");
    if (saved) bestScores.value = JSON.parse(saved);
});

const usedTargets = computed(() => targetNumbers.value.filter(n => n.disabled).length);

function rollDice() {
    // Start timer if first roll
    if (startTime.value === null) {
        startTime.value = Date.now();
        timerInterval = setInterval(() => {
            elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000) + penaltyTime.value;
        }, 1000);
    }

    // Apply penalty if game is ongoing
    if (startTime.value !== null && usedTargets.value > 0 && usedTargets.value < 10) {
        penaltyTime.value += 60; // ✅ add 1 min penalty
        message.value = '⚠️ 1-minute penalty added for rolling dice again!';
        setTimeout(() => {
            if (message.value === '⚠️ 1-minute penalty added for rolling dice again!') {
                message.value = '';
            }
        }, 1000);
    }

    // Roll 4 dice
    dice.value = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    animatingDice.value = true;
    setTimeout(() => {
        animatingDice.value = false;
    }, 500);
}

async function validateExpression() {
    let result;
    try {
        if (!/^[\d\s+\-*/().]+$/.test(userInput.value)) {
            throw new Error('Invalid characters used.');
        }
        result = evaluate(userInput.value);
        // result = Math.round(result * 1000) / 1000;
    } catch (err) {
        message.value = 'Invalid expression.';
        return;
    }

    const matchedTarget = targetNumbers.value.find(n => !n.disabled && n.value === result);
    if (!matchedTarget) {
        message.value = 'Result does not match any active number.';
        return;
    }

    const usedNumbers = userInput.value.match(/\d+/g)?.map(Number) || [];
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
    const isGameActive = startTime.value !== null && usedTargets.value > 0 && usedTargets.value < 10;

    if (isGameActive) {
        // Apply 1-minute penalty before reset
        isPenaltyActive.value = true;
        penaltyTimeRemaining.value = 60;

        message.value = '⚠️ 1-minute penalty applied for reset!';

        penaltyInterval = setInterval(() => {
            penaltyTimeRemaining.value--;
            if (penaltyTimeRemaining.value <= 0) {
                clearInterval(penaltyInterval);
                isPenaltyActive.value = false;
                message.value = 'Penalty ended. You can now roll dice.';
            }
        }, 1000);

        penaltyTime.value += 60; // ✅ add penalty to total time
        return;
    }

    // Reset everything
    targetNumbers.value = Array.from({ length: 10 }, (_, i) => ({
        value: i + 1,
        disabled: false
    }));
    dice.value = [];
    userInput.value = '';
    message.value = '';
    animatingDice.value = false;

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (penaltyInterval) {
        clearInterval(penaltyInterval);
        penaltyInterval = null;
    }
    startTime.value = null;
    elapsedTime.value = 0;
    penaltyTime.value = 0;
    isPenaltyActive.value = false;
    penaltyTimeRemaining.value = 0;
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
                        <button @click="rollDice"
                            class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-md shadow">
                            🎲 Roll Dice
                        </button>
                        <button @click="resetGame"
                            class="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-md shadow">
                            🔄 Reset
                        </button>
                    </div>

                    <!-- Message -->
                    <p class="text-sm text-gray-600 italic mb-2">{{ message }}</p>

                    <!-- Timer -->
                    <div class="flex flex-col text-sm text-gray-700 text-center">
                        <p>
                            🕒 Time:
                            {{ String(Math.floor(elapsedTime / 3600)).padStart(2, '0') }}:
                            {{ String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, '0') }}:
                            {{ String(elapsedTime % 60).padStart(2, '0') }}
                        </p>
                        <p v-if="penaltyTime > 0" class="text-red-600 font-bold">
                            ⏰ Penalty Time: +{{ Math.floor(penaltyTime / 60) }}:{{ String(penaltyTime % 60).padStart(2, '0') }}
                        </p>
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
</template>

<style scoped>
</style>
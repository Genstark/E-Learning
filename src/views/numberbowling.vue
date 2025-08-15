<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed } from 'vue';
import Header from '@/components/Header.vue';

const targetNumbers = ref(
    Array.from({ length: 10 }, (_, i) => ({ value: i + 1, disabled: false }))
);

const dice = ref([]);
const userInput = ref('');
const animatingDice = ref(false);
const message = ref('');

const startTime = ref(null);
const elapsedTime = ref(0);
let timerInterval = null;

const usedTargets = computed(() =>
    targetNumbers.value.filter(n => n.disabled).length
);

function rollDice() {
    dice.value = Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 6) + 1
    );
    message.value = '';
    userInput.value = '';

    animatingDice.value = true;
    // Remove animation class after a short delay
    setTimeout(() => {
        animatingDice.value = false;
    }, 500); // Match this duration to the CSS animation duration

    // Start the timer if it's not already started
    if (!startTime.value) {
        startTime.value = Date.now();
        timerInterval = setInterval(() => {
            elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
        }, 1000);
    }
}

async function validateExpression() {
    let result;
    try {
        if (!/^[\d\s+\-*/().]+$/.test(userInput.value)) {
            throw new Error('Invalid characters used.');
        }

        result = eval(userInput.value);
        result = Math.round(result * 1000) / 1000;
    } catch (err) {
        message.value = 'Invalid expression.';
        return;
    }

    const matchedTarget = targetNumbers.value.find(
        n => !n.disabled && n.value === result
    );

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

    // Stop timer & send result if all targets are cleared
    if (usedTargets.value === 10 && timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;

        // Format elapsed time as HH:MM:SS
        const hours = String(Math.floor(elapsedTime.value / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((elapsedTime.value % 3600) / 60)).padStart(2, '0');
        const seconds = String(elapsedTime.value % 60).padStart(2, '0');
        const formattedTime = `${hours}:${minutes}:${seconds}`;

        const response = await fetch('http://localhost:3000/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                timeTakenSeconds: elapsedTime.value,
                timeTakenFormatted: formattedTime,
                clearedTargets: usedTargets.value
            })
        });

        const data = await response.json();
        if (data.ok) {
            alert(`Game submitted successfully! Time: ${formattedTime}`);
        } else {
            alert(`Failed to submit game: ${data.message || 'Unknown error'}`);
        }
    }
}



function resetGame() {
    targetNumbers.value = Array.from({ length: 10 }, (_, i) => ({
        value: i + 1,
        disabled: false
    }));
    dice.value = [];
    userInput.value = '';
    message.value = '';
    animatingDice.value = false;

    // Reset timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    startTime.value = null;
    elapsedTime.value = 0;
}

</script>

<template>
    <Header />
    <!-- Page Centering -->
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <!-- Game Box -->
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md transition-all duration-300">
            <h2 class="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
                🎲 Number Bowling
            </h2>

            <!-- Dice -->
            <div class="flex justify-between mb-6">
                <div v-for="(d, i) in dice" :key="i" :class="{'animate-dice-roll': animatingDice}"
                    class="w-16 h-16 rounded-xl bg-purple-100 text-purple-800 border-2 border-purple-500 text-3xl font-bold flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                    {{ d }} 
                </div>
            </div>

            <!-- Target Numbers -->
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
                    class="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-md shadow transition duration-150 ease-in-out">
                    ✅ Submit
                </button>
                <button @click="rollDice"
                    class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-md shadow transition duration-150 ease-in-out">
                    🎲 Roll Dice
                </button>
                <button @click="resetGame"
                    class="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-md shadow transition duration-150 ease-in-out">
                    🔄 Reset
                </button>
            </div>

            <!-- Message -->
            <p class="text-sm text-gray-600 italic mb-2">{{ message }}</p>

            <!-- Timer & Progress -->
            <div class="flex justify-between text-sm text-gray-700">
                <p>🕒 Time Taken: {{ Math.floor(elapsedTime / 60) }}:{{ String(elapsedTime % 60).padStart(2, '0') }}</p>
                <p>✅ Cleared: {{ usedTargets }} / 10</p>
            </div>
        </div>
    </div>
</template>

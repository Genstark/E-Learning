<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed } from 'vue';

const targetNumbers = ref(
    Array.from({ length: 10 }, (_, i) => ({ value: i + 1, disabled: false }))
);

const dice = ref([]);
const userInput = ref('');
const message = ref('');
const usedTargets = computed(() =>
    targetNumbers.value.filter(n => n.disabled).length
);

function rollDice() {
    dice.value = Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 6) + 1
    );
    message.value = '';
    userInput.value = '';
}

function validateExpression() {
    let result;
    try {
        // Validate only allowed characters
        if (!/^[\d\s+\-*/().]+$/.test(userInput.value)) {
            throw new Error('Invalid characters used.');
        }

        // Convert expression to result
        result = eval(userInput.value);

        // Round if needed due to division
        result = Math.round(result * 1000) / 1000;
    } catch (err) {
        message.value = 'Invalid expression.';
        return;
    }

    // Check if result matches any remaining number
    const matchedTarget = targetNumbers.value.find(
        n => !n.disabled && n.value === result
    );

    if (!matchedTarget) {
        message.value = 'Result does not match any active number.';
        return;
    }

    // Extract numbers used
    const usedNumbers = userInput.value.match(/\d+/g)?.map(Number) || [];

    const diceCopy = [...dice.value];
    for (const num of usedNumbers) {
        const i = diceCopy.indexOf(num);
        if (i === -1) {
            message.value = 'Used number not on dice or reused.';
            return;
        }
        diceCopy.splice(i, 1); // Remove used number
    }

    // Success!
    matchedTarget.disabled = true;
    message.value = `Great! You cleared ${result}.`;
    userInput.value = '';
}

function resetGame() {
    targetNumbers.value = Array.from({ length: 10 }, (_, i) => ({
        value: i + 1,
        disabled: false
    }));
    dice.value = [];
    userInput.value = '';
    message.value = '';
}
</script>

<template>
    <div class="min-h-screen bg-gray-100 p-6 flex flex-col items-center space-y-6">
        <h1 class="text-3xl font-bold text-pink-600">🎲 Number Bowling Puzzle</h1>

        <!-- Target Numbers -->
        <div class="grid grid-cols-5 gap-3">
            <div v-for="num in targetNumbers" :key="num.value" :class="[
                'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold',
                num.disabled ? 'bg-gray-300 text-gray-500' : 'bg-white border border-pink-500 text-pink-700'
            ]">
                {{ num.value }}
            </div>
        </div>

        <!-- Dice -->
        <div class="flex space-x-4">
            <div v-for="(d, i) in dice" :key="i"
                class="w-12 h-12 rounded-lg bg-white border border-gray-400 text-center text-xl font-bold flex items-center justify-center shadow">
                {{ d }}
            </div>
        </div>

        <!-- Expression Input -->
        <input type="text" v-model="userInput" placeholder="e.g. 2 + 3 * 1 + 1"
            class="mt-4 px-4 py-2 rounded border w-80 text-center" />

        <div class="flex space-x-4 mt-2">
            <button @click="validateExpression" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                Submit
            </button>
            <button @click="rollDice" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                Roll Dice
            </button>
            <button @click="resetGame" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
                Reset
            </button>
        </div>

        <p class="text-md mt-2 text-gray-700">{{ message }}</p>

        <p class="mt-4 text-sm text-gray-500">
            Cleared: {{ usedTargets }} / 10
        </p>
    </div>
</template>

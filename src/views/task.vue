<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed } from 'vue';
import Header from '@/components/Header.vue';
// import { useRouter } from 'vue-router';

// const router = useRouter();

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
const totalGameTime = ref(0);



const usedTargets = computed(() => targetNumbers.value.filter(n => n.disabled).length);
const bowlingComplete = computed(() => usedTargets.value === 10);

// MCQ Questions functionality
const questions = ref([
    {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2
    },
    {
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: 1
    },
    {
        question: "What is 2 + 2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1
    },
    {
        question: "Who wrote 'To Kill a Mockingbird'?",
        options: ["Harper Lee", "Mark Twain", "Ernest Hemingway", "F. Scott Fitzgerald"],
        correctAnswer: 0
    },
    {
        question: "What is the largest mammal?",
        options: ["Elephant", "Blue Whale", "Giraffe", "Great White Shark"],
        correctAnswer: 1
    },
    {
        question: "What is the boiling point of water?",
        options: ["90°C", "100°C", "110°C", "120°C"],
        correctAnswer: 1
    },
    {
        question: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"],
        correctAnswer: 2
    },
    {
        question: "What is the chemical symbol for gold?",
        options: ["Au", "Ag", "Pb", "Fe"],
        correctAnswer: 0
    },
    {
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        correctAnswer: 3
    }
]);

const currentQuestionIndex = ref(0);
const selectedAnswer = ref(null);
const score = ref(0);
const answerFeedback = ref(null);

const currentQuestion = computed(() => {
    return questions.value[currentQuestionIndex.value];
});

function submitAnswer() {
    if (selectedAnswer.value === null) return;

    const isCorrect = selectedAnswer.value === currentQuestion.value.correctAnswer;

    if (isCorrect) {
        score.value++;
        answerFeedback.value = {
            correct: true,
            message: "Correct! Well done!"
        };
    } else {
        answerFeedback.value = {
            correct: false,
            message: `Incorrect. The correct answer is: ${currentQuestion.value.options[currentQuestion.value.correctAnswer]}`
        };
    }

    setTimeout(() => {
        if (currentQuestionIndex.value < questions.value.length - 1) {
            currentQuestionIndex.value++;
            selectedAnswer.value = null;
            answerFeedback.value = null;
        } else {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            totalGameTime.value = elapsedTime.value; // Store the total time
            alert(`Quiz completed! Your score: ${score.value}/${questions.value.length}`);
        }
    }, 1000);
}

function goToELibrary() {
    // router.push('https://engage-dev1.comprodls.com/', '_blank');
    window.open('https://engage-dev1.comprodls.com/', '_blank');
}

function rollDice() {
    dice.value = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    message.value = '';
    userInput.value = '';

    animatingDice.value = true;
    setTimeout(() => {
        animatingDice.value = false;
    }, 500);
}

function startGame() {

    if (!startTime.value) {
        startTime.value = Date.now();
        timerInterval = setInterval(() => {
            elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
        }, 1000);
    }
    rollDice(); // Roll the dice immediately when the game starts
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

    if (usedTargets.value === 10 && timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        // Number bowling is finished, now the MCQ section will be enabled
    }

}

</script>

<template>
    <div>
        <Header />
        <div class="min-h-screen bg-gray-100 p-4">
            <div class="max-w-6xl mx-auto grid grid-cols-1 gap-8">

                <!-- Number Bowling Container -->
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
                        :disabled="bowlingComplete"
                        class="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-purple-400 text-center text-base mb-4 shadow-sm disabled:opacity-50" />

                    <!-- Submit Button -->
                    <div class="flex space-x-4">
                        <button @click="startGame" :disabled="bowlingComplete"
                            class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow">
                            ▶️ Start
                        </button>
                    </div>


                    <!-- Message -->
                    <p class="text-sm text-gray-600 italic mb-2">{{ message }}</p>
                </div>

                <!-- Question Answer Container -->
                <div class="bg-white rounded-xl shadow-2xl p-6 transition-all duration-300 flex flex-col items-center relative"
                    :class="{ 'opacity-50': !bowlingComplete }">
                    <div v-if="!bowlingComplete"
                        class="absolute inset-0 bg-gray-100 bg-opacity-75 rounded-xl flex items-center justify-center z-10">
                        <div class="text-center p-4">
                            <div class="text-4xl mb-2">🔒</div>
                            <h3 class="text-lg font-semibold text-gray-700 mb-2">MCQ Questions Locked</h3>
                            <p class="text-gray-600">Complete the bowling game to unlock MCQ questions</p>
                            <p class="text-sm text-gray-500 mt-2">Progress: {{ usedTargets }}/10 numbers cleared</p>
                        </div>
                    </div>

                    <h2 class="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
                        ❓ MCQ Questions
                    </h2>

                    <!-- Question Display -->
                    <div v-if="currentQuestion" class="w-full mb-6">
                        <div class="bg-gray-50 rounded-lg p-4 mb-4">
                            <h3 class="text-lg font-semibold text-gray-800 mb-3">
                                Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}
                            </h3>
                            <p class="text-gray-700 mb-4">{{ currentQuestion.question }}</p>

                            <!-- Options -->
                            <div class="space-y-2">
                                <div v-for="(option, index) in currentQuestion.options" :key="index"
                                    class="flex items-center">
                                    <input type="radio" :id="'option' + index" :name="'question' + currentQuestionIndex"
                                        :value="index" v-model="selectedAnswer" :disabled="!bowlingComplete"
                                        class="mr-3 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50">
                                    <label :for="'option' + index" :class="[
                                        bowlingComplete ? 'text-gray-700 cursor-pointer hover:text-indigo-600' : 'text-gray-400 cursor-not-allowed'
                                    ]">
                                        {{ option }}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Submit Answer Button -->
                        <button @click="submitAnswer" :disabled="selectedAnswer === null"
                            class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md shadow transition-colors">
                            Submit Answer
                        </button>

                        <!-- Feedback -->
                        <div v-if="answerFeedback" class="mt-4 p-3 rounded-md"
                            :class="answerFeedback.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                            {{ answerFeedback.message }}
                        </div>
                    </div>
                    <!-- Timer and Bowling Progress -->
                    <div class="w-full flex justify-between text-sm text-gray-700 mt-4">
                        <p>🕒 Time: {{ Math.floor(elapsedTime / 60) }}:{{ String(elapsedTime % 60).padStart(2, '0') }}
                        </p>
                        <p>✅ Cleared: {{ usedTargets }} / 10</p>
                    </div>


                    <!-- Navigation to E-Library -->
                    <div class="w-full mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 class="text-lg font-semibold text-blue-800 mb-2">Need Help?</h3>
                        <p class="text-blue-700 mb-4">Find answers in our e-library</p>
                        <!-- E-Library Button -->
                        <button @click="goToELibrary" :disabled="!bowlingComplete" :class="[
                            bowlingComplete
                                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                                : 'bg-gray-400 cursor-not-allowed'
                        ]"
                            class="w-full text-white font-medium py-3 px-4 rounded-md shadow flex items-center justify-center gap-2 transition-colors">
                            <span>Go to E-Library</span>
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14">
                                </path>
                            </svg>
                        </button>
                    </div>

                    <!-- Score and Total Time -->
                    <div class="w-full mt-4 text-center">
                        <p class="text-sm text-gray-600">
                            Score: {{ score }} / {{ questions.length }}
                        </p>
                        <p v-if="totalGameTime > 0" class="text-sm font-semibold text-indigo-700 mt-2">
                            Total Game Time: {{ Math.floor(totalGameTime / 60) }}:{{ String(totalGameTime %
                            60).padStart(2, '0') }}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<style scoped></style>

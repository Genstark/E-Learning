<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed, watch, onUnmounted, onBeforeMount } from 'vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';
import { evaluate } from "mathjs";
import { useRouter } from 'vue-router';

onUnmounted(() => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
});

const pending = ref(true);

onBeforeMount(async () => {
    const user = localStorage.getItem('user');
    const response = await fetch(`${process.env.VUE_APP_URL}/repeat-check/${user}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });
    const data = await response.json();
    console.log(data);
    if (data.ok) {
        console.warn('Already Done');
        // router.push({ name: 'user-home', params: { id: localStorage.getItem('user') } });
        pending.value = true;
    }
    else {
        pending.value = true;
        console.log('Not Done Yet');
    }
});

const router = useRouter();

const targetNumbers = ref(
    Array.from({ length: 10 }, (_, i) => ({ value: i + 1, disabled: false }))
);

const dice = ref([]);
const userInput = ref('');
const animatingDice = ref(false);
const message = ref('');
const loading = ref(false);

const startTime = ref(null);
const elapsedTime = ref(0);
let timerInterval = null;
const totalGameTime = ref(0);
const gameFinished = ref(false);
const gameStarted = ref(false);

const usedTargets = computed(() => targetNumbers.value.filter(n => n.disabled).length);
const bowlingComplete = computed(() => usedTargets.value === 10);
const bothGamesComplete = computed(() => bowlingComplete.value && currentQuestionIndex.value === questions.value.length - 1);

watch(elapsedTime, (newVal) => {
    if (!gameFinished.value) {
        totalGameTime.value = newVal;
    }
});

// MCQ Questions functionality - Default questions
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
    }
]);

const currentQuestionIndex = ref(0);
const selectedAnswer = ref(null);
const score = ref(0);
const answerFeedback = ref(null);
const totalSolvedNumber = ref(0);

// Safe computed properties
const currentQuestion = computed(() => {
    if (Array.isArray(questions.value) && questions.value[currentQuestionIndex.value]) {
        console.log('Current Question:', questions.value[currentQuestionIndex.value]);
        return questions.value[currentQuestionIndex.value];
    }
    return null;
});

const questionsCount = computed(() => {
    return Array.isArray(questions.value) ? questions.value.length : 0;
});

const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
};

// Enhanced startGame function with detailed logging
async function startGame() {
    if (loading.value) return; // Prevent multiple calls

    loading.value = true;
    message.value = 'Loading game data...';

    // Timer start karo
    if (!startTime.value) {
        startTime.value = Date.now();
        timerInterval = setInterval(() => {
            elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
        }, 1000);
    }
    gameStarted.value = true;

    // API se data fetch karo
    try {
        console.log(`🔄 Calling API: ${process.env.VUE_APP_URL}/roll-dice`);
        const response = await fetch(`${process.env.VUE_APP_URL}/roll-dice`);

        console.log('📊 Response Status:', response.status);
        console.log('📊 Response OK:', response.ok);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📦 Full API Response:', data);

        // Dice handle karo
        if (data && data.result && Array.isArray(data.result)) {
            dice.value = [...data.result];
            message.value = 'API data loaded - Dice updated';
        } else {
            dice.value = [1, 2, 3, 4];
            message.value = 'Using default dice';
        }

        // Questions handle karo
        if (data && data.questions) {
            console.log('📦 API Questions:', data.questions);
            let parsedQuestions = null;
            // Agar string hai toh parse karo
            if (typeof data.questions === 'string') {
                try {
                    const parsed = JSON.parse(data.questions);
                    // Agar parsed object mein questions property hai toh use karo
                    if (Array.isArray(parsed.questions)) {
                        parsedQuestions = parsed.questions;
                    } else if (Array.isArray(parsed)) {
                        parsedQuestions = parsed;
                    }
                } catch (parseError) {
                    console.error('❌ Failed to parse questions string:', parseError);
                }
            } else if (Array.isArray(data.questions)) {
                parsedQuestions = data.questions;
            }

            if (parsedQuestions && Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
                questions.value = [...parsedQuestions];
                currentQuestionIndex.value = 0;
                selectedAnswer.value = null;
                answerFeedback.value = null;
                score.value = 0;
                message.value = `Questions loaded: ${questions.value.length} questions`; // temp
            } else {
                message.value = 'Questions parsing failed - using defaults';
            }
        } else {
            message.value = 'No questions from API - using defaults';
        }
    } catch (error) {
        console.error('🚨 API Error:', error);
        dice.value = [1, 2, 3, 4];
        message.value = `API Error: ${error.message}`;
    } finally {
        loading.value = false;
    }
}

async function submitAnswer() {
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
        if (currentQuestionIndex.value < questionsCount.value - 1) {
            currentQuestionIndex.value++;
            selectedAnswer.value = null;
            answerFeedback.value = null;
        } else {
            if (bothGamesComplete.value && timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }

            totalGameTime.value = elapsedTime.value;
            gameFinished.value = true;

            alert(`Quiz completed! Your score: ${score.value}/${questionsCount.value}\nNumber of questions solved: ${totalSolvedNumber.value}\nTotal time: ${formatTime(totalGameTime.value)}`);
        }
    }, 1000);

    // send to server
    if (bothGamesComplete.value) {
        try {
            const response = await fetch(`${process.env.VUE_APP_URL}/submit/daily-tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mcqScore: Number(score.value),
                    numberBowlingScore: Number(totalSolvedNumber.value),
                    totalScore: Number(score.value + totalSolvedNumber.value),
                    totalTime: formatTime(totalGameTime.value),
                    userName: localStorage.getItem('user'),
                    submissionDate: new Date().toISOString().slice(0, 10),
                })
            });

            const data = await response.json();
            if (data.ok) {
                alert('Daily tasks submitted successfully!');
                router.push({ name: 'user-home', params: { id: localStorage.getItem('user') } });
            } else {
                alert('Failed to submit daily tasks.');
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to submit daily tasks.');
        }
    }
}

function goToELibrary() {
    window.open('https://engage-dev1.comprodls.com/', '_blank');
}

async function validateExpression() {
    let result;
    try {
        if (!/^[0-9+\-*/().\s]+$/.test(userInput.value)) {
            throw new Error('Invalid characters used.');
        }
        result = evaluate(userInput.value);
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
    totalSolvedNumber.value += 1;
    matchedTarget.disabled = true;
    message.value = `Great! You cleared ${result}.`;
    userInput.value = '';
}

function endGame() {
    targetNumbers.value.forEach(n => n.disabled = true);
}
</script>

<template>
    <div v-if="true">
        <Header />
        <div class="min-h-screen bg-gray-100 p-4">
            <div class="max-w-6xl mx-auto grid grid-cols-1 gap-8">

                <!-- Number Bowling Container -->
                <div class="bg-white rounded-xl shadow-2xl p-6 transition-all duration-300 flex flex-col items-center"
                    :class="{ 'opacity-50': bowlingComplete }">
                    <h2 class="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
                        🎲 Number Bowling
                    </h2>

                    <!-- Dice -->
                    <div v-memo="[dice]" class="flex justify-center space-x-4 mb-6">
                        <div v-for="(d, i) in dice" :key="i" :class="{ 'animate-dice-roll': animatingDice }"    
                            class="w-16 h-16 rounded-xl bg-purple-100 text-purple-800 border-2 border-purple-500 text-3xl font-bold flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                            {{ d }}
                        </div>
                    </div>

                    <!-- Targets -->
                    <div class="grid grid-cols-5 gap-3 mb-6">
                        <div v-for="num in targetNumbers" :key="num.value" :class="[
                            'w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all',
                            num.disabled
                                ? 'bg-gray-300 text-gray-500 line-through scale-95 animate-cleared-target'
                                : 'bg-purple-100 text-purple-800 border border-purple-400 hover:bg-purple-200 hover:scale-105'
                        ]">
                            {{ num.value }}
                        </div>
                    </div>

                    <!-- Input -->
                    <input type="text" v-model="userInput" placeholder="e.g. (6+6)/3"
                        @keyup.enter.prevent="validateExpression" :disabled="bowlingComplete"
                        class="w-full px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-purple-400 text-center text-base mb-4 shadow-sm disabled:opacity-50" />

                    <!-- Submit Button -->
                    <div class="flex space-x-4">
                        <button @click="startGame" :disabled="gameStarted"
                            class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow">
                            {{ gameStarted ? '🎲 Game Started' : '▶️ Start' }}
                        </button>
                        <button @click="endGame" :disabled="!gameStarted" :class="{ 'opacity-50': !gameStarted }"
                            class="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md shadow">
                            ⏹️ End Game
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
                            <p class="text-gray-600 font-semibold">Complete the bowling game to unlock MCQ questions</p>
                            <p class="text-sm text-gray-500 mt-2 font-semibold">Progress: {{ usedTargets }}/10 numbers
                                cleared</p>
                        </div>
                    </div>

                    <h2 class="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
                        ❓ MCQ Questions
                    </h2>

                    <!-- Question Display -->
                    <div v-if="currentQuestion" class="w-full mb-6">
                        <div class="bg-gray-50 rounded-lg p-4 mb-4">
                            <h3 class="text-lg font-semibold text-gray-800 mb-3">
                                Question {{ currentQuestionIndex + 1 }} of {{ questionsCount }}
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
                        <p>🕒 Time: {{ formatTime(elapsedTime) }}</p>
                        <p>✅ Cleared: {{ totalSolvedNumber }} / 10</p>
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
                            MCQ Score: {{ score }} / {{ questionsCount }}
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
    <div v-else></div>
    <Footer />
</template>

<style scoped></style>
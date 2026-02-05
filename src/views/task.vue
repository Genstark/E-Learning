<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, computed, watch, onUnmounted, onBeforeMount } from 'vue';
import Header from '@/components/Header.vue';
import { evaluate } from "mathjs";
import { useRouter } from 'vue-router';

const GAME_STATE_KEY = 'numberBowlingGameState';
const LAST_SUBMISSION_DATE_KEY = 'lastSubmissionDate';

// Function to check if it's a new day
function isNewDay() {
    const lastDate = localStorage.getItem(LAST_SUBMISSION_DATE_KEY);
    const today = new Date().toISOString().slice(0, 10);
    return !lastDate || lastDate !== today;
}

// Function to save game state to localStorage
function saveGameState() {
    // Agar game finish ho gaya hai to localStorage save mat karo
    if (gameFinished.value) {
        return;
    }

    const gameState = {
        targetNumbers: targetNumbers.value,
        dice: dice.value,
        userInput: userInput.value,
        message: message.value,
        startTime: startTime.value,
        elapsedTime: elapsedTime.value,
        totalGameTime: totalGameTime.value,
        gameFinished: gameFinished.value,
        gameStarted: gameStarted.value,
        currentQuestionIndex: currentQuestionIndex.value,
        score: score.value,
        totalSolvedNumber: totalSolvedNumber.value,
        questions: questions.value,
    };
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
}

// Function to restore game state from localStorage
function restoreGameState() {
    // Pehle check karo ki new day hai ya nahi
    if (!isNewDay()) {
        const savedState = localStorage.getItem(GAME_STATE_KEY);
        if (savedState) {
            const gameState = JSON.parse(savedState);
            // Agar game already finished hai to restore mat karo
            if (gameState.gameFinished) {
                localStorage.removeItem(GAME_STATE_KEY);
                return;
            }

            targetNumbers.value = gameState.targetNumbers;
            dice.value = gameState.dice;
            userInput.value = gameState.userInput;
            message.value = gameState.message;
            startTime.value = gameState.startTime;
            elapsedTime.value = gameState.elapsedTime;
            totalGameTime.value = gameState.totalGameTime;
            gameFinished.value = gameState.gameFinished;
            gameStarted.value = gameState.gameStarted;
            currentQuestionIndex.value = gameState.currentQuestionIndex;
            score.value = gameState.score;
            totalSolvedNumber.value = gameState.totalSolvedNumber;
            questions.value = gameState.questions;

            // Restore timer if it was running
            if (gameStarted.value && !gameFinished.value) {
                timerInterval = setInterval(() => {
                    elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
                }, 1000);
            }
        }
    } else {
        // New day hai to localStorage clear kar do
        localStorage.removeItem(GAME_STATE_KEY);
    }
}

onUnmounted(() => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    saveGameState();
});

const pending = ref(false);
const router = useRouter();
const completeGameScore = ref(null);

onBeforeMount(async () => {
    const user = localStorage.getItem('user');

    try {
        const response = await fetch(`${process.env.VUE_APP_URL}/repeat-check/${user}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await response.json();
        if (data.ok) {
            // Already done today - redirect to home
            alert('You have already completed today\'s tasks!');
            // router.push({ name: 'user-home', params: { id: user } });
            completeGameScore.value = data.data[data.data.length - 1];
            pending.value = false;
            gameFinished.value = true;
            return;
        } else {
            // New day ya abhi nahi kiya - restore state agar hai to
            restoreGameState();
            pending.value = true;
        }
    } catch (error) {
        console.error('Error checking repeat status:', error);
        restoreGameState();
        pending.value = true;
    }
});

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
    },
    {
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
        correctAnswer: 2
    },
    {
        question: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"],
        correctAnswer: 1
    },
    {
        question: "Which gas do plants absorb from the atmosphere?",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        correctAnswer: 2
    },
    {
        question: "What is the largest planet in our solar system?",
        options: ["Earth", "Mars", "Jupiter", "Saturn"],
        correctAnswer: 2
    },
    {
        question: "In which continent is the Sahara Desert located?",
        options: ["Asia", "Africa", "Australia", "South America"],
        correctAnswer: 1
    },
    {
        question: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"],
        correctAnswer: 2
    },
    {
        question: "What is the chemical symbol for gold?",
        options: ["Ag", "Au", "Fe", "Go"],
        correctAnswer: 1
    },
    {
        question: "Which country is known as the Land of the Rising Sun?",
        options: ["China", "Japan", "Thailand", "India"],
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
    if (loading.value || gameStarted.value) return;

    loading.value = true;
    message.value = 'Loading game data...';

    // Timer start
    // if (!startTime.value) {
    //     startTime.value = Date.now() - (elapsedTime.value * 1000);
    //     timerInterval = setInterval(() => {
    //         elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
    //     }, 1000);
    // }
    // gameStarted.value = true;

    // API se data fetch (only if dice are not already loaded)
    if (dice.value.length === 0) {
        try {
            const response = await fetch(`${process.env.VUE_APP_URL}/roll-dice`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

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
                let parsedQuestions = null;
                if (typeof data.questions === 'string') {
                    try {
                        const parsed = JSON.parse(data.questions);
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
                    message.value = `Questions loaded: ${questions.value.length} questions`;
                } else {
                    message.value = 'Questions parsing failed - using defaults';
                }
                // Timer start
                if (!startTime.value) {
                    startTime.value = Date.now() - (elapsedTime.value * 1000);
                    timerInterval = setInterval(() => {
                        elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
                    }, 1000);
                }
                gameStarted.value = true;
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
    } else {
        loading.value = false;
    }
}

async function submitAnswer() {
    if (selectedAnswer.value === null || gameFinished.value || !currentQuestion.value) return;

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

    const isLastQuestion = currentQuestionIndex.value >= questions.value.length - 1;

    if (isLastQuestion) {
        // Stop timer
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        totalGameTime.value = elapsedTime.value;
        gameFinished.value = true;

        setTimeout(async () => {
            alert(`Quiz completed! Your score: ${score.value}/${questions.value.length}\nNumber of questions solved: ${totalSolvedNumber.value}\nTotal time: ${formatTime(totalGameTime.value)}`);

            if (bothGamesComplete.value) {
                try {
                    const todayDate = new Date().toISOString().slice(0, 10);
                    const response = await fetch(`${process.env.VUE_APP_URL}/submit/daily-tasks`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            mcqScore: Number(score.value),
                            numberBowlingScore: Number(totalSolvedNumber.value),
                            totalScore: Number(score.value + totalSolvedNumber.value),
                            totalTime: formatTime(totalGameTime.value),
                            userName: localStorage.getItem('user'),
                            submissionDate: todayDate,
                        })
                    });

                    const data = await response.json();
                    if (data.ok) {
                        // Successfully submitted - clear localStorage and save submission date
                        localStorage.removeItem(GAME_STATE_KEY);
                        localStorage.setItem(LAST_SUBMISSION_DATE_KEY, todayDate);
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
        }, 1500);
    } else {
        setTimeout(() => {
            currentQuestionIndex.value++;
            selectedAnswer.value = null;
            answerFeedback.value = null;
        }, 2000);
    }
}

function goToELibrary() {
    window.open('https://engage-dev1.comprodls.com/', '_blank');
}

async function validateExpression() {
    let result;
    try {
        const expr = String(userInput.value || '').trim();
        if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
            throw new Error('Invalid characters used.');
        }

        if (!/[+\-*/]/.test(expr)) {
            message.value = 'Please enter a valid expression containing at least one operator (e.g. (6+6)/3).';
            return;
        }

        const raw = evaluate(expr);
        const numeric = Number(raw);
        if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
            throw new Error('Expression must evaluate to an integer.');
        }
        result = numeric;
    } catch (err) {
        message.value = 'Invalid expression.';
        return;
    }

    const usedNumbers = (userInput.value.match(/\d+/g) || []).map(Number);
    const diceCopy = [...dice.value].map(Number);

    for (const num of usedNumbers) {
        const i = diceCopy.indexOf(num);
        if (i === -1) {
            message.value = 'Used number not on dice or reused.';
            return;
        }
        diceCopy.splice(i, 1);
    }

    const matchedTarget = targetNumbers.value.find(t => t.value === result && !t.disabled);
    if (!matchedTarget) {
        message.value = 'No matching target available to clear.';
        return;
    }

    totalSolvedNumber.value += 1;
    matchedTarget.disabled = true;
    message.value = `Great! You cleared ${result}.`;
    userInput.value = '';
}

function endBowling() {
    if (confirm('Are you sure you want to skip remaining numbers and move to MCQ questions?')) {
        // Saare remaining numbers ko disabled kar do
        targetNumbers.value.forEach(n => n.disabled = true);
        message.value = 'Number Bowling ended. Now solve MCQ questions!';
        userInput.value = '';
    }
}

async function quitGame() {
    if (confirm('Are you sure you want to quit the entire game? All progress will be lost and you will be redirected to home.')) {
        // Timer stop karo
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        const todayDate = new Date().toISOString().slice(0, 10);
        const response = await fetch(`${process.env.VUE_APP_URL}/submit/daily-tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mcqScore: Number(score.value),
                numberBowlingScore: Number(totalSolvedNumber.value),
                totalScore: Number(score.value + totalSolvedNumber.value),
                totalTime: formatTime(totalGameTime.value),
                userName: localStorage.getItem('user'),
                submissionDate: todayDate,
            })
        });

        const data = await response.json();
        if (data.ok) {
            // Sab kuch clear kar do
            localStorage.removeItem(GAME_STATE_KEY);
            localStorage.removeItem(LAST_SUBMISSION_DATE_KEY);
        }

        // Home page pe redirect kar do
        alert('Game quit. Redirecting to home page...');
        router.push({ name: 'user-home', params: { id: localStorage.getItem('user') } });
    }
}
</script>

<template>
    <Header />
    <div v-if="pending">
        <div class="min-h-screen bg-gray-100 p-4">
            <div class="max-w-6xl mx-auto grid grid-cols-1 gap-8">

                <!-- Number Bowling Container -->
                <div class="bg-white rounded-xl shadow-2xl p-6 transition-all duration-300 flex flex-col items-center"
                    :class="{ 'opacity-50': bowlingComplete }">
                    <h2 class="text-2xl font-semibold text-indigo-700 mb-6 flex items-center gap-2">
                        🎲 Number Bowling
                    </h2>

                    <!-- Dice: fixed-width container -->
                    <div v-memo="[dice]" class="w-full flex justify-center items-center mb-6 px-2">
                        <div class="flex gap-2 sm:gap-4">
                            <div v-for="(d, i) in dice" :key="i" :class="{ 'animate-dice-roll': animatingDice }"
                                class="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl bg-purple-100 text-purple-800 border-2 border-purple-500 text-2xl sm:text-3xl font-bold flex items-center justify-center shadow-xl hover:scale-105 transition-transform">
                                {{ d }}
                            </div>
                        </div>
                    </div>

                    <!-- Targets -->
                    <div class="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-6">
                        <div v-for="num in targetNumbers" :key="num.value" :class="[
                            'w-10 h-10 text-sm rounded-full flex items-center justify-center font-bold transition-all',
                            'sm:w-12 sm:h-12 sm:text-base',
                            'md:w-12 md:h-12 md:text-lg',
                            'lg:w-14 lg:h-14 lg:text-xl',
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
                            class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow disabled:opacity-50 disabled:cursor-not-allowed">
                            {{ gameStarted ? '🎲 Game Started' : '▶️ Start Game' }}
                        </button>
                        <button @click="endBowling" :disabled="!gameStarted || bowlingComplete"
                            class="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md shadow disabled:opacity-50 disabled:cursor-not-allowed">
                            ⏹️ End Game
                        </button>
                    </div>

                    <!-- Message -->
                    <p class="text-sm text-gray-600 italic mb-2 mt-4">{{ message }}</p>
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
                    <div v-if="currentQuestion && !gameFinished" class="w-full mb-6">
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
                                        :value="index" v-model="selectedAnswer"
                                        :disabled="!bowlingComplete || gameFinished"
                                        class="mr-3 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50">
                                    <label :for="'option' + index" :class="[
                                        bowlingComplete && !gameFinished ? 'text-gray-700 cursor-pointer hover:text-indigo-600' : 'text-gray-400 cursor-not-allowed'
                                    ]">
                                        {{ option }}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Submit Answer Button -->
                        <button @click="submitAnswer" :disabled="selectedAnswer === null || gameFinished"
                            class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md shadow transition-colors disabled:cursor-not-allowed">
                            Submit Answer
                        </button>

                        <!-- Feedback -->
                        <div v-if="answerFeedback" class="mt-4 p-3 rounded-md"
                            :class="answerFeedback.correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                            {{ answerFeedback.message }}
                        </div>
                    </div>

                    <!-- Game Completed Message -->
                    <div v-if="gameFinished" class="w-full mb-6">
                        <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 text-center">
                            <div class="text-6xl mb-4">🎉</div>
                            <h3 class="text-2xl font-bold text-green-800 mb-3">Congratulations!</h3>
                            <p class="text-gray-700 text-lg mb-6">You've completed all tasks successfully!</p>

                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div class="bg-white rounded-lg p-4 shadow">
                                    <p class="text-gray-600 text-sm mb-1">MCQ Score</p>
                                    <p class="text-2xl font-bold text-indigo-600">{{ score }} / {{ questionsCount }}</p>
                                </div>
                                <div class="bg-white rounded-lg p-4 shadow">
                                    <p class="text-gray-600 text-sm mb-1">Numbers Cleared</p>
                                    <p class="text-2xl font-bold text-purple-600">{{ totalSolvedNumber }} / 10</p>
                                </div>
                                <div class="bg-white rounded-lg p-4 shadow">
                                    <p class="text-gray-600 text-sm mb-1">Total Time</p>
                                    <p class="text-2xl font-bold text-blue-600">{{ formatTime(totalGameTime) }}</p>
                                </div>
                            </div>

                            <p class="text-gray-600 text-sm">Submitting your results...</p>
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

                    <!-- Quit Game Button -->
                    <div class="w-full mt-4">
                        <button @click="quitGame" :disabled="!gameStarted || gameFinished"
                            class="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md shadow transition-colors disabled:cursor-not-allowed">
                            ❌ Quit Entire Game
                        </button>
                    </div>

                    <!-- Score and Total Time -->
                    <div class="w-full mt-4 text-center">
                        <p class="text-sm text-gray-600">
                            MCQ Score: {{ score }} / {{ questionsCount }}
                        </p>
                        <p v-if="totalGameTime > 0" class="text-sm font-semibold text-indigo-700 mt-2">
                            Total Game Time: {{ formatTime(totalGameTime) }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div v-if="gameFinished && completeGameScore">
        <!-- Game Completed Message -->
        <div class="w-full mb-6">
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 text-center">
                <div class="text-6xl mb-4">🎉</div>
                <h3 class="text-2xl font-bold text-green-800 mb-3">Congratulations!</h3>
                <p class="text-gray-700 text-lg mb-6">You've completed all tasks successfully!</p>
                <p class="text-gray-700 text-lg mb-6">Today Score</p>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-white rounded-lg p-4 shadow">
                        <p class="text-gray-600 text-sm mb-1">MCQ Score</p>
                        <p class="text-2xl font-bold text-indigo-600">{{ completeGameScore.mcqScore }} / {{
                            questionsCount }}</p>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow">
                        <p class="text-gray-600 text-sm mb-1">Numbers Cleared</p>
                        <p class="text-2xl font-bold text-purple-600">{{ completeGameScore.numberBowlingScore }} / 10
                        </p>
                    </div>
                    <div class="bg-white rounded-lg p-4 shadow">
                        <p class="text-gray-600 text-sm mb-1">Total Time</p>
                        <p class="text-2xl font-bold text-blue-600">{{ completeGameScore.totalTime }}</p>
                    </div>
                </div>

                <!-- <p class="text-gray-600 text-sm">Submitting your results...</p> -->
            </div>
        </div>
    </div>
</template>

<style scoped></style>
<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';

const router = useRouter();
const username = localStorage.getItem('user') || '';
const profile = ref(null);
const loading = ref(false);
const error = ref('');

async function loadProfile() {
    if (!username) {
        error.value = 'No logged-in user found.';
        return;
    }
    loading.value = true;
    error.value = '';
    try {
        const res = await fetch(`${process.env.VUE_APP_URL}/user-score/${username}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        const json = await res.json();
        if (res.ok && json.data) {
            profile.value = json.data;
        }
        else if (json.data) {
            profile.value = json.data;
        }
        else {
            // if the API returns not found, fallback to minimal info from localStorage (if any)
            error.value = json.message || 'Profile not found';
        }
    } catch (ex) {
        error.value = 'Failed to load profile';
        console.error(ex);
    } finally {
        loading.value = false;
    }
}

function goToResetEmail() {
    router.push('/reset-email');
}

onMounted(() => {
    loadProfile();
});

const displayName = computed(() => profile.value?.userName || profile.value?.name || username || '—');
const displayEmail = computed(() => profile.value?.userEmail || profile.value?.email || '—');
const submissionDate = computed(() => {
    if (profile.value && profile.value.submissionDate) {
        return new Date(profile.value.submissionDate).toLocaleDateString();
    }
    return '—';
});
const mcqScore = computed(() => Number(profile.value?.mcqScore || 0));
const numberBowlingScore = computed(() => Number(profile.value?.numberBowlingScore || 0));
const totalScore = computed(() => {
    if (profile.value && typeof profile.value.totalScore !== 'undefined') {
        return Number(profile.value.totalScore);
    }
    return mcqScore.value + numberBowlingScore.value;
});

// Date restrictions: last 7 days from today
const maxDate = computed(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
});

const minDate = computed(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    return sevenDaysAgo.toISOString().split('T')[0];
});

const selectedDate = ref('');
const priviousScore = ref(null);
async function printDate() {
    console.log('Selected date:', selectedDate.value);
    const apiUrl = `${process.env.VUE_APP_URL}/user-privious-score/${username}/${selectedDate.value}`;
    const fetchData = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    const json = await fetchData.json();
    if (json.data) {
        priviousScore.value = json.data;
        console.log('Previous Score Data:', priviousScore.value);
    }
    else {
        console.log('No data found for the selected date.');
    }
    // Here you can add logic to filter profile data based on the selected date
}
</script>

<template>
    <div>
        <Header />

        <main class="p-4 sm:p-6 max-w-4xl mx-auto">
            <section class="bg-white shadow rounded p-4 sm:p-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <!-- Avatar: initials fallback -->
                        <div class="flex items-center justify-center bg-blue-100 text-blue-800 rounded-full w-16 h-16 sm:w-20 
                            sm:h-20 text-xl font-semibold border-2 border-blue-300">
                            {{ (displayName || 'U').slice(0, 1).toUpperCase() }}
                        </div>
                        <div>
                            <h2 class="text-xl sm:text-2xl font-semibold">{{ displayName }}</h2>
                            <p class="text-sm sm:text-base text-gray-600 font-semibold">{{ displayEmail }}</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <button
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded w-full sm:w-auto text-sm transition-colors"
                            @click="loadProfile">
                            Refresh
                        </button>
                        <button
                            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded w-full sm:w-auto text-sm transition-colors"
                            @click="goToResetEmail">
                            Reset Email
                        </button>
                    </div>
                </div>

                <!-- Profile Stats -->
                <div class="mt-6">
                    <div v-if="loading" class="text-sm text-gray-600">Loading profile…</div>

                    <div v-else>
                        <div v-if="error" class="mb-4 text-sm text-red-600">{{ error }}</div>

                        <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                            <div class="p-4 bg-gray-50 rounded">
                                <dt class="text-xs text-gray-500">MCQ Score</dt>
                                <dd class="text-2xl font-bold mt-1">{{ mcqScore }}</dd>
                            </div>

                            <div class="p-4 bg-gray-50 rounded">
                                <dt class="text-xs text-gray-500">Number Bowling</dt>
                                <dd class="text-2xl font-bold mt-1">{{ numberBowlingScore }}</dd>
                            </div>

                            <div class="p-4 bg-gray-50 rounded">
                                <dt class="text-xs text-gray-500">Total Score</dt>
                                <dd class="text-2xl font-extrabold text-blue-700 mt-1">{{ totalScore }}</dd>
                            </div>

                            <div class="p-4 bg-gray-50 rounded">
                                <dt class="text-xs text-gray-500">Date</dt>
                                <dd class="text-2xl font-bold text-black mt-1">{{ submissionDate }}</dd>
                            </div>
                        </dl>
                    </div>
                    <!-- date input with last 7 days restriction -->
                    <div class="mt-4">
                        <label for="date" class="block text-sm font-medium text-gray-700 mb-1">Select Date:</label>
                        <input type="date" id="date" name="date" :min="minDate" :max="maxDate" v-model="selectedDate"
                            class="mt-1 block w-full sm:w-1/2 border border-gray-300 rounded-md shadow-sm 
                            py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        <button @click="printDate"
                            class="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded w-full sm:w-auto text-sm transition-colors">
                            Filter
                        </button>

                        <div v-if="priviousScore" class="mt-6">
                            <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-lg font-semibold text-gray-800">
                                        Previous Performance
                                    </h3>
                                    <span class="text-sm text-gray-500">
                                        {{ selectedDate }}
                                    </span>
                                </div>

                                <!-- Score Cards -->
                                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <!-- Rank -->
                                    <div class="p-4 bg-gray-50 rounded-lg text-center">
                                        <p class="text-xs text-gray-500 mb-1">Rank</p>
                                        <p class="text-2xl font-bold text-gray-800">
                                            {{ priviousScore.rank ?? '—' }}
                                        </p>
                                    </div>

                                    <!-- MCQ -->
                                    <div class="p-4 bg-blue-50 rounded-lg text-center">
                                        <p class="text-xs text-blue-600 mb-1">MCQ Score</p>
                                        <p class="text-2xl font-bold text-blue-800">
                                            {{ priviousScore.mcqScore || 0 }}
                                        </p>
                                    </div>

                                    <!-- Number Bowling -->
                                    <div class="p-4 bg-purple-50 rounded-lg text-center">
                                        <p class="text-xs text-purple-600 mb-1">Number Bowling</p>
                                        <p class="text-2xl font-bold text-purple-800">
                                            {{ priviousScore.numberBowlingScore || 0 }}
                                        </p>
                                    </div>

                                    <!-- Total -->
                                    <div class="p-4 bg-green-100 rounded-lg text-center border border-green-300">
                                        <p class="text-xs text-green-700 mb-1">Total Score</p>
                                        <p class="text-3xl font-extrabold text-green-800">
                                            {{ (priviousScore.mcqScore || 0) + (priviousScore.numberBowlingScore || 0) }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<style scoped>
/* Minimal styles; the project already uses Tailwind so classes above will apply */
</style>
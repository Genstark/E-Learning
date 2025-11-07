<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import Header from '@/components/Header.vue';

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
        const res = await fetch(`/api/repeat-check/${encodeURIComponent(username)}`);
        const json = await res.json();
        if (res.ok && json.ok && json.data) {
            profile.value = json.data;
        } else {
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

onMounted(() => {
    loadProfile();
});

const displayName = computed(() => profile.value?.userName || profile.value?.name || username || '—');
const displayEmail = computed(() => profile.value?.userEmail || profile.value?.email || '—');
const mcqScore = computed(() => Number(profile.value?.mcqScore || 0));
const numberBowlingScore = computed(() => Number(profile.value?.numberBowlingScore || 0));
const totalScore = computed(() => {
    if (profile.value && typeof profile.value.totalScore !== 'undefined') return Number(profile.value.totalScore);
    return mcqScore.value + numberBowlingScore.value;
});
</script>

<template>
    <div>
        <Header />

        <main class="p-4 sm:p-6 max-w-4xl mx-auto">
            <section class="bg-white shadow rounded p-4 sm:p-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <!-- Avatar: initials fallback -->
                        <div class="flex items-center justify-center bg-blue-100 text-blue-800 rounded-full w-16 h-16 sm:w-20 sm:h-20 text-xl font-semibold">
                            {{ (displayName || 'U').slice(0,1).toUpperCase() }}
                        </div>
                        <div>
                            <h2 class="text-xl sm:text-2xl font-semibold">{{ displayName }}</h2>
                            <p class="text-sm sm:text-base text-gray-600">{{ displayEmail }}</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <button class="px-4 py-2 bg-blue-600 text-white rounded w-full sm:w-auto text-sm" @click="loadProfile">
                            Refresh
                        </button>
                    </div>
                </div>

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
                        </dl>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<style scoped>
/* Minimal styles; the project already uses Tailwind so classes above will apply */
</style>
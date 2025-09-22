<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import Header from '@/components/Header.vue';
import { onUnmounted, onMounted, ref } from 'vue';

const scores = ref([]);
onMounted(async () => {
    const response = await fetch(`${process.env.VUE_APP_URL}/daily-tasks/scoreboard`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    });
    const data = await response.json();
    scores.value = data.scoreData;
    console.log(data);
});

onUnmounted(() => {
    console.log('Score component unmounted');
});
</script>

<template>
    <Header />
    <div class="max-w-4xl mx-auto p-6">
        <h2 class="text-2xl font-bold text-center mb-6">🏆 Daily Scoreboard</h2>

        <div class="overflow-x-auto rounded-lg shadow">
            <table class="min-w-full divide-y divide-gray-200 bg-white">
                <thead class="bg-green-600 text-white">
                    <tr>
                        <th class="px-4 py-3 text-left text-sm font-medium">Rank</th>
                        <th class="px-4 py-3 text-left text-sm font-medium">Name</th>
                        <th class="px-4 py-3 text-center text-sm font-medium">Number Bowling</th>
                        <th class="px-4 py-3 text-center text-sm font-medium">MCQ</th>
                        <th class="px-4 py-3 text-center text-sm font-medium">Total Score</th>
                        <th class="px-4 py-3 text-center text-sm font-medium">Total Time (s)</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    <tr v-for="(item, index) in scores" :key="index" class="hover:bg-green-50">
                        <td class="px-4 py-3 text-sm text-gray-700 font-semibold">{{ index + 1 }}</td>
                        <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ item.userName }}</td>
                        <td class="px-4 py-3 text-sm text-center text-gray-700">{{ item.totalNumberSolved }}</td>
                        <td class="px-4 py-3 text-sm text-center text-gray-700">{{ item.mcqScore }}</td>
                        <td class="px-4 py-3 text-sm text-center text-gray-700 font-medium">{{ item.totalNumberSolved + item.mcqScore }}</td>
                        <td class="px-4 py-3 text-sm text-center text-gray-700">{{ item.totalTime }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped></style>
<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { useRouter } from 'vue-router';
import numberBowling from '../../public/images/numberBowlingGame.png';
import library from '../../public/images/library.png'; // Replace with a relevant image URL
const route = useRouter();
const cards = [
    {
        title: 'Number Bowling',
        // description: 'Explore interactive lessons and expand your knowledge.',
        description: 'Practice your skills with engaging exercises.',
        image: numberBowling,
        page: '/number-bowling'
    },
    {
        title: 'Library',
        description: 'Explore interactive lessons and expand your knowledge.',
        image: library,
        page: '/library'
        // image: 'https://img.freepik.com/free-vector/student-studying-online-isometric-illustration_52683-79996.jpg?w=740&T=ST=1700000000~EXP=1700000000~HMAC=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy'
    },
    {
        title: 'Task',
        description: 'Complete the assigned tasks and quizzes.',
        image: 'https://img.freepik.com/free-vector/online-learning-isometric-landing-page_52683-51940.jpg?w=740&T=ST=1700000000~EXP=1700000000~HMAC=zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
        page: '/task'
    },
];
</script>

<template>
    <div class="p-6 bg-gray-100 min-h-screen">
        <!-- Grid Container -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <!-- Repeat Card Component -->
            <div v-for="(card, index) in cards" :key="index"
                class="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <!-- Card Image -->
                <img :src="card.image" :alt="card.title" class="w-full h-52 object-cover" />
                <!-- Card Content -->
                <div class="p-6">
                    <h5 class="text-lg font-semibold text-gray-800 mb-2">{{ card.title }}</h5>
                    <p class="text-sm text-gray-600">{{ card.description }}</p>
                    <div class="mt-4">
                        <button @click="route.push(card.page)"
                            class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                            Click
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped>
</style>
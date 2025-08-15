<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { useRouter } from 'vue-router';
const route = useRouter();
const cards = [
    {
        title: 'Card 1',
        description: 'Explore interactive lessons and expand your knowledge.',
        image: 'https://img.freepik.com/free-vector/online-courses-isometric-landing-page_52683-80227.jpg?w=740&T=ST=1700000000~EXP=1700000000~HMAC=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // Replace with a relevant image URL
    },
    {
        title: 'Card 2',
        description: 'Practice your skills with engaging exercises.',
        image: 'https://img.freepik.com/free-vector/student-studying-online-isometric-illustration_52683-79996.jpg?w=740&T=ST=1700000000~EXP=1700000000~HMAC=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy' // Replace with a relevant image URL
    },
    {
        title: 'Card 3',
        description: 'Join a community of learners and share your progress.',
        image: 'https://img.freepik.com/free-vector/online-learning-isometric-landing-page_52683-51940.jpg?w=740&T=ST=1700000000~EXP=1700000000~HMAC=zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' // Replace with a relevant image URL
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
                        <button @click="route.push('/number-bowling')"
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
<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { useRouter } from 'vue-router';
const route = useRouter();
const cards = [
    {
        title: 'Card 1',
        description: 'This is card number 1.',
        image: 'https://img.freepik.com/free-vector/isometric-online-education-concept_52683-8896.jpg?ga=GA1.1.1207757706.1754455616&semt=ais_hybrid&w=740&q=80'
    },
    {
        title: 'Card 2',
        description: 'This is card number 2.',
        image: 'https://img.freepik.com/free-vector/isometric-online-education-concept_52683-8896.jpg?ga=GA1.1.1207757706.1754455616&semt=ais_hybrid&w=740&q=80'
    },
    {
        title: 'Card 3',
        description: 'This is card number 3.',
        image: 'https://img.freepik.com/free-vector/isometric-online-education-concept_52683-8896.jpg?ga=GA1.1.1207757706.1754455616&semt=ais_hybrid&w=740&q=80'
    },
];
</script>

<template>
    <div class="p-6 bg-gray-100 min-h-screen">
        <!-- Grid Container -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

            <!-- Repeat Card Component -->
            <div v-for="(card, index) in cards" :key="index"
                class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <!-- Card Image -->
                <img :src="card.image" :alt="card.title" class="w-full h-52 object-cover" />
                <!-- Card Content -->
                <div class="p-4">
                    <h5 class="text-lg font-semibold text-gray-800 mb-2">{{ card.title }}</h5>
                    <p class="text-sm text-gray-600">{{ card.description }}</p>
                    <div class="mt-4">
                        <button @click="route.push('/about')"
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
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
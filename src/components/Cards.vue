<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
const cards = [
    {
        title: 'Card 1',
        description: 'This is card number 1.',
        image: 'https://via.placeholder.com/400x200'
    },
    {
        title: 'Card 2',
        description: 'This is card number 2.',
        image: 'https://via.placeholder.com/400x200'
    },
    {
        title: 'Card 3',
        description: 'This is card number 3.',
        image: 'https://via.placeholder.com/400x200'
    },
    {
        title: 'Card 4',
        description: 'This is card number 4.',
        image: 'https://via.placeholder.com/400x200'
    },
    {
        title: 'Card 5',
        description: 'This is card number 5.',
        image: 'https://via.placeholder.com/400x200'
    },
    {
        title: 'Card 6',
        description: 'This is card number 6.',
        image: 'https://via.placeholder.com/400x200'
    },
    // Add more cards as needed
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
                <img :src="card.image" :alt="card.title" class="w-full h-48 object-cover" />

                <!-- Card Content -->
                <div class="p-4">
                    <h5 class="text-lg font-semibold text-gray-800 mb-2">{{ card.title }}</h5>
                    <p class="text-sm text-gray-600">{{ card.description }}</p>

                    <div class="mt-4">
                        <button
                            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                            Click
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped></style>
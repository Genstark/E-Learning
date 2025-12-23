<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { useRouter } from 'vue-router';
import { defineProps } from 'vue';

const route = useRouter();

// Define props
const props = defineProps({
    cards: {
        type: Array,
        required: true,
    },
});
// open external page in blank tab
const openBlank = (url) => {
    window.open(url, "_blank");
};
</script>

<template>
    <div class="p-6 bg-gray-100 min-h-screen">
        <!-- Grid Container -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <!-- Repeat Card Component -->
            <div v-for="(card, index) in props.cards" :key="index"
                class="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <!-- Card Image -->
                <img :src="card.image" :alt="card.title" class="w-full aspect-[4/3] object-contain bg-black/5" />
                <!-- Card Content -->
                <div class="p-6">
                    <h5 class="text-lg font-semibold text-gray-800 mb-2">{{ card.title }}</h5>
                    <p class="text-sm text-gray-600 font-medium">{{ card.description }}</p>
                    <div class="mt-4">
                        <button v-if="card.blank" @click="openBlank(card.page)"
                            class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                            Click
                        </button>
                        <button v-else @click="route.push(card.page)"
                            class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                            Click
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped></style>

<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const isMobileMenuOpen = ref(false);
const largeText = ref(false);
const searchQuery = ref("");
const recentSearches = ref([]); // store {term, time}

function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

// Load from localStorage on mount
onMounted(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
        recentSearches.value = JSON.parse(saved);
    }
});

// Save new search
function saveSearch() {
    if (!searchQuery.value.trim()) return;

    // Add new search with time
    recentSearches.value = [
        { term: searchQuery.value, time: new Date().toLocaleTimeString() },
        ...recentSearches.value.filter((item) => item.term !== searchQuery.value),
    ].slice(0, 5); // keep only 5 latest

    localStorage.setItem("recentSearches", JSON.stringify(recentSearches.value));
    searchQuery.value = "";
}

// Use a past search
function usePastSearch(term) {
    searchQuery.value = term;
}
</script>

<template>
    <header class="bg-white shadow" :class="{ 'large-text': largeText }">
        <div class="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-3 sm:py-4">
                <!-- Left: Logo + Nav -->
                <div class="flex items-center space-x-4 sm:space-x-6">
                    <a href="/" class="text-2xl sm:text-3xl font-bold text-primary-600 whitespace-nowrap inline-block"
                        id="heading">
                        E-L
                    </a>

                    <!-- Nav (hidden on mobile) -->
                    <nav class="hidden md:flex items-center space-x-4 lg:space-x-6">
                        <div class="relative">
                            <button
                                class="text-sm sm:text-base lg:text-lg font-medium text-gray-700 hover:text-black flex items-center">
                                Shots
                                <svg class="w-4 h-4 sm:w-5 sm:h-5 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.08 1.04l-4.25 4.25a.75.75 0 0 1-1.08 0L5.25 8.27a.75.75 0 0 1-.02-1.06z" />
                                </svg>
                            </button>
                        </div>
                        <a href="#"
                            class="text-sm sm:text-base lg:text-lg text-gray-700 hover:text-primary-600">About</a>
                        <a href="#"
                            class="text-sm sm:text-base lg:text-lg text-gray-700 hover:text-primary-600">Explore</a>
                        <a href="#"
                            class="text-sm sm:text-base lg:text-lg text-gray-700 hover:text-primary-600">Blog</a>
                    </nav>
                </div>

                <!-- Right: Search + Buttons (hidden on mobile) -->
                <div class="hidden md:flex items-center space-x-4 lg:space-x-6">
                    <div class="relative flex flex-col">
                        <!-- Search Input -->
                        <div class="relative flex items-center">
                            <input v-model="searchQuery" @keyup.enter="saveSearch" type="text"
                                placeholder="What are you looking for?"
                                class="pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300 w-48 sm:w-64 lg:w-80" />
                            <svg class="w-5 h-5 absolute left-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M12.9 14.32a8 8 0 1 1 1.414-1.414l4.387 4.387a1 1 0 0 1-1.414 1.414l-4.387-4.387zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>

                        <!-- Show Recent Searches -->
                        <div v-if="recentSearches.length"
                            class="absolute top-full mt-1 bg-white border border-gray-200 rounded-md shadow-md w-full z-50">
                            <div v-for="(item, index) in recentSearches" :key="index" @click="usePastSearch(item.term)"
                                class="px-3 py-2 text-sm flex justify-between items-center cursor-pointer hover:bg-gray-100">
                                <span>{{ item.term }}</span>
                                <span class="text-xs text-gray-500">{{ item.time }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Buttons group -->
                    <div class="flex items-center space-x-3 ml-4">
                        <router-link v-if="route.path !== '/signup'" to="/signup"
                            class="text-base font-medium text-gray-700 hover:text-primary-600 flex items-center">
                            Sign up
                        </router-link>

                        <router-link v-if="route.path !== '/login'" to="/login"
                            class="bg-primary-600 text-white text-base font-medium px-4 py-2 rounded-md flex items-center hover:bg-primary-700">
                            Log in
                        </router-link>
                    </div>
                </div>

                <!-- Mobile Hamburger -->
                <div class="md:hidden flex items-center text-gray-700 hover:text-primary-600">
                    <button @click="toggleMobileMenu" class="text-gray-700 hover:text-black focus:outline-none">
                        <svg class="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" stroke-width="2"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Mobile Menu -->
            <div v-if="isMobileMenuOpen" class="md:hidden space-y-4 sm:space-y-6 pb-4 sm:pb-6">
                <nav class="flex flex-col space-y-2 sm:space-y-3">
                    <a href="#" class="text-sm sm:text-base text-gray-700 hover:text-primary-600">Shots</a>
                    <a href="#" class="text-sm sm:text-base text-gray-700 hover:text-primary-600">Explore</a>
                    <a href="#" class="text-sm sm:text-base text-gray-700 hover:text-primary-600">Blog</a>
                </nav>

                <div class="flex flex-col space-y-2 sm:space-y-3 pt-3 sm:pt-4">
                    <input v-model="searchQuery" @keyup.enter="saveSearch" type="text" placeholder="Search..."
                        class="pl-4 sm:pl-5 pr-4 sm:pr-5 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-full" />

                    <!-- Mobile Recent Searches -->
                    <div v-if="recentSearches.length" class="flex flex-col gap-1">
                        <div v-for="(item, index) in recentSearches" :key="index" @click="usePastSearch(item.term)"
                            class="px-3 py-2 text-sm flex justify-between items-center cursor-pointer bg-gray-100 rounded hover:bg-gray-200">
                            <span>{{ item.term }}</span>
                            <span class="text-xs text-gray-500">{{ item.time }}</span>
                        </div>
                    </div>

                    <button @click="router.push('/signup')"
                        class="border border-primary-600 text-sm sm:text-base font-medium text-primary-600 px-4 sm:px-6 py-2 sm:py-3 rounded-full text-center hover:bg-primary-100">
                        Signup
                    </button>
                    <button @click="router.push('/login')"
                        class="bg-primary-600 text-white text-sm sm:text-base font-medium px-4 sm:px-6 py-2 sm:py-3 rounded-full text-center hover:bg-primary-700">
                        Log in
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Accessibility Toggle -->
    <button @click="largeText = !largeText"
        class="fixed bottom-4 right-4 bg-gray-800 text-white text-sm sm:text-base px-3 sm:px-5 py-2 sm:py-3 rounded-full shadow-lg hover:bg-gray-900">
        Toggle Large Text
    </button>
</template>

<style scoped>
/* Accessibility base improvements */
header {
    font-size: 1rem;
    /* default 16px */
}

.large-text {
    font-size: 1.25rem;
    /* ~20px */
}

.large-text a,
.large-text button,
.large-text input {
    font-size: 1.25rem;
    padding: 0.85rem 1.25rem;
}
</style>

<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const isMobileMenuOpen = ref(false)

function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// function signup() {
//     console.log('click');
// }

const route = useRoute();
</script>

<template>
    <header class="bg-white shadow">
        <div class="w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
                <!-- Left: Logo + Nav -->
                <div class="flex items-center space-x-6">
                    <a href="#" class="text-2xl font-bold text-primary-600" id="heading">E-L</a>

                    <!-- Nav (hidden on mobile) -->
                    <nav class="hidden md:flex items-center space-x-4">
                        <div class="relative">
                            <button class="text-sm font-medium text-gray-700 hover:text-black flex items-center">
                                Shots
                                <svg class="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.08 1.04l-4.25 4.25a.75.75 0 0 1-1.08 0L5.25 8.27a.75.75 0 0 1-.02-1.06z" />
                                </svg>
                            </button>
                        </div>
                        <a href="#" target="_top" class="text-sm text-gray-700 hover:text-primary-600">About</a>
                        <a href="#" target="_top" class="text-sm text-gray-700 hover:text-primary-600">Explore</a>
                        <a href="#" target="_top" class="text-sm text-gray-700 hover:text-primary-600">Blog</a>
                    </nav>
                </div>
 
                <!-- Right: Search + Buttons (hidden on mobile) -->
                <div class="hidden md:flex items-center space-x-4">
                    <div class="relative">
                        <input type="text" placeholder="What are you looking for?"
                            class="pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300" />
                        <svg class="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd"
                                d="M12.9 14.32a8 8 0 1 1 1.414-1.414l4.387 4.387a1 1 0 0 1-1.414 1.414l-4.387-4.387zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>

                    <router-link v-if="route.path !== '/signup'" to="/signup"
                        class="text-sm font-medium text-gray-700 hover:text-primary-600">Sign
                        up</router-link>
                    <router-link v-if="route.path !== '/login'" to="/login"
                        class="bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-primary-700">
                        Log in
                    </router-link>


                </div>

                <!-- Mobile Hamburger -->
                <div class="md:hidden flex items-center text-gray-700 hover:text-primary-600">
                    <button @click="toggleMobileMenu" class="text-gray-700 hover:text-black focus:outline-none">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Mobile Menu -->
            <div v-if="isMobileMenuOpen" class="md:hidden space-y-4 pb-4">
                <nav class="flex flex-col space-y-2">
                    <a href="#" class="text-sm text-gray-700 hover:text-primary-600">Shots</a>
                    <a href="#" class="text-sm text-gray-700 hover:text-primary-600">Explore</a>
                    <a href="#" class="text-sm text-gray-700 hover:text-primary-600">Blog</a>
                </nav>

                <div class="flex flex-col space-y-2 pt-4">
                    <input type="text" placeholder="Search..."
                        class="pl-4 pr-4 py-2 text-sm border border-gray-300 rounded-full" />
                    <button @click="router.push('/signup')"
                        class="border border-primary-600 text-sm font-medium text-primary-600 px-4 py-2 rounded-full text-center hover:bg-primary-100">
                        Signup
                    </button>
                    <button @click="router.push('/login')"
                        class="bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-full text-center hover:bg-primary-700">
                        Log in
                    </button>
                </div>
            </div>
        </div>
    </header>
</template>

<style scoped></style>

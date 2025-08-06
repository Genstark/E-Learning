<!-- eslint-disable vue/multi-word-component-names -->
<!-- SignupPage.vue -->
<script setup>
import { ref } from 'vue';

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

function handleSignup() {
    if (password.value !== confirmPassword.value) {
        alert('Passwords do not match!');
        return;
    }

    console.log('Signup data:', {
        name: name.value,
        email: email.value,
        password: password.value,
    });
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <h2 class="text-2xl font-bold mb-6 text-center">Sign Up</h2>
            <form @submit.prevent="handleSignup" class="space-y-4">
                <input type="text" v-model="name" placeholder="Full Name"
                    class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-pink-200" />
                <input type="email" v-model="email" placeholder="Email"
                    class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-pink-200" />
                <input type="password" v-model="password" placeholder="Password"
                    class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-pink-200" />
                <input type="password" v-model="confirmPassword" placeholder="Confirm Password"
                    class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-pink-200" />
                <button type="submit"
                    class="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 rounded-md">
                    Sign Up
                </button>
            </form>
            <p class="text-sm mt-4 text-center">
                Already have an account?
                <router-link to="/login" class="text-pink-500 hover:underline">Log In</router-link>
            </p>
        </div>
    </div>
</template>

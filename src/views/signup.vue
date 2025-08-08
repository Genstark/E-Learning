<!-- eslint-disable vue/multi-word-component-names -->
<!-- SignupPage.vue -->
<script setup>
import Header from '@/components/Header.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);

async function handleSignup() {
    // Basic validation
    if (!name.value || !email.value || !password.value || !confirmPassword.value) {
        alert('Please fill in all fields.');
        return;
    }

    // Password confirmation check
    if (password.value !== confirmPassword.value) {
        alert('Passwords do not match.');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        alert('Please enter a valid email address.');
        return;
    }

    isLoading.value = true;

    try {
        // Send the signup request to the server
        const signupData = {
            name: name.value,
            email: email.value,
            password: password.value,
        };

        const apiUrl = 'http://localhost:3000/api/signup'; // Make sure your backend is running on this port
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData)
        });

        const data = await response.json();
        
        if (data.ok) {
            alert(`Signup successful! Welcome, ${data.message}!`);
            name.value = '';
            email.value = '';
            password.value = '';
            confirmPassword.value = '';
            router.push('/login');
        } else {
            alert(`Signup failed: ${data.message || 'Unknown error'}`);
        }
    } catch (error) {
        alert('An error occurred while signing up. Please try again later.');
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <Header />
    <!-- Page Centering -->
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <h2 class="text-2xl font-bold mb-6 text-center">Sign Up</h2>
            <div class="space-y-4">
                <input 
                    type="text" 
                    v-model="name" 
                    placeholder="Full Name"
                    :disabled="isLoading"
                    class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-pink-200 disabled:opacity-50" 
                />
                <input 
                    type="email" 
                    v-model="email" 
                    placeholder="Email"
                    :disabled="isLoading"
                    class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-pink-200 disabled:opacity-50" 
                />
                <input 
                    type="password" 
                    v-model="password" 
                    placeholder="Password"
                    :disabled="isLoading"
                    class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-pink-200 disabled:opacity-50" 
                />
                <input 
                    type="password" 
                    v-model="confirmPassword" 
                    placeholder="Confirm Password"
                    :disabled="isLoading"
                    class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-pink-200 disabled:opacity-50" 
                />
                <button 
                    @click="handleSignup"
                    :disabled="isLoading"
                    class="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {{ isLoading ? 'Signing Up...' : 'Sign Up' }}
                </button>
            </div>
            <p class="text-sm mt-4 text-center">
                Already have an account?
                <router-link to="/login" class="text-pink-500 hover:underline">Log In</router-link>
            </p>
        </div>
    </div>
</template>
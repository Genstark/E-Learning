<!-- eslint-disable vue/multi-word-component-names -->
<!-- LoginPage.vue -->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();
async function handleLogin() {
	// Simulate successful login
	if (!email.value || !password.value) {
		alert('Please fill in all fields.');
		return;
	}
	const response = await fetch('http://localhost:3000/api/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			email: email.value,
			password: password.value
		})
	});
	if (response.ok) {
		router.push('/'); // or wherever you want to redirect
	} else {
		alert('Login failed. Please check your credentials.');
	}
}
</script>

<template>
	<div class="min-h-screen flex items-center justify-center bg-gray-100">
		<div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
			<h2 class="text-2xl font-bold mb-6 text-center">Log In</h2>
			<form @submit.prevent="handleLogin" class="space-y-4">
				<input type="email" v-model="email" placeholder="Email" class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-primary-200" />
				<input type="password" v-model="password" placeholder="Password" class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-primary-200" />
				<button type="submit"
					class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-md">
					Log In
				</button>
			</form>
			<p class="text-sm mt-4 text-center">
				Don't have an account?
				<router-link to="/signup" class="text-primary-600 hover:underline">Sign Up</router-link>
			</p>
		</div>
	</div>
</template>

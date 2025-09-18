<!-- eslint-disable vue/multi-word-component-names -->
<!-- LoginPage.vue -->
<script setup>
import Header from '../components/Header.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { onUnmounted } from 'vue';

const email = ref('');
const password = ref('');
const isLoading = ref(false); // 🔥 loading state
const router = useRouter();

async function handleLogin() {
	// Simulate successful login
	if (!email.value || !password.value) {
		alert('Please fill in all fields.');
		return;
	}

	isLoading.value = true; // start loading
	try {
		const response = await fetch(`${process.env.VUE_APP_URL}/api/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: email.value,
				password: password.value
			}),
			credentials: 'include'
		});

		if (response.ok) {
			const data = await response.json();
			localStorage.setItem('user', data.user);
			alert(`Login successful! Welcome back!`);
			email.value = '';
			password.value = '';
			router.push({ name: 'user-home', params: { id: data.user } });
		} else if (response.status === 401) {
			alert('Invalid email or password. Please try again.');
		} else {
			alert('Login failed. Please check your credentials.');
		}
	} catch (err) {
		console.error(err);
		alert('Something went wrong. Try again.');
	} finally {
		isLoading.value = false; // stop loading
	}
}

onUnmounted(() => {
	console.log('Login component unmounted');
});
</script>

<template>
	<Header />
	<div class="min-h-screen flex items-center justify-center bg-gray-100">
		<div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
			:class="{ 'cursor-not-allowed opacity-50': isLoading }">
			<form @submit.prevent="handleLogin" class="space-y-4">
				<input type="email" v-model="email" placeholder="Email"
					class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-primary-200" />
				<input type="password" v-model="password" placeholder="Password"
					class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-primary-200" />

				<!-- Button -->
				<button type="submit" :disabled="isLoading"
					class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-md flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed">

					<span v-if="!isLoading">Log In</span>
					<!-- Loading spinner -->
					<svg v-else class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
						viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
						</circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
					</svg>
				</button>
			</form>

			<p class="text-sm mt-4 text-center">
				Don't have an account?
				<router-link to="/signup" class="text-primary-600 hover:underline">Sign Up</router-link>
			</p>
		</div>
	</div>
</template>

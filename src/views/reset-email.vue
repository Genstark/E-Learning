<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isConfirmed = ref(false);
const buttonConfirmation_visible = ref(true);
const userEmail = ref('');
const userName = ref('');
const newEmail = ref('');
const confirmEmail = ref('');
const buttonReset_visible = ref(false);

async function checkConfirmation() {
    console.log('Checking confirmation for:', userEmail.value, userName.value);
    const response = await fetch(`${process.env.VUE_APP_URL}/reset-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userEmail: userEmail.value,
            userName: userName.value,
            task: 'confirmation'
        }),
        credentials: 'include'
    });
    const data = await response.json();
    buttonConfirmation_visible.value = false;
    if (data.ok) {
        isConfirmed.value = true;
        buttonReset_visible.value = true;
    } else {
        alert('Email and username do not match. Please try again.');
        buttonConfirmation_visible.value = true;
    }
}

async function resetEmail() {
    if (newEmail.value !== confirmEmail.value) {
        alert('Email do not match!');
        return;
    }
    console.log('Resetting password for:', userEmail.value, userName.value);
    const response = await fetch(`${process.env.VUE_APP_URL}/reset-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userEmail: userEmail.value,
            userName: userName.value,
            newEmail: newEmail.value,
            confirmEmail: confirmEmail.value,
            task: 'resetEmail'
        }),
        credentials: 'include'
    });
    const data = await response.json();
    if (data.ok) {
        alert('Email reset successfull! Please log in with your new Email.');
        // Redirect to login page
        router.push('/login');
    } else {
        alert('Failed to reset password. Please try again.');
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="bg-white p-8 rounded shadow-md w-full max-w-md">
            <h2 class="text-2xl font-bold mb-6 text-center">Reset Email</h2>
            <form @submit.prevent class="space-y-4">
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" required
                        class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-primary-200"
                        v-model="userEmail" />
                </div>
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700">User Name</label>
                    <input type="text" required
                        class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-primary-200"
                        v-model="userName" />
                </div>
                <div v-if="isConfirmed">
                    <label for="new-password" class="block text-sm font-medium text-gray-700">New Email</label>
                    <input type="email" id="new-password" required v-model="newEmail"
                        class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-primary-200" />
                </div>

                <div v-if="isConfirmed">
                    <label for="confirm-password" class="block text-sm font-medium text-gray-700">Confirm
                        Email</label>
                    <input type="email" required v-model="confirmEmail"
                        class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-primary-200" />
                </div>
                <button type="button" @click="checkConfirmation" v-if="buttonConfirmation_visible"
                    class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-md">Check
                    Confirmation</button>

                <button type="button" @click="resetEmail" v-if="buttonReset_visible"
                    class="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-md">Reset
                    Password</button>
            </form>
        </div>
    </div>
</template>
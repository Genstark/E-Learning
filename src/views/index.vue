<!-- eslint-disable vue/multi-word-component-names -->

<template>
	<HelloWorld />
	<button class="border-dotted" @click="change">click</button>
</template>

<script setup>
import HelloWorld from '@/components/HelloWorld.vue';
import { useRouter } from 'vue-router';

const route = useRouter();

function change (event) {
	event.preventDefault();
	console.log('Change button clicked');
	route.push('/about');
}
</script>

<!-- eslint-disable vue/multi-word-component-names -->

<template>
	<div class="home">
		<HelloWorld />
		<p @click="change">change</p>
		<button class="text-white">click</button>
	</div>
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

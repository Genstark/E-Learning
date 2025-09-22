<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <HeaderComponent />
    <Cards :cards="cards" />
</template>

<script setup>
import HeaderComponent from '@/components/Header.vue';
import Cards from '@/components/Cards.vue';
import numberBowling from '../../public/images/numberBowlingGame.png';
import { onUnmounted } from 'vue';

const cards = [
    {
        title: 'Number Bowling',
        description: 'Practice your skills with engaging exercises.',
        image: numberBowling,
        page: { name: 'number-bowling-id', params: { id: localStorage.getItem('user') } }
    },
    {
        title: 'Library',
        description: 'Explore interactive lessons and expand your knowledge.',
        page: '/library',
        image: 'https://engage-dev1.comprodls.com/'
        // image: 'https://img.freepik.com/free-vector/student-studying-online-isometric-illustration_52683-79996.jpg?w=740&T=ST=1700000000~EXP=1700000000~HMAC=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy'
    },
    {
        title: 'Daily Task',
        description: 'Complete the assigned tasks and quizzes.',
        image: 'https://img.freepik.com/free-vector/online-learning-isometric-landing-page_52683-51940.jpg?w=740&T=ST=1700000000~EXP=1700000000~HMAC=zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz',
        page: { name: 'task-id', params: { id: localStorage.getItem('user') } }
    },
];

onUnmounted(() => {
    console.log('Index component unmounted');
});
</script>

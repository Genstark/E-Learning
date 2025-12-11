<!-- eslint-disable vue/multi-word-component-names -->
<template>
    <HeaderComponent />
    <Cards :cards="cards" />
    <!-- <Footer /> -->
</template>

<script setup>
import HeaderComponent from '@/components/Header.vue';
// import Footer from '@/components/Footer.vue';
import Cards from '@/components/Cards.vue';
import numberBowling from '../../public/images/numberBowlingGame.png';
import taskimage from '../../public/images/green-page.jpg';
import library from '../../public/images/library.jpg';
import { onUnmounted } from 'vue';

const cards = [
    {
        title: 'Number Bowling',
        description: 'Practice your skills with engaging exercises.',
        image: numberBowling,
        page: { name: 'number-bowling-id', params: { id: localStorage.getItem('user') } },
        blank: false
    },
    {
        title: 'Library',
        description: 'Explore interactive lessons and expand your knowledge.',
        page: 'https://engage-dev1.comprodls.com/',
        image: library,
        blank: true
        // image: 'https://img.freepik.com/free-vector/student-studying-online-isometric-illustration_52683-79996.jpg?w=740&T=ST=1700000000~EXP=1700000000~HMAC=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy'
    },
    {
        title: 'Daily Task',
        description: 'Complete the assigned tasks and quizzes.',
        // public/ files are copied to the project root on build — reference them from the root
        image: taskimage,
        page: { name: 'task-id', params: { id: localStorage.getItem('user') } },
        blank: false
    },
];

onUnmounted(() => {
    console.log('Index component unmounted');
});
</script>

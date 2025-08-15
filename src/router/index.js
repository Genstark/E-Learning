import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/index.vue';

const routes = [
	{
		path: '/',
		name: 'home',
		component: HomeView
	},
	{
		path: '/about',
		name: 'about',
		component: () => import('../views/about.vue')
	},
	{
		path: '/login',
		name: 'login',
		component: () => import('../views/login.vue')
	},
	{
		path: '/signup',
		name: 'signup',
		component: () => import('../views/signup.vue')
	},
	{
		path: '/number-bowling',
		name: 'number-bowling',
		component: () => import('../views/numberbowling.vue')
	}
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
});

router.beforeEach(async (to, from, next) => {
    const token = localStorage.getItem('token');
    if (!token) {
        if (to.path === '/login') {
            return next();
        } else {
            return next({ path: '/login' });
        }
    }
    try {
        const response = await fetch('/api/validate-token', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.ok) {
            return next();
        } else {
            return next({ path: '/login' });
        }
    } catch (error) {
        return next({ path: '/login' });
    }
});

export default router;
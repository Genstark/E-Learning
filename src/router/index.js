import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/index.vue';
// import path from 'path';

const routes = [
	{
		path: '/',
		name: 'home',
		component: HomeView,
        children: [
            {
                path: '/:id ',
                name: 'user-home',
                component: HomeView
            }
        ]
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
		component: () => import('../views/numberbowling.vue'),
        children: [
            {
                path: '/:id/number-bowling',
                name: 'number-bowling-id',
                component: () => import('../views/numberbowling.vue')
            }
        ]
	},
	{
		path: '/task',
		name: 'task',
		component: () => import('../views/task.vue'),
        children: [
            {
                path: '/:id/task',
                name: 'task-id',
                component: () => import('../views/task.vue')
            }
        ]
	},
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
});


// function getCookie(name) {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop().split(';').shift();
//     return null;
// }

router.beforeEach(async (to, from, next) => {
    const token = localStorage.getItem('token');
    // const token = getCookie('token');
    // console.log('cookies', getCookie('token'));
    console.log("Navigating to:", to.path);
    console.log("Current token:", token);

    // Agar user login page par ja raha hai, guard skip karo
    if (to.path === '/login') {
        return next();
    }

    // Agar token nahi hai, login par bhejo (sirf agar already login par nahi ho)
    if (!token) {
        if (to.path !== '/login' && to.path !== '/signup') {
            return next({ path: '/login' });
        } else {
            return next();
        }
    }

    try {
        console.log("Validating token:", token);
        const response = await fetch('http://localhost:3000/api/validate-token', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            method: 'GET',
            // agar aap cookie based token bhi bhejna chahte ho:
            credentials: 'include'
        });

        if (response.status === 200 || response.status === 201) {
            console.log("Token is valid, proceeding to");
            const data = await response.json();
            console.log("User data:", data.user);
            return next();
        } else {
            console.warn("Invalid token, cleaning up...");

            // 🔹 LocalStorage se remove karo
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // 🔹 Cookies se delete karo
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

            if (to.path !== '/login') {
                return next({ path: '/login' });
            } else {
                return next();
            }
        }
    } catch (error) {
        console.error("Error validating token:", error);
        // Cleanup on error bhi
        localStorage.removeItem('token');
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

        if (to.path !== '/login') {
            return next({ path: '/login' });
        } else {
            return next();
        }
    }
});

export default router;
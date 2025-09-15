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
	},
	{
		path: '/task',
		name: 'task',
		component: () => import('../views/task.vue')
	}
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
});

router.beforeEach(async (to, from, next) => {
    const token = localStorage.getItem('token');
    console.log("Navigating to:", token);

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

        if (response.ok) {
            console.log("Token is valid, proceeding to");
            const data = await response.json();
            console.log("User data:", data.user);
            return next();
        } else {
            console.warn("Invalid token, cleaning up...");

            // 🔹 LocalStorage se remove karo
            localStorage.removeItem('token');

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
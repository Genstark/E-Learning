import { createRouter, createWebHistory } from 'vue-router';
// import Cookies from "js-cookie";
// import path from 'path';

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('../views/index.vue'),
    },
    {
        path: '/:id',
        name: 'user-home',
        component: () => import('../views/index.vue'),
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
		path: '/:id/number-bowling',
		name: 'number-bowling-id',
		component: () => import('../views/numberbowling.vue')
	},
	{
		path: '/:id/task',
		name: 'task-id',
		component: () => import('../views/task.vue')
	},
];

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
});


function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

router.beforeEach(async (to, from, next) => {
    // const token = getCookie('token') ? getCookie('token') : localStorage.getItem('token');
    const token = getCookie('token');
    console.log('🔐 Router Guard - Navigating to:', to.path);
    console.log('🍪 Token from cookies:', getCookie('token'));
    console.log('🔑 Current token:', token);

    // Agar user login page par ja raha hai, guard skip karo
    if (to.path === '/login') {
        console.log('✅ Skipping guard for login page');
        return next();
    }

    if (to.path === '/') {
        console.log('✅ Skipping guard for home page');
        return next({path: '/login'});
    }

    // Agar token nahi hai, login par bhejo (sirf agar already login par nahi ho)
    if (!token) {
        console.log('❌ No token found, redirecting to login');
        if (to.path !== '/login' && to.path !== '/signup') {
            return next({ path: '/login' });
        } else {
            return next();
        }
    }

    try {
        console.log('🔍 Validating token with server...');
        const response = await fetch(`${process.env.VUE_APP_URL}/validate-token`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            method: 'GET',
            // agar aap cookie based token bhi bhejna chahte ho:
            credentials: 'include'
        });

        console.log('📊 Token validation response status:', response.status);
        if (response.ok) {
            // const data = await response.json();
            console.log('✅ Token is valid');
            return next();
        } else {
            console.log('❌ Token invalid, cleaning up...');

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
        console.error("🚨 Error validating token:", error);
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
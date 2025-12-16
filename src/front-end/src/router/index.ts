import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomePage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginPage.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterPage.vue'),
    },
    {
      path: '/verify-2fa',
      name: 'verify-2fa',
      component: () => import('../views/Verify2FAPage.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfilePage.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

// Navigation guard for protected routes
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Try to load user first
    if (!authStore.user) {
      await authStore.loadUser();
    }

    if (!authStore.isAuthenticated) {
      next({ name: 'login', query: { redirect: to.fullPath } });
      return;
    }
  }

  next();
});

export default router;

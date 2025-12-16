import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/authService';
import type { User } from '../types';

/**
 * Authentication Store
 *
 * Manages user authentication state across the application
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => user.value !== null);

  async function loadUser() {
    try {
      loading.value = true;
      error.value = null;
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        user.value = response.data;
      }
    } catch (err: any) {
      if (err.response?.status !== 401) {
        error.value = err.response?.data?.error || 'Failed to load user';
      }
    } finally {
      loading.value = false;
    }
  }

  function setUser(userData: User) {
    user.value = userData;
  }

  async function logout() {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      user.value = null;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    loadUser,
    setUser,
    logout,
    clearError,
  };
});

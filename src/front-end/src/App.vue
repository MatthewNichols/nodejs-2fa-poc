<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';
import Toast from 'primevue/toast';
import Button from 'primevue/button';

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  authStore.loadUser();
});

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div id="app">
    <Toast />

    <header class="app-header">
      <div class="container">
        <h1 class="logo">🔐 2FA POC</h1>
        <nav class="nav">
          <router-link to="/" class="nav-link">Home</router-link>
          <template v-if="!authStore.isAuthenticated">
            <router-link to="/login" class="nav-link">Login</router-link>
            <router-link to="/register" class="nav-link">Register</router-link>
          </template>
          <template v-else>
            <router-link to="/profile" class="nav-link">Profile</router-link>
            <Button @click="handleLogout" label="Logout" severity="secondary" size="small" />
          </template>
        </nav>
      </div>
    </header>

    <main class="app-main">
      <div class="container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f5f5f5;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  width: 100%;
}

.app-header {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;

  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
  }

  .nav {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .nav-link {
    text-decoration: none;
    color: #666;
    font-weight: 500;
    transition: color 0.2s;

    &:hover {
      color: #333;
    }

    &.router-link-active {
      color: #10b981;
    }
  }
}

.app-main {
  flex: 1;
  padding: 2rem 0;
}
</style>

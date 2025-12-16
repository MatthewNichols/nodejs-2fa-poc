<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
</script>

<template>
  <div class="home-page">
    <Card class="welcome-card">
      <template #header>
        <div class="card-header">
          <i class="pi pi-shield" style="font-size: 3rem; color: #10b981"></i>
        </div>
      </template>
      <template #title>Node.js 2FA POC</template>
      <template #subtitle>Two-Factor Authentication Demonstration</template>
      <template #content>
        <div v-if="authStore.isAuthenticated" class="authenticated-content">
          <p>Welcome back, <strong>{{ authStore.user?.username }}</strong>!</p>
          <p class="mt-3">This application demonstrates:</p>
          <ul class="feature-list">
            <li>Passport.js authentication with Express sessions</li>
            <li>TOTP 2FA (Google Authenticator, Authy, etc.)</li>
            <li>SMS 2FA with Twilio (abstracted for easy provider swap)</li>
            <li>User profiles with PostgreSQL + Prisma</li>
            <li>Vue 3 with Composition API and PrimeVue</li>
          </ul>
          <div class="actions mt-4">
            <Button label="Go to Profile" icon="pi pi-user" @click="router.push('/profile')" />
          </div>
        </div>
        <div v-else class="unauthenticated-content">
          <p>This is a proof-of-concept demonstrating two-factor authentication in a Node.js application.</p>
          <p class="mt-3">Features:</p>
          <ul class="feature-list">
            <li><strong>TOTP 2FA:</strong> Use authenticator apps like Google Authenticator</li>
            <li><strong>SMS 2FA:</strong> Receive verification codes via SMS</li>
            <li><strong>Flexible:</strong> Enable one or both 2FA methods</li>
            <li><strong>Abstracted SMS:</strong> Easy to swap Twilio for another provider</li>
          </ul>
          <div class="actions mt-4">
            <Button label="Login" icon="pi pi-sign-in" @click="router.push('/login')" class="mr-2" />
            <Button label="Register" icon="pi pi-user-plus" @click="router.push('/register')" severity="secondary" />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.home-page {
  max-width: 800px;
  margin: 0 auto;
}

.welcome-card {
  .card-header {
    padding: 2rem;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}

.feature-list {
  margin-left: 1.5rem;
  margin-top: 1rem;

  li {
    margin-bottom: 0.5rem;
  }
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.mt-3 {
  margin-top: 1rem;
}

.mt-4 {
  margin-top: 1.5rem;
}

.mr-2 {
  margin-right: 0.5rem;
}
</style>

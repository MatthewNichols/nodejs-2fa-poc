<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { authService } from '../services/authService';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const username = ref('');
const password = ref('');
const loading = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please enter username and password',
      life: 3000,
    });
    return;
  }

  try {
    loading.value = true;
    const response = await authService.login({
      username: username.value,
      password: password.value,
    });

    if (response.success && response.data) {
      if (response.data.requires2FA) {
        // Redirect to 2FA verification
        router.push('/verify-2fa');
      } else {
        // Login successful without 2FA
        if (response.data.user) {
          await authStore.loadUser();
        }
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Login successful',
          life: 3000,
        });
        router.push('/profile');
      }
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Login Failed',
      detail: error.response?.data?.error || 'Invalid credentials',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <Card class="login-card">
      <template #title>
        <i class="pi pi-sign-in"></i> Login
      </template>
      <template #subtitle>Sign in to your account</template>
      <template #content>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="field">
            <label for="username">Username</label>
            <InputText id="username" v-model="username" placeholder="Enter username" class="w-full" />
          </div>

          <div class="field">
            <label for="password">Password</label>
            <Password
              id="password"
              v-model="password"
              placeholder="Enter password"
              :feedback="false"
              toggleMask
              class="w-full"
            />
          </div>

          <Button type="submit" label="Login" icon="pi pi-sign-in" :loading="loading" class="w-full" />

          <div class="register-link">
            Don't have an account?
            <router-link to="/register">Register here</router-link>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  max-width: 450px;
  margin: 0 auto;
}

.login-card {
  .p-card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.login-form {
  .field {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }
  }

  .w-full {
    width: 100%;
  }

  .register-link {
    margin-top: 1.5rem;
    text-align: center;
    color: #666;

    a {
      color: #10b981;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>

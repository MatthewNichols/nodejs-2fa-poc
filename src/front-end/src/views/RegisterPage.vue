<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';

const router = useRouter();
const toast = useToast();

const email = ref('');
const username = ref('');
const password = ref('');
const phoneNumber = ref('');
const loading = ref(false);

const handleRegister = async () => {
  if (!email.value || !username.value || !password.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please fill in all required fields',
      life: 3000,
    });
    return;
  }

  try {
    loading.value = true;
    const response = await authService.register({
      email: email.value,
      username: username.value,
      password: password.value,
      phoneNumber: phoneNumber.value || undefined,
    });

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Registration successful! Please login.',
        life: 3000,
      });
      router.push('/login');
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Registration Failed',
      detail: error.response?.data?.error || 'Registration failed',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="register-page">
    <Card class="register-card">
      <template #title>
        <i class="pi pi-user-plus"></i> Register
      </template>
      <template #subtitle>Create a new account</template>
      <template #content>
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="field">
            <label for="email">Email *</label>
            <InputText id="email" v-model="email" type="email" placeholder="Enter email" class="w-full" />
          </div>

          <div class="field">
            <label for="username">Username *</label>
            <InputText id="username" v-model="username" placeholder="Enter username" class="w-full" />
          </div>

          <div class="field">
            <label for="password">Password *</label>
            <Password id="password" v-model="password" placeholder="Enter password" toggleMask class="w-full" />
          </div>

          <div class="field">
            <label for="phoneNumber">Phone Number (optional)</label>
            <InputText
              id="phoneNumber"
              v-model="phoneNumber"
              placeholder="+15551234567"
              class="w-full"
            />
            <small class="field-hint">E.164 format required for SMS 2FA (e.g., +15551234567)</small>
          </div>

          <Button type="submit" label="Register" icon="pi pi-user-plus" :loading="loading" class="w-full" />

          <div class="login-link">
            Already have an account?
            <router-link to="/login">Login here</router-link>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.register-page {
  max-width: 450px;
  margin: 0 auto;
}

.register-card {
  .p-card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.register-form {
  .field {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .field-hint {
      display: block;
      margin-top: 0.25rem;
      color: #666;
      font-size: 0.875rem;
    }
  }

  .w-full {
    width: 100%;
  }

  .login-link {
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

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { authService } from '../services/authService';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import SelectButton from 'primevue/selectbutton';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const verificationCode = ref('');
const method = ref<'2fa-totp' | '2fa-sms'>('2fa-totp');
const loading = ref(false);
const resending = ref(false);

const methodOptions = [
  { label: 'Authenticator App', value: '2fa-totp' },
  { label: 'SMS Code', value: '2fa-sms' },
];

const handleVerify = async () => {
  if (!verificationCode.value) {
    toast.add({
      severity: 'warn',
      summary: 'Validation Error',
      detail: 'Please enter verification code',
      life: 3000,
    });
    return;
  }

  try {
    loading.value = true;
    const response = await authService.verify2FA({
      code: verificationCode.value,
      method: method.value,
    });

    if (response.success) {
      await authStore.loadUser();
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: '2FA verification successful',
        life: 3000,
      });
      router.push('/profile');
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Verification Failed',
      detail: error.response?.data?.error || 'Invalid verification code',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

const handleResendSMS = async () => {
  try {
    resending.value = true;
    const response = await authService.resendSms();

    if (response.success) {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'SMS code resent',
        life: 3000,
      });
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to resend code',
      life: 3000,
    });
  } finally {
    resending.value = false;
  }
};
</script>

<template>
  <div class="verify-page">
    <Card class="verify-card">
      <template #title>
        <i class="pi pi-shield"></i> Two-Factor Authentication
      </template>
      <template #subtitle>Enter your verification code</template>
      <template #content>
        <form @submit.prevent="handleVerify" class="verify-form">
          <div class="field">
            <label>Verification Method</label>
            <SelectButton v-model="method" :options="methodOptions" optionLabel="label" optionValue="value" class="w-full" />
          </div>

          <div class="field">
            <label for="code">Verification Code</label>
            <InputText
              id="code"
              v-model="verificationCode"
              placeholder="Enter 6-digit code"
              class="w-full"
              maxlength="8"
            />
            <small v-if="method === '2fa-totp'" class="field-hint">
              Enter the code from your authenticator app
            </small>
            <small v-else class="field-hint">
              Enter the code sent to your phone via SMS
            </small>
          </div>

          <Button type="submit" label="Verify" icon="pi pi-check" :loading="loading" class="w-full" />

          <div v-if="method === '2fa-sms'" class="resend-section">
            <Button
              label="Resend SMS Code"
              icon="pi pi-refresh"
              severity="secondary"
              text
              :loading="resending"
              @click="handleResendSMS"
              class="w-full"
            />
          </div>

          <div class="back-link">
            <router-link to="/login">Back to login</router-link>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<style lang="scss" scoped>
.verify-page {
  max-width: 500px;
  margin: 0 auto;
}

.verify-card {
  .p-card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.verify-form {
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

  .resend-section {
    margin-top: 1rem;
  }

  .back-link {
    margin-top: 1.5rem;
    text-align: center;

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

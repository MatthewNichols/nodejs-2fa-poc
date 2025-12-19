<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { authService } from '../services/authService';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Message from 'primevue/message';
import Image from 'primevue/image';

const authStore = useAuthStore();
const toast = useToast();

const phoneNumber = ref('');
const bio = ref('');
const loading = ref(false);

// TOTP setup
const showTotpSetup = ref(false);
const totpQrCode = ref('');
const totpBackupCodes = ref<string[]>([]);
const totpVerificationCode = ref('');
const totpLoading = ref(false);

// SMS setup
const showSmsSetup = ref(false);
const smsVerificationCode = ref('');
const smsLoading = ref(false);

const userProfile = computed(() => authStore.user);

onMounted(async () => {
  await loadProfile();
});

const loadProfile = async () => {
  await authStore.loadUser();
  if (authStore.user) {
    phoneNumber.value = authStore.user.phoneNumber || '';
    bio.value = authStore.user.bio || '';
  }
};

// Profile update
const handleUpdateProfile = async () => {
  try {
    loading.value = true;
    const response = await authService.updateProfile({
      phoneNumber: phoneNumber.value || undefined,
      bio: bio.value || undefined,
    });

    if (response.success) {
      await authStore.loadUser();
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Profile updated successfully',
        life: 3000,
      });
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to update profile',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
};

// TOTP management
const handleSetupTotp = async () => {
  try {
    const response = await authService.setupTotp();
    if (response.success && response.data) {
      totpQrCode.value = response.data.qrCode;
      totpBackupCodes.value = response.data.backupCodes;
      showTotpSetup.value = true;
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to setup TOTP',
      life: 3000,
    });
  }
};

const handleVerifyTotp = async () => {
  try {
    totpLoading.value = true;
    const response = await authService.verifyTotp(totpVerificationCode.value);

    if (response.success) {
      await authStore.loadUser();
      showTotpSetup.value = false;
      totpVerificationCode.value = '';
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'TOTP 2FA enabled successfully',
        life: 3000,
      });
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Invalid verification code',
      life: 3000,
    });
  } finally {
    totpLoading.value = false;
  }
};

const downloadBackupCodes = () => {
  const currentDate = new Date().toISOString().split('T')[0];
  const content = `2FA Backup Codes - Generated ${currentDate}\n\n` +
    `IMPORTANT: Store these codes in a safe place.\n` +
    `Each code can only be used once.\n\n` +
    `Backup Codes:\n` +
    totpBackupCodes.value.map((code, index) => `${index + 1}. ${code}`).join('\n') +
    `\n\nThese codes can be used to access your account if you lose your authenticator device.`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `2fa-backup-codes-${currentDate}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const handleDisableTotp = async () => {
  if (!confirm('Are you sure you want to disable TOTP 2FA?')) return;

  try {
    const response = await authService.disableTotp();
    if (response.success) {
      await authStore.loadUser();
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'TOTP 2FA disabled',
        life: 3000,
      });
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to disable TOTP',
      life: 3000,
    });
  }
};

// SMS management
const handleSetupSms = async () => {
  if (!phoneNumber.value) {
    toast.add({
      severity: 'warn',
      summary: 'Warning',
      detail: 'Please add a phone number to your profile first',
      life: 3000,
    });
    return;
  }

  try {
    const response = await authService.setupSms();
    if (response.success) {
      showSmsSetup.value = true;
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Verification code sent to your phone',
        life: 3000,
      });
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to send SMS',
      life: 3000,
    });
  }
};

const handleVerifySms = async () => {
  try {
    smsLoading.value = true;
    const response = await authService.verifySms(smsVerificationCode.value);

    if (response.success) {
      await authStore.loadUser();
      showSmsSetup.value = false;
      smsVerificationCode.value = '';
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'SMS 2FA enabled successfully',
        life: 3000,
      });
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Invalid verification code',
      life: 3000,
    });
  } finally {
    smsLoading.value = false;
  }
};

const handleDisableSms = async () => {
  if (!confirm('Are you sure you want to disable SMS 2FA?')) return;

  try {
    const response = await authService.disableSms();
    if (response.success) {
      await authStore.loadUser();
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'SMS 2FA disabled',
        life: 3000,
      });
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'Failed to disable SMS 2FA',
      life: 3000,
    });
  }
};
</script>

<template>
  <div class="profile-page">
    <h1 class="page-title">User Profile</h1>

    <div class="cards-grid">
      <!-- Profile Information -->
      <Card class="profile-card">
        <template #title>Profile Information</template>
        <template #content>
          <div class="profile-info">
            <div class="info-row">
              <strong>Username:</strong> {{ userProfile?.username }}
            </div>
            <div class="info-row">
              <strong>Email:</strong> {{ userProfile?.email }}
            </div>

            <div class="field">
              <label for="phoneNumber">Phone Number</label>
              <InputText
                id="phoneNumber"
                v-model="phoneNumber"
                placeholder="+15551234567"
                class="w-full"
              />
              <small class="field-hint">E.164 format (e.g., +15551234567)</small>
            </div>

            <div class="field">
              <label for="bio">Bio</label>
              <Textarea
                id="bio"
                v-model="bio"
                rows="4"
                placeholder="Tell us about yourself..."
                class="w-full"
              />
            </div>

            <Button
              label="Update Profile"
              icon="pi pi-save"
              :loading="loading"
              @click="handleUpdateProfile"
            />
          </div>
        </template>
      </Card>

      <!-- 2FA Settings -->
      <Card class="totp-card">
        <template #title>Two-Factor Authentication</template>
        <template #content>
          <!-- TOTP Section -->
          <div class="twofa-section">
            <div class="twofa-header">
              <div class="twofa-title">
                <i class="pi pi-mobile"></i>
                <span>Authenticator App (TOTP)</span>
              </div>
              <div class="twofa-status">
                <Message
                  v-if="userProfile?.totpEnabled"
                  severity="success"
                  :closable="false"
                >
                  Enabled
                </Message>
                <Message v-else severity="warn" :closable="false">
                  Disabled
                </Message>
              </div>
            </div>
            <p class="twofa-description">
              Use apps like Google Authenticator or Authy to generate verification codes.
            </p>
            <div class="twofa-actions">
              <Button
                v-if="!userProfile?.totpEnabled"
                label="Enable TOTP"
                icon="pi pi-plus"
                @click="handleSetupTotp"
              />
              <Button
                v-else
                label="Disable TOTP"
                icon="pi pi-times"
                severity="danger"
                @click="handleDisableTotp"
              />
            </div>
          </div>

          <div class="divider"></div>

          <!-- SMS Section -->
          <div class="twofa-section">
            <div class="twofa-header">
              <div class="twofa-title">
                <i class="pi pi-comments"></i>
                <span>SMS Verification</span>
              </div>
              <div class="twofa-status">
                <Message
                  v-if="userProfile?.smsEnabled"
                  severity="success"
                  :closable="false"
                >
                  Enabled
                </Message>
                <Message v-else severity="warn" :closable="false">
                  Disabled
                </Message>
              </div>
            </div>
            <p class="twofa-description">
              Receive verification codes via SMS to your registered phone number.
            </p>
            <div class="twofa-actions">
              <Button
                v-if="!userProfile?.smsEnabled"
                label="Enable SMS 2FA"
                icon="pi pi-plus"
                @click="handleSetupSms"
              />
              <Button
                v-else
                label="Disable SMS 2FA"
                icon="pi pi-times"
                severity="danger"
                @click="handleDisableSms"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- TOTP Setup Dialog -->
    <Dialog v-model:visible="showTotpSetup" header="Setup TOTP 2FA" :modal="true" :closable="false" style="width: 500px">
      <div class="setup-dialog">
        <p>1. Scan this QR code with your authenticator app:</p>
        <div class="qr-code-container">
          <Image :src="totpQrCode" alt="TOTP QR Code" width="250" />
        </div>

        <p class="mt-3">2. Save these backup codes in a safe place:</p>
        <div class="backup-codes">
          <code v-for="code in totpBackupCodes" :key="code">{{ code }}</code>
        </div>
        <div class="backup-actions">
          <Button
            label="Save as Text File"
            icon="pi pi-download"
            size="small"
            severity="secondary"
            @click="downloadBackupCodes"
          />
        </div>

        <p class="mt-3">3. Enter the code from your app to verify:</p>
        <InputText
          v-model="totpVerificationCode"
          placeholder="Enter 6-digit code"
          class="w-full"
        />

        <div class="dialog-actions">
          <Button
            label="Cancel"
            severity="secondary"
            @click="showTotpSetup = false"
          />
          <Button
            label="Verify & Enable"
            :loading="totpLoading"
            @click="handleVerifyTotp"
          />
        </div>
      </div>
    </Dialog>

    <!-- SMS Setup Dialog -->
    <Dialog v-model:visible="showSmsSetup" header="Verify SMS 2FA" :modal="true" style="width: 400px">
      <div class="setup-dialog">
        <p>Enter the verification code sent to your phone:</p>
        <InputText
          v-model="smsVerificationCode"
          placeholder="Enter 6-digit code"
          class="w-full mt-2"
        />

        <div class="dialog-actions">
          <Button
            label="Cancel"
            severity="secondary"
            @click="showSmsSetup = false"
          />
          <Button
            label="Verify & Enable"
            :loading="smsLoading"
            @click="handleVerifySms"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 2rem;
  color: #333;
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.profile-info {
  .info-row {
    padding: 0.75rem 0;
    border-bottom: 1px solid #eee;
    margin-bottom: 1rem;

    strong {
      color: #666;
      margin-right: 0.5rem;
    }
  }

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
}

.twofa-section {
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.twofa-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.twofa-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #333;

  i {
    font-size: 1.25rem;
  }
}

.twofa-description {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.twofa-actions {
  display: flex;
  gap: 0.5rem;
}

.divider {
  height: 1px;
  background: #eee;
  margin: 1.5rem 0;
}

.setup-dialog {
  .qr-code-container {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
  }

  .backup-codes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin: 1rem 0;

    code {
      background: #f5f5f5;
      padding: 0.5rem;
      border-radius: 4px;
      text-align: center;
      font-family: monospace;
      color: #333;
      font-size: 14px;
      font-weight: 600;
      display: block;
    }
  }

  .backup-actions {
    display: flex;
    justify-content: center;
    margin-top: 0.75rem;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }

  .w-full {
    width: 100%;
  }

  .mt-2 {
    margin-top: 0.5rem;
  }

  .mt-3 {
    margin-top: 1rem;
  }
}
</style>

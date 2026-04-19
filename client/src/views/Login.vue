<template>
  <div class="login-shell">
    <div class="login-card">
      <div class="login-brand">
        <div class="login-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <div>
          <div class="login-title">面料管理系统</div>
          <div class="login-sub">请登录以继续</div>
        </div>
      </div>

      <el-form :model="form" @submit.prevent="doLogin" class="login-form">
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="用户名"
            prefix-icon="User"
            size="large"
            autofocus
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="doLogin"
          />
        </el-form-item>
        <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" style="margin-bottom:12px" />
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          style="width:100%"
          @click="doLogin"
        >
          登录
        </el-button>
      </el-form>

      <div class="login-guest">
        <el-button link @click="continueAsGuest">以访客身份浏览（只读）</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../api/index'
import { auth } from '../stores/auth'

const router = useRouter()
const form = ref({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function doLogin() {
  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { token, user } = await authApi.login(form.value)
    auth.login(token, user)
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function continueAsGuest() {
  localStorage.setItem('guest_acknowledged', 'true')
  router.push('/')
}
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-app);
  padding: 24px;
}
.login-card {
  width: 100%;
  max-width: 380px;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 36px 32px 28px;
  box-shadow: var(--shadow-lg);
}
.login-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.login-logo {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #D97757, #E8956F);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 14px rgba(217,119,87,0.4);
}
.login-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.login-sub {
  font-size: 13px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}
.login-form { margin-bottom: 0; }
.login-guest {
  text-align: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
</style>

<template>
  <el-config-provider :locale="epLocale">
    <!-- Mobile sidebar overlay -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />

    <div class="shell">
      <!-- ── Sidebar ── -->
      <aside class="sidebar" :class="{ 'sidebar-open': sidebarOpen }">
        <!-- Brand -->
        <div class="brand">
          <div class="brand-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">{{ $t('app.title') }}</span>
            <span class="brand-sub">{{ $t('app.subtitle') }}</span>
          </div>
        </div>

        <!-- Workspace Switcher -->
        <WorkspaceSwitcher />

        <!-- Nav -->
        <nav class="nav">
          <router-link to="/dashboard" class="nav-item" :class="{ active: $route.path === '/dashboard' }" @click="closeSidebar">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-7-7z"/>
            </svg>
            <span>{{ $t('nav.dashboard') }}</span>
          </router-link>

          <router-link to="/fabrics" class="nav-item" :class="{ active: $route.path === '/fabrics' }" @click="closeSidebar">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1z" clip-rule="evenodd"/>
            </svg>
            <span>{{ $t('nav.fabrics') }}</span>
          </router-link>

          <router-link to="/styles" class="nav-item" :class="{ active: $route.path.startsWith('/styles') }" @click="closeSidebar">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
            </svg>
            <span>{{ $t('nav.styles') }}</span>
          </router-link>

          <router-link to="/calc" class="nav-item" :class="{ active: $route.path === '/calc' }" @click="closeSidebar">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clip-rule="evenodd"/>
            </svg>
            <span>{{ $t('nav.calc') }}</span>
          </router-link>

          <div class="nav-section-label">{{ $t('nav.warehouse') }}</div>

          <router-link to="/stock/in" class="nav-item nav-sub" :class="{ active: $route.path === '/stock/in' }" @click="closeSidebar">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
            <span>{{ $t('nav.stock_in') }}</span>
          </router-link>

          <router-link to="/stock/out" class="nav-item nav-sub" :class="{ active: $route.path === '/stock/out' }" @click="closeSidebar">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <span>{{ $t('nav.stock_out') }}</span>
          </router-link>

          <div class="nav-divider"></div>

          <router-link to="/inventory" class="nav-item" :class="{ active: $route.path === '/inventory' }" @click="closeSidebar">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
            </svg>
            <span>{{ $t('nav.inventory') }}</span>
          </router-link>

          <router-link to="/timeline" class="nav-item" :class="{ active: $route.path === '/timeline' }" @click="closeSidebar">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
            </svg>
            <span>{{ $t('nav.timeline') }}</span>
          </router-link>

          <router-link to="/reports" class="nav-item" :class="{ active: $route.path === '/reports' }" @click="closeSidebar">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clip-rule="evenodd"/>
            </svg>
            <span>{{ $t('nav.reports') }}</span>
          </router-link>

          <router-link to="/backup" class="nav-item" :class="{ active: $route.path === '/backup' }" @click="closeSidebar">
            <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
              <path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 000 2h1a1 1 0 100-2H9z" clip-rule="evenodd"/>
            </svg>
            <span>{{ $t('nav.backup') }}</span>
          </router-link>

          <template v-if="auth.isAdmin.value">
            <div class="nav-divider"></div>
            <router-link to="/admin" class="nav-item" :class="{ active: $route.path === '/admin' }" @click="closeSidebar">
              <svg class="nav-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"/>
              </svg>
              <span>管理后台</span>
            </router-link>
          </template>
        </nav>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <!-- 用户信息 / 登出 -->
          <div v-if="auth.isLoggedIn.value" class="user-info-row">
            <span class="user-name">{{ auth.state.user.username }}</span>
            <el-tag size="small" :type="auth.isAdmin.value ? 'danger' : 'info'" style="margin-left:6px">
              {{ auth.isAdmin.value ? '管理员' : '普通' }}
            </el-tag>
            <button class="theme-btn logout-btn" @click="pwdDialogVisible = true" title="修改密码" style="margin-left:auto;padding:4px 6px">
              <svg class="theme-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clip-rule="evenodd"/>
              </svg>
            </button>
            <button class="theme-btn logout-btn" @click="handleLogout" title="退出登录" style="padding:4px 6px">
              <svg class="theme-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
          <div v-else class="guest-row">
            <span class="guest-label">访客模式</span>
            <router-link to="/login" class="login-link" @click="closeSidebar">登录</router-link>
          </div>
          <button class="theme-btn" @click="toggleLang" :title="$t('app.lang.' + (locale === 'zh' ? 'en' : 'zh'))">
            <svg class="theme-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389 21.034 21.034 0 01-.554-.6 19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.992a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.99A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clip-rule="evenodd"/>
            </svg>
            <span>{{ locale === 'zh' ? 'English' : '中文' }}</span>
          </button>
          <button class="theme-btn" @click="toggleTheme" :title="isDark ? $t('app.theme.switchLight') : $t('app.theme.switchDark')">
            <svg v-if="isDark" class="theme-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
            </svg>
            <svg v-else class="theme-icon" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
            <span>{{ isDark ? $t('app.theme.light') : $t('app.theme.dark') }}</span>
          </button>
        </div>
      </aside>

      <!-- ── Main ── -->
      <div class="main">
        <header class="topbar">
          <!-- Mobile hamburger -->
          <button class="topbar-menu-btn" @click="sidebarOpen = !sidebarOpen" aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
            </svg>
          </button>
          <div class="topbar-title">{{ $route.meta.titleKey ? $t($route.meta.titleKey) : $t('app.title') }}</div>
          <div class="topbar-breadcrumb">{{ $route.meta.descKey ? $t($route.meta.descKey) : '' }}</div>
        </header>
        <main class="content">
          <router-view :key="auth.state.currentWorkspaceId" />
        </main>
      </div>
    </div>

    <!-- ── Mobile Bottom Navigation ── -->
    <nav class="bottom-nav">
      <router-link to="/dashboard" class="bottom-nav-item" :class="{ active: $route.path === '/dashboard' || $route.path === '/' }" @click="closeSidebar">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 0 0-1.414 0l-7 7a1 1 0 0 0 1.414 1.414L4 10.414V17a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-6.586l.293.293a1 1 0 0 0 1.414-1.414l-7-7z"/>
        </svg>
        <span>{{ $t('nav.dashboard') }}</span>
      </router-link>
      <router-link to="/inventory" class="bottom-nav-item" :class="{ active: $route.path === '/inventory' }" @click="closeSidebar">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
        </svg>
        <span>{{ $t('nav.inventory') }}</span>
      </router-link>
      <button class="bottom-nav-item" :class="{ active: $route.path.startsWith('/stock') }" @click="toggleStockMenu">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 12a1 1 0 102 0V7.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 7.414V12zM15 8a1 1 0 10-2 0v4.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 12.586V8z"/>
        </svg>
        <span>{{ $t('nav.stock') }}</span>
      </button>
      <router-link to="/styles" class="bottom-nav-item" :class="{ active: $route.path.startsWith('/styles') }" @click="closeSidebar">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"/>
        </svg>
        <span>{{ $t('nav.styles') }}</span>
      </router-link>
      <button class="bottom-nav-item" :class="{ active: sidebarOpen }" @click="sidebarOpen = true">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
        </svg>
        <span>{{ $t('nav.more') }}</span>
      </button>
    </nav>

    <!-- Stock action sheet (mobile) -->
    <transition name="stock-fade">
      <div v-if="stockMenuOpen" class="stock-sheet-overlay" @click="stockMenuOpen = false">
        <div class="stock-sheet" @click.stop>
          <div class="stock-sheet-label">{{ $t('nav.stock') }}</div>
          <div class="stock-sheet-row">
            <router-link to="/stock/in" class="stock-sheet-btn stock-in" @click="stockMenuOpen = false">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
              <span>{{ $t('nav.stock_in') }}</span>
            </router-link>
            <router-link to="/stock/out" class="stock-sheet-btn stock-out" @click="stockMenuOpen = false">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              <span>{{ $t('nav.stock_out') }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </transition>
    <!-- 修改密码 Dialog -->
    <el-dialog v-model="pwdDialogVisible" title="修改密码" width="360px" :close-on-click-modal="false">
      <el-form label-width="80px">
        <el-form-item label="当前密码">
          <el-input v-model="pwdForm.old_password" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.new_password" type="password" show-password placeholder="至少4位" />
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input v-model="pwdForm.confirm" type="password" show-password placeholder="再次输入新密码" @keyup.enter="savePwd" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pwdSaving" @click="savePwd">保存</el-button>
      </template>
    </el-dialog>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import WorkspaceSwitcher from './components/WorkspaceSwitcher.vue'
import { auth } from './stores/auth'
import { authApi } from './api/index'
import { ElMessage } from 'element-plus'

const { locale } = useI18n()
const route = useRoute()
const router = useRouter()

const epLocale = computed(() => locale.value === 'zh' ? zhCn : en)

const isDark = ref(localStorage.getItem('theme') === 'dark')
const sidebarOpen = ref(false)
const stockMenuOpen = ref(false)

const closeSidebar = () => { sidebarOpen.value = false }
const toggleStockMenu = () => { stockMenuOpen.value = !stockMenuOpen.value }

watch(() => route.path, () => { stockMenuOpen.value = false })

const toggleTheme = () => {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

const toggleLang = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
  localStorage.setItem('lang', locale.value)
}

function handleLogout() {
  auth.logout()
  localStorage.removeItem('guest_acknowledged')
  router.push('/login')
}

const pwdDialogVisible = ref(false)
const pwdForm = ref({ old_password: '', new_password: '', confirm: '' })
const pwdSaving = ref(false)

async function savePwd() {
  if (!pwdForm.value.old_password || !pwdForm.value.new_password) {
    ElMessage.warning('请填写所有密码字段')
    return
  }
  if (pwdForm.value.new_password !== pwdForm.value.confirm) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  pwdSaving.value = true
  try {
    await authApi.changePassword({ old_password: pwdForm.value.old_password, new_password: pwdForm.value.new_password })
    ElMessage.success('密码已更新')
    pwdDialogVisible.value = false
    pwdForm.value = { old_password: '', new_password: '', confirm: '' }
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    pwdSaving.value = false
  }
}

onMounted(() => {
  if (isDark.value) {
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})
</script>

<style>
/* ── Shell ── */
.shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg-app);
}

/* ── Sidebar overlay (mobile) ── */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: var(--color-bg-overlay);
  z-index: 99;
}

/* ── Sidebar ── */
.sidebar {
  width: 224px;
  flex-shrink: 0;
  background: var(--color-sidebar-bg);
  display: flex;
  flex-direction: column;
  user-select: none;
  position: relative;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px 16px;
  border-bottom: 1px solid var(--color-sidebar-border);
}
.brand-logo {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #D97757 0%, #E8956F 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 2px 10px rgba(217, 119, 87, 0.4);
}
.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.brand-name {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255,255,255,0.95);
  letter-spacing: -0.3px;
  line-height: 1.2;
}
.brand-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.02em;
}

/* Nav */
.nav {
  flex: 1;
  padding: 10px 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.nav::-webkit-scrollbar { display: none; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--color-sidebar-text);
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  position: relative;
  transition: background var(--dur-fast) var(--ease-standard),
              color var(--dur-fast) var(--ease-standard);
}
.nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity var(--dur-fast);
}
.nav-item:hover {
  background: var(--color-sidebar-hover);
  color: rgba(255,255,255,0.95);
}
.nav-item:hover .nav-icon { opacity: 0.9; }
.nav-item.active {
  background: var(--color-sidebar-active-bg);
  color: var(--color-sidebar-active-text);
  font-weight: 600;
}
.nav-item.active .nav-icon { opacity: 1; }
.nav-item.active::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  background: var(--color-sidebar-active-bar);
  border-radius: 0 3px 3px 0;
}
.nav-item.nav-sub { padding-left: 16px; font-size: 13px; }

.nav-section-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-sidebar-section);
  padding: 14px 10px 5px;
}
.nav-divider {
  height: 1px;
  background: var(--color-sidebar-divider);
  margin: 6px 4px;
}

/* Sidebar Footer */
.sidebar-footer {
  padding: 10px 8px 14px;
  border-top: 1px solid var(--color-sidebar-border);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.theme-btn {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 7px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-standard),
              color var(--dur-fast) var(--ease-standard);
}
.theme-btn:hover {
  background: var(--color-sidebar-hover);
  color: rgba(255,255,255,0.8);
}
.user-info-row {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  margin-bottom: 4px;
}
.user-name {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 90px;
}
.logout-btn {
  flex-shrink: 0;
  width: auto;
  padding: 4px 6px !important;
}
.guest-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  margin-bottom: 4px;
}
.guest-label {
  font-size: 12px;
  color: rgba(255,255,255,0.35);
}
.login-link {
  font-size: 12px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}
.login-link:hover { text-decoration: underline; }
.theme-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

/* ── Main ── */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.topbar {
  height: 54px;
  flex-shrink: 0;
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border-subtle);
  box-shadow: 0 1px 0 var(--color-border-subtle), 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 12px;
  z-index: 10;
  position: relative;
}
.topbar-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-radius: var(--radius-base);
  padding: 0;
}
.topbar-menu-btn:hover { background: var(--color-border); }
.topbar-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.3px;
}
.topbar-breadcrumb {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  background: var(--color-bg-app);
}

/* ── Bottom Navigation ── */
.bottom-nav {
  display: none;
}
.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--color-text-tertiary);
  font-size: 10px;
  font-weight: 500;
  text-decoration: none;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 6px 2px;
  min-width: 0;
  transition: color var(--dur-fast) var(--ease-standard);
  -webkit-tap-highlight-color: transparent;
}
.bottom-nav-item.active {
  color: var(--color-primary);
  font-weight: 600;
}
.bottom-nav-item svg {
  flex-shrink: 0;
}

/* ── Stock action sheet ── */
.stock-sheet-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 89;
  background: rgba(0,0,0,0.35);
  align-items: flex-end;
}
.stock-sheet {
  width: 100%;
  background: var(--color-bg-surface);
  border-radius: 16px 16px 0 0;
  padding: 16px 16px calc(72px + env(safe-area-inset-bottom));
}
.stock-sheet-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-tertiary);
  margin-bottom: 10px;
  padding: 0 2px;
}
.stock-sheet-row {
  display: flex;
  gap: 10px;
}
.stock-sheet-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 18px 12px;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity var(--dur-fast);
}
.stock-sheet-btn:active { opacity: 0.8; }
.stock-in  { background: var(--color-success-bg);  color: var(--color-success-text); }
.stock-out { background: var(--color-warning-bg);  color: var(--color-warning-text); }

.stock-fade-enter-active, .stock-fade-leave-active { transition: opacity var(--dur-fast); }
.stock-fade-enter-from, .stock-fade-leave-to { opacity: 0; }

/* ── Desktop content max-width ── */
@media (min-width: 1600px) {
  .content { padding-left: max(32px, calc((100% - 1400px) / 2)); padding-right: max(32px, calc((100% - 1400px) / 2)); }
}

/* ══ Mobile Responsive ══ */
@media (max-width: 768px) {
  .sidebar-overlay { display: block; }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform var(--dur-normal) var(--ease-standard);
    box-shadow: var(--shadow-xl);
  }
  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .topbar-menu-btn { display: none; }
  .topbar { padding: 0 16px; gap: 10px; }
  .topbar-breadcrumb { display: none; }

  .content { padding: 16px; padding-bottom: calc(56px + 16px + env(safe-area-inset-bottom)); }

  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 90;
    height: 56px;
    background: var(--color-bg-surface);
    border-top: 1px solid var(--color-border);
    box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .stock-sheet-overlay { display: flex; }
}
</style>

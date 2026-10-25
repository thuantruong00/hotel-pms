<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <router-view />
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import {
  NConfigProvider,
  NMessageProvider,
} from 'naive-ui'

const themeOverrides = {
  common: {
    primaryColor: '#167a5a',
    primaryColorHover: '#126348',
    primaryColorPressed: '#0e523c',
    primaryColorSuppl: '#1f8f6a',
  },
  Menu: {
    itemColorActive: '#ccebdd',
    itemColorActiveHover: '#b9e2cf',
    itemColorHover: '#e4f4ec',
    itemTextColor: '#43524b',
    itemTextColorActive: '#0b5a3f',
    itemTextColorHover: '#125d45',
  },
}
</script>

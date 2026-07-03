<template>
  <RouterLink v-if="to" v-bind="$attrs" :to="to" class="ns-button" :class="variantClass">
    <slot />
  </RouterLink>
  <button v-else v-bind="$attrs" class="ns-button" :class="variantClass" type="button">
    <slot />
  </button>
</template>

<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    to?: RouteLocationRaw
    variant?: 'default' | 'primary'
  }>(),
  {
    variant: 'default'
  }
)

const variantClass = props.variant === 'primary' ? 'ns-button--primary' : ''
</script>

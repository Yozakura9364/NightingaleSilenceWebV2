<template>
  <RouterLink v-if="to" v-bind="$attrs" :to="to" class="ns-button" :class="buttonClasses">
    <slot />
  </RouterLink>
  <button v-else v-bind="$attrs" class="ns-button" :class="buttonClasses" type="button">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    to?: RouteLocationRaw
    variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'default' | 'compact' | 'icon'
    block?: boolean
  }>(),
  {
    variant: 'default',
    size: 'default',
    block: false
  }
)

const buttonClasses = computed(() => ({
  [`ns-button--${props.variant}`]: props.variant !== 'default',
  [`ns-button--${props.size}`]: props.size !== 'default',
  'ns-button--block': props.block
}))
</script>

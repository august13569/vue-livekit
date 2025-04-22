<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  show: boolean
  message: string
  duration?: number
  type?: 'success' | 'error' | 'info'
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const isVisible = ref(false)
const timer = ref<number | null>(null)

const startTimer = () => {
  if (timer.value) clearTimeout(timer.value)
  timer.value = window.setTimeout(() => {
    emit('update:show', false)
  }, props.duration || 3000)
}

watch(() => props.show, (newValue) => {
  isVisible.value = newValue
  if (newValue) {
    startTimer()
  }
})

onMounted(() => {
  if (props.show) {
    startTimer()
  }
})
</script>

<template>
  <Transition name="notification">
    <div
      v-if="show"
      class="notification"
      :class="[`notification-${type || 'success'}`]"
    >
      <div class="notification-content">
        <span class="notification-icon" v-if="type === 'success'">✓</span>
        <span class="notification-icon" v-else-if="type === 'error'">✕</span>
        <span class="notification-icon" v-else-if="type === 'info'">ℹ</span>
        {{ message }}
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-width: 400px;
  min-width: 300px;
  backdrop-filter: blur(8px);
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 0.95rem;
}

.notification-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.notification-success {
  background: rgba(72, 187, 120, 0.9);
}

.notification-error {
  background: rgba(245, 101, 101, 0.9);
}

.notification-info {
  background: rgba(66, 153, 225, 0.9);
}

/* 動畫效果 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 768px) {
  .notification {
    top: auto;
    bottom: max(20px, env(safe-area-inset-bottom));
    right: 20px;
    left: 20px;
    min-width: 0;
    max-width: none;
  }
}
</style>
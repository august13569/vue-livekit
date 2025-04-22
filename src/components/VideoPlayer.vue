<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Ref } from 'vue'

const props = defineProps<{
  stream: MediaStream | null
  isRecording?: boolean
}>()

const videoRef = ref<HTMLVideoElement | null>(null)

// 監聽串流變更
watch(() => props.stream, (newStream) => {
  if (videoRef.value && newStream) {
    videoRef.value.srcObject = newStream
  }
}, { immediate: true })
</script>

<template>
  <div class="video-container">
    <video ref="videoRef" autoplay playsinline muted></video>
    <div v-if="isRecording" class="recording-indicator">
      <div class="recording-dot"></div>
      <span>錄影中</span>
    </div>
    <slot name="overlay"></slot>
  </div>
</template>

<style scoped>
.video-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recording-indicator {
  position: absolute;
  top: 1rem;
  left: 1rem; /* 改為 left */
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 20;
}

.recording-dot {
  width: 8px;
  height: 8px;
  background: #ff4646;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
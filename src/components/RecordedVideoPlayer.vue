<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  videoUrl: string | null
  visible: boolean
}>()

const videoRef = ref<HTMLVideoElement | null>(null)

// 監聽 videoUrl 變化，當有新的影片時自動播放
watch(() => props.videoUrl, (newUrl) => {
  if (newUrl && videoRef.value) {
    // 重置影片時間並播放
    videoRef.value.currentTime = 0
    videoRef.value.play().catch(err => {
      console.error('自動播放失敗:', err)
    })
  }
}, { immediate: true })

// 監聽可見性變化
watch(() => props.visible, (isVisible) => {
  if (!isVisible && videoRef.value) {
    videoRef.value.pause()
  } else if (isVisible && videoRef.value && props.videoUrl) {
    videoRef.value.play().catch(err => {
      console.error('自動播放失敗:', err)
    })
  }
})

onMounted(() => {
  if (props.videoUrl && videoRef.value) {
    videoRef.value.play().catch(err => {
      console.error('自動播放失敗:', err)
    })
  }
})
</script>

<template>
  <Transition name="fade">
    <div 
      v-if="visible && videoUrl" 
      class="recorded-video-player"
    >
      <video 
        ref="videoRef"
        :src="videoUrl"
        autoplay
        loop
        muted
        playsinline
      ></video>
    </div>
  </Transition>
</template>

<style scoped>
.recorded-video-player {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  width: 160px;
  aspect-ratio: 16/9;
  background: #000;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.recorded-video-player video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 動畫效果 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* 手機版適配 */
@media (max-width: 768px) {
  .recorded-video-player {
    width: 120px;
    bottom: 0.75rem;
    right: 0.75rem;
  }
}
</style>
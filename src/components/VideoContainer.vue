<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Track } from 'livekit-client'

const props = defineProps<{
  stream?: MediaStream | null
  videoUrl?: string | null
  error?: string
  onRetry?: () => void
  waiting?: boolean
  videoTrack?: Track | null
  audioTrack?: Track | null
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const hasTrackError = ref(false)
const needsUserInteraction = ref(false)

// 嘗試播放視訊
const attemptPlay = async () => {
  if (!videoRef.value) return

  try {
    needsUserInteraction.value = false
    await videoRef.value.play()
    isPlaying.value = true
    console.log('媒體開始播放')
  } catch (error) {
    console.log('需要使用者互動才能播放')
    needsUserInteraction.value = true
  }
}

// 處理 LiveKit 視訊和音訊軌道
const attachTracks = async (videoTrack?: Track | null, audioTrack?: Track | null) => {
  if (!videoRef.value) {
    console.warn('視訊元素尚未準備好')
    return
  }
  
  hasTrackError.value = false
  
  try {
    // 移除現有的軌道
    if (videoRef.value.srcObject instanceof MediaStream) {
      const stream = videoRef.value.srcObject as MediaStream
      stream.getTracks().forEach(track => {
        stream.removeTrack(track)
      })
    }

    // 創建新的 MediaStream
    const newStream = new MediaStream()
    
    // 添加視訊軌道
    if (videoTrack?.mediaStreamTrack) {
      newStream.addTrack(videoTrack.mediaStreamTrack)
    }

    // 添加音訊軌道
    if (audioTrack?.mediaStreamTrack) {
      newStream.addTrack(audioTrack.mediaStreamTrack)
    }
    
    // 設置視訊元素
    videoRef.value.srcObject = newStream
    videoRef.value.muted = false
    videoRef.value.playsInline = true
    
    // 嘗試播放
    await attemptPlay()
  } catch (error) {
    console.error('附加軌道時發生錯誤:', error)
    hasTrackError.value = true
  }
}

// 監聽視訊和音訊軌道變更
watch([() => props.videoTrack, () => props.audioTrack], ([newVideoTrack, newAudioTrack]) => {
  console.log('媒體軌道更新:', {
    videoTrack: newVideoTrack?.sid,
    audioTrack: newAudioTrack?.sid,
  })

  if (newVideoTrack || newAudioTrack) {
    attachTracks(newVideoTrack, newAudioTrack)
  } else if (videoRef.value) {
    videoRef.value.srcObject = null
    isPlaying.value = false
  }
}, { immediate: true })

// 監聽本地串流變更
watch(() => props.stream, (newStream) => {
  if (videoRef.value && newStream) {
    videoRef.value.srcObject = newStream
    videoRef.value.muted = true  // 本地預覽需要靜音
    attemptPlay()
  }
}, { immediate: true })

onMounted(() => {
  if (!videoRef.value) return

  // 添加視訊事件監聽
  videoRef.value.addEventListener('loadedmetadata', () => {
    console.log('媒體元數據已載入')
  })

  videoRef.value.addEventListener('playing', () => {
    console.log('媒體開始播放')
    isPlaying.value = true
    needsUserInteraction.value = false
  })

  videoRef.value.addEventListener('pause', () => {
    console.log('媒體暫停')
    isPlaying.value = false
  })

  videoRef.value.addEventListener('error', (e) => {
    const videoError = (e.target as HTMLVideoElement).error
    console.error('媒體錯誤:', {
      code: videoError?.code,
      message: videoError?.message
    })
    hasTrackError.value = true
  })

  // 設置初始源
  if (props.videoTrack || props.audioTrack) {
    attachTracks(props.videoTrack, props.audioTrack)
  } else if (props.stream) {
    videoRef.value.srcObject = props.stream
    videoRef.value.muted = true
    attemptPlay()
  }
})
</script>

<template>
  <div class="video-container">
    <video
      ref="videoRef"
      autoplay
      playsinline
    ></video>
    
    <div v-if="error || hasTrackError" class="error-overlay">
      <p>{{ error || '媒體串流載入失敗' }}</p>
      <button v-if="onRetry" @click="onRetry">重試</button>
    </div>

    <div v-else-if="waiting" class="waiting-overlay">
      <div class="waiting-content">
        <div class="pulse-dot"></div>
        <p>正在等待直播主開始直播...</p>
      </div>
    </div>

    <div v-else-if="needsUserInteraction" class="interaction-overlay" @click="attemptPlay">
      <div class="interaction-content">
        <div class="play-button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <p>點擊播放</p>
      </div>
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
  display: flex;
  align-items: center;
  justify-content: center;
}

video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.error-overlay,
.waiting-overlay,
.interaction-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  text-align: center;
  z-index: 10;
}

.interaction-overlay {
  cursor: pointer;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.interaction-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.play-button {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s, background-color 0.2s;
}

.interaction-overlay:hover .play-button {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.3);
}

.waiting-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.pulse-dot {
  width: 12px;
  height: 12px;
  background: #646cff;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

.error-overlay button {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: #646cff;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.error-overlay button:hover {
  background: #535bf2;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
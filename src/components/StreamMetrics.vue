<template>
  <div class="stream-metrics">
    <div class="metric-item">
      <span class="metric-label">解析度</span>
      <span class="metric-value">{{ resolution }}</span>
    </div>
    <div class="metric-item">
      <span class="metric-label">FPS</span>
      <span class="metric-value">{{ fps }}</span>
    </div>
    <div class="metric-item">
      <span class="metric-label">碼率</span>
      <span class="metric-value">{{ bitrate }}</span>
    </div>
    <div class="metric-item">
      <span class="metric-label">延遲</span>
      <span class="metric-value">{{ latency }}</span>
    </div>
    <div class="metric-item">
      <span class="metric-label">連線品質</span>
      <span class="metric-value" :class="qualityClass">{{ quality }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import type { Room, LocalParticipant } from 'livekit-client'
import { ConnectionQuality, RoomEvent } from 'livekit-client'

const props = defineProps<{
  room: Room | null
  participant: LocalParticipant | null
}>()

const resolution = ref('--')
const fps = ref('--')
const bitrate = ref('--')
const latency = ref('--')
const quality = ref('--')
const qualityClass = ref('')

// 用於計算平均值的緩衝區
const fpsBuffer = ref<number[]>([])
const bitrateBuffer = ref<number[]>([])
const MAX_BUFFER_SIZE = 5

let statsInterval: number | null = null
let lastBytesSent = 0
let lastTimestamp = 0
let lastFramesEncoded = 0

const calculateAverage = (arr: number[]) => {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

const formatBitrate = (bits: number) => {
  if (!bits || !isFinite(bits)) return '--'
  if (bits < 1000000) {
    return `${(bits / 1000).toFixed(0)} Kbps`
  }
  return `${(bits / 1000000).toFixed(1)} Mbps`
}

const formatLatency = (ms: number) => {
  if (!ms || !isFinite(ms)) return '--'
  return `${Math.round(ms)}ms`
}

const updateQualityDisplay = (qualityValue: ConnectionQuality) => {
  switch (qualityValue) {
    case ConnectionQuality.Excellent:
      quality.value = '優'
      qualityClass.value = 'quality-excellent'
      break
    case ConnectionQuality.Good:
      quality.value = '良'
      qualityClass.value = 'quality-good'
      break
    case ConnectionQuality.Poor:
      quality.value = '差'
      qualityClass.value = 'quality-poor'
      break
    default:
      quality.value = '--'
      qualityClass.value = ''
  }
}

const updateStats = async () => {
  if (!props.participant || !props.room) {
    return
  }

  try {
    const videoPublication = Array.from(props.participant.videoTracks.values())[0]
    if (!videoPublication?.track) return

    // 更新解析度
    const dimensions = videoPublication.dimensions
    if (dimensions) {
      resolution.value = `${dimensions.width}x${dimensions.height}`
    }

    // 更新延遲 - 使用多個來源
    let currentLatency = '--'
    if (props.room.engine?.client?.latency) {
      // LiveKit 的延遲測量
      currentLatency = formatLatency(props.room.engine.client.latency * 1000)
    }
    latency.value = currentLatency

    // 更新連線品質
    if (props.participant) {
      updateQualityDisplay(props.participant.connectionQuality)
    }

    // 使用 WebRTC 統計
    const sender = (videoPublication.track as any)?.sender
    if (sender) {
      const stats = await sender.getStats()
      
      stats.forEach((stat: any) => {
        if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
          // 計算即時 FPS
          if (stat.framesEncoded) {
            const framesDelta = stat.framesEncoded - lastFramesEncoded
            const timeDelta = (stat.timestamp - lastTimestamp) / 1000
            if (timeDelta > 0) {
              const currentFps = framesDelta / timeDelta
              if (currentFps > 0) {
                fpsBuffer.value.push(currentFps)
                if (fpsBuffer.value.length > MAX_BUFFER_SIZE) {
                  fpsBuffer.value.shift()
                }
                fps.value = Math.round(calculateAverage(fpsBuffer.value)).toString()
              }
            }
            lastFramesEncoded = stat.framesEncoded
          }
          
          // 計算即時碼率
          if (stat.bytesSent && stat.timestamp) {
            const now = stat.timestamp
            const bytes = stat.bytesSent
            
            if (lastBytesSent && lastTimestamp && now > lastTimestamp) {
              const deltaBytes = bytes - lastBytesSent
              const deltaTime = (now - lastTimestamp) / 1000
              const currentBitrate = (deltaBytes * 8) / deltaTime
              
              if (currentBitrate > 0) {
                bitrateBuffer.value.push(currentBitrate)
                if (bitrateBuffer.value.length > MAX_BUFFER_SIZE) {
                  bitrateBuffer.value.shift()
                }
                bitrate.value = formatBitrate(calculateAverage(bitrateBuffer.value))
              }
            }
            
            lastBytesSent = bytes
            lastTimestamp = now
          }
        }
      })
    }
  } catch (error) {
    console.error('獲取串流統計資訊失敗:', error)
  }
}

// 監聽房間事件
watch(() => props.room, (newRoom) => {
  if (newRoom) {
    newRoom.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      if (participant.sid === props.participant?.sid) {
        updateQualityDisplay(quality)
      }
    })
  }
}, { immediate: true })

onMounted(() => {
  // 重置所有統計數據
  lastBytesSent = 0
  lastTimestamp = 0
  lastFramesEncoded = 0
  fpsBuffer.value = []
  bitrateBuffer.value = []
  
  // 更頻繁地更新統計資料
  statsInterval = window.setInterval(updateStats, 500)
})

onUnmounted(() => {
  if (statsInterval) {
    clearInterval(statsInterval)
  }
})
</script>

<style scoped>
.stream-metrics {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(0, 0, 0, 0.7);
  padding: 0.75rem;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
  z-index: 100;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  line-height: 1.5;
}

.metric-label {
  color: #888;
}

.metric-value {
  color: white;
  font-family: monospace;
  min-width: 60px;
  text-align: right;
}

.quality-excellent {
  color: #4CAF50;
}

.quality-good {
  color: #FFC107;
}

.quality-poor {
  color: #f44336;
}

@media (max-width: 768px) {
  .stream-metrics {
    font-size: 0.8rem;
    padding: 0.5rem;
  }
}
</style>
<template>
  <div class="broadcaster-container">
    <div class="video-container">
      <VideoPlayer 
        :stream="stream"
        :is-recording="isRecording"
      >
        <template #overlay>
          <div v-if="currentRoomId" class="room-id-display">
            RoomID: {{ currentRoomId }}
          </div>
          <RecordedVideoPlayer
            :video-url="recordedVideoUrl"
            :visible="showRecordedVideo"
          />
          <StreamMetrics
            :room="liveKitRoom"
            :participant="localParticipant"
          />
        </template>
      </VideoPlayer>
    </div>
    
    <ControlPanel
      :is-live="store.isLive"
      :current-room-id="currentRoomId"
      :recording-state="{ isRecording, recordedVideoUrl }"
      @create-room="createRoom"
      @delete-room="deleteRoom"
      @start-stream="startStream"
      @stop-stream="stopStream"
      @start-recording="startRecording"
      @stop-recording="stopRecording"
      @download-recording="downloadRecording"
      @delete-recording="deleteRecording"
    />

    <LoadingSpinner 
      v-if="isLoading" 
      :text="loadingText" 
      fullscreen 
    />

    <Notification
      v-model:show="showNotification"
      :message="notificationMessage"
      :type="notificationType"
      :duration="3000"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStreamStore } from '@/stores/stream'
import { useMediaStream } from '@/composables/useMediaStream'
import { useRecording } from '@/composables/useRecording'
import { useRoom } from '@/composables/useRoom'
import { useLoading } from '@/composables/useLoading'
import { useLiveKit } from '@/composables/useLiveKit'
import VideoPlayer from '@/components/VideoPlayer.vue'
import ControlPanel from '@/components/ControlPanel.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Notification from '@/components/Notification.vue'
import RecordedVideoPlayer from '@/components/RecordedVideoPlayer.vue'
import StreamMetrics from '@/components/StreamMetrics.vue'

// 初始化所需的功能
const store = useStreamStore()
const { isLoading, loadingText, withLoading } = useLoading()
const { stream, error: streamError, initializeStream, reinitializeStream } = useMediaStream({
  video: {
    aspectRatio: 16/9,
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  },
  audio: true
})

const { 
  currentRoomId, 
  error: roomError, 
  createRoom: _createRoom, 
  deleteRoom,
  initializeStream: initStreamConnection,
  restoreSession
} = useRoom()

const {
  room: liveKitRoom,
  localParticipant,
  error: livekitError,
  connectToRoom,
  disconnect
} = useLiveKit()

const { 
  isRecording, 
  recordedVideoUrl, 
  startRecording, 
  stopRecording, 
  downloadRecording,
  deleteRecording
} = useRecording(stream)

// 控制錄影播放器的顯示
const showRecordedVideo = computed(() => !!recordedVideoUrl)

// 通知相關狀態
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'info'>('success')

// 顯示通知的方法
const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  notificationMessage.value = message
  notificationType.value = type
  showNotification.value = true
}

// 包裝建立房間的功能，加入 loading 狀態
const createRoom = () => {
  return withLoading(
    async () => {
      const result = await _createRoom()
      if (result.success) {
        localStorage.setItem('roomId', currentRoomId.value)
        showMessage('房間建立成功！')
      } else {
        showMessage(result.error || '建立房間失敗', 'error')
      }
    },
    '建立房間中...'
  )
}

// 開始直播
const startStream = async () => {
  if (!currentRoomId.value) {
    showMessage('請先建立房間才能開始直播', 'error')
    return
  }

  try {
    await withLoading(async () => {
      // 1. 重新初始化媒體串流
      await reinitializeStream()
      
      if (!stream.value) {
        throw new Error('無法存取媒體設備')
      }

      // 2. 初始化直播連線（取得 token 和 wsURL）
      const initResult = await initStreamConnection()
      if (!initResult.success) {
        throw new Error(initResult.error)
      }

      // 3. 連接到 LiveKit 房間並開始推流
      const connectResult = await connectToRoom(stream.value)
      if (!connectResult.success) {
        throw new Error(connectResult.error)
      }

      store.setLiveStatus(true)
      localStorage.setItem('isLive', 'true')
    }, '正在連接直播伺服器...')
    
    showMessage('直播已開始')
  } catch (error) {
    showMessage(error instanceof Error ? error.message : '開始直播失敗', 'error')
    store.setLiveStatus(false)
    localStorage.removeItem('isLive')
  }
}

// 停止直播
const stopStream = async () => {
  try {
    await disconnect()
    store.setLiveStatus(false)
    localStorage.removeItem('isLive')
    showMessage('直播已結束')
  } catch (error) {
    showMessage('結束直播時發生錯誤', 'error')
  }
}

// 重新連接直播
const reconnectStream = async () => {
  try {
    await withLoading(async () => {
      // 1. 重新初始化媒體串流
      await reinitializeStream()
      
      if (!stream.value) {
        throw new Error('無法存取媒體設備')
      }

      // 2. 恢復房間資訊
      const restoreResult = await restoreSession()
      if (!restoreResult.success) {
        throw new Error(restoreResult.error)
      }

      // 3. 重新連接到 LiveKit 房間
      const connectResult = await connectToRoom(stream.value)
      if (!connectResult.success) {
        throw new Error(connectResult.error)
      }

      store.setLiveStatus(true)
    }, '重新連接直播中...')
    
    showMessage('重新連接成功')
  } catch (error) {
    showMessage(error instanceof Error ? error.message : '重新連接失敗', 'error')
    store.setLiveStatus(false)
    localStorage.removeItem('isLive')
  }
}

// 頁面載入時檢查是否需要重新連接
onMounted(async () => {
  await initializeStream()
  
  const savedRoomId = localStorage.getItem('roomId')
  const wasLive = localStorage.getItem('isLive') === 'true'
  
  if (savedRoomId && wasLive && stream.value) {
    reconnectStream()
  }
})
</script>

<style scoped>
.broadcaster-container {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: #1a1a1a;
  overflow: hidden;
}

.video-container {
  position: relative;
  flex: 1;
  min-height: 0;
}

.room-id-display {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  z-index: 10;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@media (min-width: 768px) {
  .broadcaster-container {
    flex-direction: row;
  }

  .video-container {
    flex: 1;
  }
}
</style>
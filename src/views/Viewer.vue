<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Room, RoomEvent, RemoteParticipant, ConnectionState, Track, RemoteTrackPublication, ConnectionQuality, VideoQuality, Participant } from 'livekit-client'
import { useLiveKitConnection } from '@/composables/useLiveKitConnection'
import VideoContainer from '@/components/VideoContainer.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Notification from '@/components/Notification.vue'

const route = useRoute()
const router = useRouter()
const roomId = route.params.roomId as string
const room = ref<Room | null>(null)
const hasError = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)
const loadingText = ref('')
const isWaiting = ref(true)
const remoteVideoTrack = ref<Track | null>(null)
const remoteAudioTrack = ref<Track | null>(null)
const connectionAttempts = ref(0)
const maxRetries = 3
const retryTimeout = ref<number | null>(null)
const currentQuality = ref<ConnectionQuality>(ConnectionQuality.Unknown)

// 通知相關狀態
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'info'>('success')

const { initializeConnection } = useLiveKitConnection()

const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  notificationMessage.value = message
  notificationType.value = type
  showNotification.value = true
}

const leaveStream = () => {
  if (room.value) {
    console.log('離開房間', {
      room: roomId,
      roomSid: room.value.sid,
      identity: room.value.localParticipant.identity
    })
    room.value.disconnect()
  }
  router.push('/rooms')
}

// 處理遠端參與者的媒體軌道
const handleRemoteTrackPublication = (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
  if (!publication || !participant) return

  console.log('處理媒體軌道:', {
    trackSid: publication.trackSid,
    kind: publication.kind,
    isSubscribed: publication.isSubscribed,
    hasTrack: !!publication.track,
    dimensions: publication.dimensions
  })

  if (publication.isSubscribed && publication.track) {
    if (publication.kind === Track.Kind.Video) {
      remoteVideoTrack.value = publication.track
      isWaiting.value = false
    } else if (publication.kind === Track.Kind.Audio) {
      remoteAudioTrack.value = publication.track
    }
  }
}

// 處理連線品質變更
const handleQualityChange = (quality: ConnectionQuality, participant: Participant) => {
  currentQuality.value = quality
  let qualityText = ''
  
  switch (quality) {
    case ConnectionQuality.Excellent:
      qualityText = 'excellent'
      break
    case ConnectionQuality.Good:
      qualityText = 'good'
      break
    case ConnectionQuality.Poor:
      qualityText = 'poor'
      break
    default:
      qualityText = 'unknown'
  }

  console.log('連線品質變更:', {
    quality: qualityText,
    participant: participant.identity
  })

  // 當品質變差時通知用戶
  if (quality === ConnectionQuality.Poor) {
    showMessage('網路連線品質不佳，正在自動調整畫質...', 'info')
  }
}

const setupRoomListeners = () => {
  if (!room.value) return

  room.value
    .on(RoomEvent.ConnectionStateChanged, async (state: ConnectionState) => {
      console.log('連線狀態變更:', state)
      
      if (state === ConnectionState.Disconnected) {
        if (connectionAttempts.value < maxRetries) {
          connectionAttempts.value++
          console.log(`重試連接 (${connectionAttempts.value}/${maxRetries})`)
          const retryDelay = Math.min(2000 * Math.pow(2, connectionAttempts.value - 1), 10000)
          showMessage(`連線中斷，${retryDelay / 1000} 秒後重試...`, 'info')
          
          if (retryTimeout.value) {
            clearTimeout(retryTimeout.value)
          }
          
          retryTimeout.value = window.setTimeout(async () => {
            try {
              await connectToStream()
            } catch (error) {
              console.error('重試連接失敗:', error)
            }
          }, retryDelay)
        } else {
          showMessage('無法連接到直播，請稍後重試', 'error')
          router.push('/rooms')
        }
      } else if (state === ConnectionState.Connected) {
        connectionAttempts.value = 0
        showMessage('已連接到直播間', 'success')
      }
    })
    .on(RoomEvent.ConnectionQualityChanged, handleQualityChange)
    .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('參與者加入:', participant.identity)
      
      if (participant.identity.startsWith('streamer-')) {
        showMessage('直播主已加入房間', 'info')
        
        // 修正：添加安全檢查
        if (participant.trackPublications) {
          participant.trackPublications.forEach(publication => {
            handleRemoteTrackPublication(publication, participant)
          })
        }
      }
    })
    .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log('參與者離開:', participant.identity)
      
      if (participant.identity.startsWith('streamer-')) {
        showMessage('直播主已離開房間', 'info')
        isWaiting.value = true
        remoteVideoTrack.value = null
        remoteAudioTrack.value = null
      }
    })
    .on(RoomEvent.TrackSubscribed, (track: Track, publication, participant: RemoteParticipant) => {
      console.log('訂閱軌道:', {
        trackSid: track.sid,
        kind: track.kind,
        participantIdentity: participant.identity,
        encodings: publication.encodings
      })
      
      if (participant.identity.startsWith('streamer-')) {
        handleRemoteTrackPublication(publication as RemoteTrackPublication, participant)
      }
    })
    .on(RoomEvent.TrackUnsubscribed, (track: Track, publication, participant: RemoteParticipant) => {
      console.log('取消訂閱軌道:', {
        trackSid: track.sid,
        kind: track.kind,
        participantIdentity: participant.identity
      })
      
      if (participant.identity.startsWith('streamer-')) {
        if (track.kind === Track.Kind.Video) {
          remoteVideoTrack.value = null
        } else if (track.kind === Track.Kind.Audio) {
          remoteAudioTrack.value = null
        }
      }
    })
}

const connectToStream = async () => {
  if (!roomId) {
    showMessage('房間 ID 無效', 'error')
    router.push('/rooms')
    return
  }

  try {
    isLoading.value = true
    loadingText.value = '正在連接到直播...'
    hasError.value = false
    errorMessage.value = ''

    if (room.value) {
      room.value.disconnect()
      room.value = null
    }

    const result = await initializeConnection(roomId, false)
    if (!result.success) {
      throw new Error(result.error)
    }

    room.value = new Room({
      // 啟用自適應串流
      adaptiveStream: {
        enabled: true,
        minQuality: VideoQuality.LOW,    // 最低接受 360p
        maxQuality: VideoQuality.HIGH,    // 最高到 1080p
        sensitivity: 5,                   // 中等敏感度
        switchDelay: 3000,               // 切換延遲 3 秒
      },
      
      // 啟用動態串流接收
      dynacast: true,

      // 設定自動訂閱參數
      autoSubscribe: {
        video: true,
        audio: true,
      },

      // 設定接收端參數
      receiveSettings: {
        // 視訊接收設定
        video: {
          maxBitrate: 3_000_000,        // 最大 3 Mbps
          minBitrate: 150_000,          // 最小 150 Kbps
          preferredCodec: 'h264',       // 優先使用 H.264 編碼
          maxFramerate: 30,             // 最大 30fps
          priority: 'balanced'          // 平衡品質和效能
        },
        // 音訊接收設定
        audio: {
          maxBitrate: 128_000,         // 最大 128 Kbps
          minBitrate: 32_000,          // 最小 32 Kbps
          priority: 'balanced'
        }
      },

      // 連線重試設定
      reconnectPolicy: {
        maxRetries: 3,
        timeoutMS: 10000,
        backoff: {
          initial: 1000,
          max: 10000,
          multiplier: 1.5
        }
      }
    })
    
    setupRoomListeners()
    
    await room.value.connect(result.url, result.token)
    console.log('已連接到房間')

  } catch (error) {
    console.error('連接失敗:', error)
    const message = error instanceof Error ? error.message : '無法連接到直播'
    hasError.value = true
    errorMessage.value = message
    showMessage(message, 'error')
    
    if (connectionAttempts.value < maxRetries) {
      const retryDelay = Math.min(2000 * Math.pow(2, connectionAttempts.value), 10000)
      showMessage(`連線失敗，${retryDelay / 1000} 秒後重試...`, 'info')
      
      if (retryTimeout.value) {
        clearTimeout(retryTimeout.value)
      }
      
      retryTimeout.value = window.setTimeout(() => {
        connectToStream()
      }, retryDelay)
    }
  } finally {
    isLoading.value = false
    loadingText.value = ''
  }
}

onMounted(() => {
  connectToStream()
})

onUnmounted(() => {
  if (retryTimeout.value) {
    clearTimeout(retryTimeout.value)
  }
  if (room.value) {
    room.value.disconnect()
  }
})
</script>

<template>
  <div class="viewer-layout">
    <div class="video-wrapper">
      <VideoContainer
        :error="errorMessage"
        :waiting="isWaiting"
        :video-track="remoteVideoTrack"
        :audio-track="remoteAudioTrack"
        :on-retry="connectToStream"
      />
    </div>
    <div class="controls">
      <button class="leave-btn" @click="leaveStream">
        離開直播
      </button>
    </div>

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

<style scoped>
.viewer-layout {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: #1a1a1a;
  overflow: hidden;
}

.video-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.controls {
  padding: 1rem;
  background: #1a1a1a;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

.leave-btn {
  width: 100%;
  padding: 1rem;
  background: #ff4646;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.leave-btn:hover {
  background: #ff3333;
}

@media (min-width: 768px) {
  .viewer-layout {
    flex-direction: row;
  }

  .video-wrapper {
    flex: 1;
  }

  .controls {
    width: 250px;
    border-top: none;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .leave-btn {
    margin-top: auto;
  }
}

@media (orientation: landscape) and (max-height: 450px) {
  .viewer-layout {
    flex-direction: row;
  }

  .controls {
    width: 200px;
  }

  .leave-btn {
    padding: 0.75rem;
  }
}
</style>
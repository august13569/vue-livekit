import { ref } from 'vue'
import {
  Room,
  RoomEvent,
  LocalParticipant,
  RemoteParticipant,
  ConnectionState,
  ConnectionQuality,
  Track,
  createLocalTracks,
  VideoPresets,
  VideoQuality
} from 'livekit-client'
import { useStreamStore } from '@/stores/stream'

export function useLiveKit() {
  const store = useStreamStore()
  const room = ref<Room | null>(null)
  const localParticipant = ref<LocalParticipant | null>(null)
  const connectionState = ref<ConnectionState>(ConnectionState.Disconnected)
  const error = ref<string>('')

  /**
   * 初始化並連接到 LiveKit 房間
   */
  const connectToRoom = async (mediaStream: MediaStream) => {
    try {
      if (!store.token || !store.wsURL) {
        throw new Error('缺少必要的連線資訊')
      }

      // 建立新的 Room 實例，加入完整的自適應串流設定
      room.value = new Room({
        // 啟用自適應串流 - 自動根據網路條件調整品質
        adaptiveStream: {
          // 啟用自適應串流
          enabled: true,
          // 設定最低品質閾值
          minQuality: VideoQuality.LOW,
          // 設定最高品質閾值
          maxQuality: VideoQuality.HIGH,
          // 設定品質調整的敏感度 (1-10，越高越敏感)
          sensitivity: 5,
          // 設定切換品質的延遲時間（毫秒）
          switchDelay: 3000
        },

        // 啟用動態串流 - 根據觀眾的接收能力動態調整
        dynacast: true,

        // 發布設定
        publishDefaults: {
          // 啟用 simulcast 以支援不同品質層級
          simulcast: true,
          // 使用 h264 編碼器
          videoCodec: 'h264',
          
          // 設定視訊品質預設 - 提供多個品質層級供自動切換
          videoSimulcastLayers: [
            VideoPresets.h1080, // 高品質
            VideoPresets.h720,  // 中品質
            VideoPresets.h540,  // 低品質
            VideoPresets.h360   // 最低品質
          ],

          // 設定視訊編碼參數
          videoEncoding: {
            maxBitrate: 3_000_000,    // 最大 3 Mbps
            minBitrate: 150_000,      // 最小 150 Kbps
            maxFramerate: 30,
            priority: 'balanced'      // 平衡品質和效能
          },

          // 設定音訊編碼參數
          audioEncoding: {
            maxBitrate: 128_000,     // 最大 128 Kbps
            minBitrate: 32_000,      // 最小 32 Kbps
            priority: 'balanced'
          }
        },

        // 連線重試設定
        reconnectPolicy: {
          maxRetries: 3,
          timeoutMS: 10000,
          backoff: {
            initial: 1000,    // 初始重試延遲
            max: 10000,       // 最大重試延遲
            multiplier: 1.5   // 延遲增長倍數
          }
        }
      })

      // 設置事件監聽
      setupRoomListeners()

      // 連接到房間
      await room.value.connect(store.wsURL, store.token)
      console.log('已連接到 LiveKit 房間')

      // 取得本地參與者
      localParticipant.value = room.value.localParticipant

      // 發布媒體軌道
      await publishMediaTracks(mediaStream)

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '連接到直播房間時發生錯誤'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 設置房間事件監聽器
   */
  const setupRoomListeners = () => {
    if (!room.value) return

    room.value
      .on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        connectionState.value = state
        console.log('連線狀態變更:', state)
      })
      .on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality, participant: RemoteParticipant) => {
        console.log('連線品質變更:', {
          quality,
          participant: participant.identity
        })
      })
      .on(RoomEvent.TrackSubscribed, (track: Track, publication, participant: RemoteParticipant) => {
        console.log('訂閱軌道:', {
          trackSid: track.sid,
          encodings: publication.encodings,
          participant: participant.identity
        })
      })
      .on(RoomEvent.Disconnected, () => {
        console.log('已斷開連線')
      })
      .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('觀眾加入:', participant.identity)
        store.updateViewers(room.value?.participants.size || 0)
      })
      .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('觀眾離開:', participant.identity)
        store.updateViewers(room.value?.participants.size || 0)
      })
  }

  /**
   * 發布媒體軌道
   */
  const publishMediaTracks = async (mediaStream: MediaStream) => {
    if (!localParticipant.value) return

    try {
      const videoTrack = mediaStream.getVideoTracks()[0]
      const audioTrack = mediaStream.getAudioTracks()[0]

      if (videoTrack) {
        await localParticipant.value.publishTrack(videoTrack, {
          simulcast: true,
          videoEncoding: {
            maxBitrate: 3_000_000,
            minBitrate: 150_000,
            maxFramerate: 30,
            priority: 'balanced'
          }
        })
      }
      
      if (audioTrack) {
        await localParticipant.value.publishTrack(audioTrack, {
          audioEncoding: {
            maxBitrate: 128_000,
            minBitrate: 32_000,
            priority: 'balanced'
          }
        })
      }

      console.log('媒體軌道發布成功')
    } catch (err) {
      console.error('發布媒體軌道時發生錯誤:', err)
      throw err
    }
  }

  /**
   * 斷開連線並清理資源
   */
  const disconnect = async () => {
    if (room.value) {
      await room.value.disconnect()
      room.value = null
    }
    localParticipant.value = null
    connectionState.value = ConnectionState.Disconnected
  }

  return {
    room,
    localParticipant,
    connectionState,
    error,
    connectToRoom,
    disconnect
  }
}
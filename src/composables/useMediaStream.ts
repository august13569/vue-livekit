import { ref, onUnmounted } from 'vue'
import type { MediaConfig } from '@/types/stream'

// 處理媒體串流相關的邏輯
export function useMediaStream(config: MediaConfig) {
  const stream = ref<MediaStream | null>(null)
  const error = ref<string>('')

  // 初始化媒體串流
  const initializeStream = async () => {
    try {
      // 如果已經有串流，先清理掉
      if (stream.value) {
        cleanupStream()
      }

      // 擴展媒體配置，加入更多品質相關的設定
      const enhancedConfig: MediaStreamConstraints = {
        video: {
          ...config.video,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 24 },
          // 設定較高的碼率
          bitrate: { ideal: 2500000, min: 1000000 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // 設定音訊碼率
          bitrate: { ideal: 128000, min: 64000 }
        }
      }

      // 取得新的媒體串流
      const newStream = await navigator.mediaDevices.getUserMedia(enhancedConfig)
      
      // 等待視訊軌道準備完成
      if (newStream.getVideoTracks().length > 0) {
        const videoTrack = newStream.getVideoTracks()[0]
        
        // 設定視訊軌道的約束
        await videoTrack.applyConstraints({
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        })

        // 等待視訊軌道設定完成
        await new Promise<void>((resolve) => {
          const checkSettings = () => {
            const settings = videoTrack.getSettings()
            if (settings.width && settings.height) {
              resolve()
            } else {
              setTimeout(checkSettings, 100)
            }
          }
          checkSettings()
        })
      }

      stream.value = newStream
      error.value = ''
    } catch (err) {
      error.value = '無法存取媒體設備'
      console.error('媒體設備存取錯誤:', err)
      throw err
    }
  }

  // 清理媒體串流
  const cleanupStream = () => {
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
      stream.value = null
    }
  }

  // 重新初始化串流
  const reinitializeStream = async () => {
    await initializeStream()
  }

  onUnmounted(() => {
    cleanupStream()
  })

  return {
    stream,
    error,
    initializeStream,
    reinitializeStream,
    cleanupStream
  }
}
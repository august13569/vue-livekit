import { ref } from 'vue'
import type { Ref } from 'vue'

// 處理錄影相關的邏輯
export function useRecording(stream: Ref<MediaStream | null>) {
  const isRecording = ref(false)
  const recordedChunks = ref<BlobPart[]>([])
  const recordedVideoUrl = ref<string>('')
  const mediaRecorder = ref<MediaRecorder | null>(null)

  // 取得支援的媒體格式
  const getMimeType = () => {
    const types = [
      'video/mp4;codecs=h264,aac',
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=vp8,opus'
    ]
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    
    return ''
  }

  // 清理舊的錄影資源
  const cleanupOldRecording = () => {
    if (recordedVideoUrl.value) {
      URL.revokeObjectURL(recordedVideoUrl.value)
      recordedVideoUrl.value = ''
    }
    recordedChunks.value = []
  }

  // 開始錄影
  const startRecording = async () => {
    if (!stream.value || isRecording.value) return
    
    // 清理舊的錄影
    cleanupOldRecording()
    
    isRecording.value = true
    
    const mimeType = getMimeType()
    const options = mimeType ? { mimeType } : undefined
    
    try {
      mediaRecorder.value = new MediaRecorder(stream.value, options)
      
      mediaRecorder.value.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.value.push(e.data)
        }
      }
      
      mediaRecorder.value.onstop = () => {
        const blob = new Blob(recordedChunks.value, { type: 'video/mp4' })
        recordedVideoUrl.value = URL.createObjectURL(blob)
        isRecording.value = false
      }
      
      mediaRecorder.value.start()
    } catch (error) {
      console.error('錄影開始錯誤:', error)
      isRecording.value = false
    }
  }

  // 停止錄影
  const stopRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop()
    }
  }

  // 下載錄影檔案
  const downloadRecording = () => {
    if (recordedVideoUrl.value) {
      const a = document.createElement('a')
      a.href = recordedVideoUrl.value
      a.download = `recording-${new Date().toISOString()}.mp4`
      a.click()
    }
  }

  // 刪除錄影
  const deleteRecording = () => {
    cleanupOldRecording()
  }

  return {
    isRecording,
    recordedVideoUrl,
    startRecording,
    stopRecording,
    downloadRecording,
    deleteRecording
  }
}
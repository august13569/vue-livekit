import { ref } from 'vue'
import axios, { AxiosError } from 'axios'
import { useStreamStore } from '@/stores/stream'
import { useLiveKitConnection } from '@/composables/useLiveKitConnection'
import type { RoomResponse } from '@/types/stream'

/**
 * 房間管理 Composable
 * 處理房間的建立、刪除等相關功能
 */
export function useRoom() {
  // === 狀態管理 ===
  const currentRoomId = ref<string>('') // 當前房間ID
  const error = ref<string>('') // 錯誤訊息
  const store = useStreamStore() // 全域狀態管理
  const { initializeConnection } = useLiveKitConnection() // LiveKit 連線管理
  
  // 從環境變數獲取 API 基礎網址
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

  /**
   * 產生隨機四位數房間名稱
   * @returns {string} 4位數字的房間名稱
   */
  const generateRoomName = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  /**
   * 建立新房間
   * @returns {Promise<{success: boolean, error?: string}>} 建立結果
   */
  const createRoom = async () => {
    const roomName = generateRoomName()
    
    try {
      // 發送建立房間請求
      const response = await axios<RoomResponse>({
        url: `${apiBaseUrl}/createRoom`,
        method: 'post',
        headers: { 'Content-type': 'application/x-www-form-urlencoded' },
        data: { roomName }
      })
      
      // 更新狀態
      currentRoomId.value = roomName
      store.setRoomSid(response.data.sid)
      error.value = ''
      
      return { success: true }
    } catch (err) {
      const axiosError = err as AxiosError
      let errorMessage = '建立房間失敗'

      // 根據錯誤類型提供詳細錯誤訊息
      if (axiosError.response) {
        errorMessage = `伺服器錯誤 (${axiosError.response.status}): ${
          (axiosError.response.data as any)?.message || axiosError.response.statusText
        }`
      } else if (axiosError.request) {
        errorMessage = '無法連接到伺服器，請檢查網路連線'
      } else {
        errorMessage = `發生錯誤: ${axiosError.message}`
      }

      currentRoomId.value = ''
      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 初始化直播所需的所有資源
   * @returns {Promise<{success: boolean, error?: string}>} 初始化結果
   */
  const initializeStream = async () => {
    if (!currentRoomId.value) {
      return { success: false, error: '尚未建立房間' }
    }

    // 使用共用的 LiveKit 連線邏輯，指定為直播主
    const result = await initializeConnection(currentRoomId.value, true)

    if (!result.success) {
      error.value = result.error || '初始化串流失敗'
      return { success: false, error: error.value }
    }

    // 將連線資訊保存到 store
    store.setToken(result.token)
    store.setWsURL(result.url)
    
    return { success: true }
  }

  /**
   * 恢復直播會話
   * 用於頁面重新載入時恢復直播狀態
   * @returns {Promise<{success: boolean, error?: string}>} 恢復結果
   */
  const restoreSession = async () => {
    const savedRoomId = localStorage.getItem('roomId')
    if (!savedRoomId) {
      return { success: false, error: '找不到已儲存的房間資訊' }
    }

    // 設置房間 ID
    currentRoomId.value = savedRoomId

    // 重新初始化串流資源
    return initializeStream()
  }

  /**
   * 刪除當前房間
   * 清除所有相關狀態
   */
  const deleteRoom = () => {
    currentRoomId.value = ''
    store.clearStreamData()
    localStorage.removeItem('roomId')
    localStorage.removeItem('isLive')
  }

  return {
    currentRoomId,
    error,
    createRoom,
    deleteRoom,
    initializeStream,
    restoreSession
  }
}
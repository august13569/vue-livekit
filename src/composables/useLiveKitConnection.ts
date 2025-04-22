import { ref } from 'vue'
import axios, { AxiosError } from 'axios'

// 從環境變數獲取 API 基礎網址
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export function useLiveKitConnection() {
  const token = ref<string>('')
  const wsURL = ref<string>('')
  const error = ref<string>('')

  /**
   * 生成7位隨機數字
   */
  const generateRandomId = (): string => {
    return Math.floor(Math.random() * 9000000 + 1000000).toString()
  }

  /**
   * 取得 LiveKit Token
   * @param roomName - 房間名稱
   * @param isStreamer - 是否為直播主
   */
  const getToken = async (roomName: string, isStreamer: boolean) => {
    try {
      // 根據角色生成參與者名稱
      const participantName = isStreamer 
        ? `streamer-${roomName}`
        : `viewer-${roomName}-${generateRandomId()}`

      const response = await axios({
        url: `${apiBaseUrl}/getToken`,
        method: 'post',
        headers: { 'Content-type': 'application/x-www-form-urlencoded' },
        data: {
          roomName,
          participantName
        }
      })

      token.value = response.data.token
      return { success: true, token: response.data.token }
    } catch (err) {
      const axiosError = err as AxiosError
      const errorMessage = '取得 Token 失敗: ' + (axiosError.response?.data?.message || axiosError.message)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 取得 WebSocket URL
   */
  const getUrl = async () => {
    try {
      const response = await axios({
        url: `${apiBaseUrl}/getUrl`,
        method: 'get',
        headers: { 'Content-type': 'application/x-www-form-urlencoded' }
      })

      wsURL.value = response.data.url
      return { success: true, url: response.data.url }
    } catch (err) {
      const axiosError = err as AxiosError
      const errorMessage = '取得 URL 失敗: ' + (axiosError.response?.data?.message || axiosError.message)
      error.value = errorMessage
      return { success: false, error: errorMessage }
    }
  }

  /**
   * 初始化連線資訊
   * @param roomName - 房間名稱
   * @param isStreamer - 是否為直播主
   */
  const initializeConnection = async (roomName: string, isStreamer: boolean) => {
    // 1. 取得 Token
    const tokenResult = await getToken(roomName, isStreamer)
    if (!tokenResult.success) {
      return tokenResult
    }

    // 2. 取得 WebSocket URL
    const urlResult = await getUrl()
    if (!urlResult.success) {
      return urlResult
    }

    return {
      success: true,
      token: tokenResult.token,
      url: urlResult.url
    }
  }

  return {
    token,
    wsURL,
    error,
    initializeConnection,
    getToken,
    getUrl
  }
}
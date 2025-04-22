import { ref } from 'vue'
import axios from 'axios'

// 從環境變數獲取 API 基礎網址 
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

interface Room {
  sid: string
  name: string
  numParticipants: number
}

export function useRoomApi() {
  const rooms = ref<Room[]>([])
  const isLoading = ref(false)
  const error = ref<string>('')

  const getRoomList = async () => {
    isLoading.value = true
    error.value = ''
    
    try {
      const response = await axios({
        url: `${apiBaseUrl}/getRoomList`,
        method: 'get'
      })
      rooms.value = response.data.list
      console.log(response.data.list)
      return { success: true, data: response.data.list }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '獲取房間列表失敗'
      error.value = errorMessage
      console.error('獲取房間列表失敗:', err)
      return { success: false, error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  return {
    rooms,
    isLoading,
    error,
    getRoomList
  }
}
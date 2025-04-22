import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RoomInfo } from '@/types/stream'

export const useStreamStore = defineStore('stream', () => {
  // === 基本狀態 ===
  const activeRooms = ref<Map<string, RoomInfo>>(new Map())
  const currentViewers = ref<number>(0)
  const streamDuration = ref<number>(0)
  const isLive = ref<boolean>(false)
  const roomSid = ref<string>('')

  // === 直播連線狀態 ===
  const token = ref<string>('')
  const wsURL = ref<string>('')

  // === 房間操作方法 ===
  const addRoom = (roomInfo: RoomInfo) => {
    activeRooms.value.set(roomInfo.id, roomInfo)
  }

  const removeRoom = (roomId: string) => {
    activeRooms.value.delete(roomId)
  }

  // === 直播狀態更新方法 ===
  const updateViewers = (count: number) => {
    currentViewers.value = count
  }

  const updateDuration = (duration: number) => {
    streamDuration.value = duration
  }

  const setLiveStatus = (status: boolean) => {
    isLive.value = status
  }

  const setRoomSid = (sid: string) => {
    roomSid.value = sid
  }

  // === 直播連線狀態更新方法 ===
  const setToken = (newToken: string) => {
    token.value = newToken
  }

  const setWsURL = (url: string) => {
    wsURL.value = url
  }

  // === 清理方法 ===
  const clearStreamData = () => {
    token.value = ''
    wsURL.value = ''
    roomSid.value = ''
    isLive.value = false
  }

  const getRoomList = computed(() => Array.from(activeRooms.value.values()))

  return {
    // 狀態
    activeRooms,
    currentViewers,
    streamDuration,
    isLive,
    roomSid,
    token,
    wsURL,
    
    // 方法
    addRoom,
    removeRoom,
    updateViewers,
    updateDuration,
    setLiveStatus,
    setRoomSid,
    setToken,
    setWsURL,
    clearStreamData,
    getRoomList
  }
})
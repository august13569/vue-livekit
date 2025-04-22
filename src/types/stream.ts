// 定義直播相關的型別
export interface RoomInfo {
  id: string
  broadcasterName: string
  viewers: number
  duration: number
}

export interface StreamState {
  isLive: boolean
  currentViewers: number
  duration: number
  roomId: string | null
}

export interface MediaConfig {
  video: {
    aspectRatio: number
    width: { ideal: number }
    height: { ideal: number }
  }
  audio: boolean
}

export interface RecordingState {
  isRecording: boolean
  recordedVideoUrl: string | null
}

// API 回應型別
export interface RoomResponse {
  sid: string
  name: string
}
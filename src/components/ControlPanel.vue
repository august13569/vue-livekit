<script setup lang="ts">
import { ref } from 'vue'
import type { RecordingState } from '@/types/stream'

const props = defineProps<{
  isLive: boolean
  currentRoomId: string
  recordingState: RecordingState
}>()

const emit = defineEmits<{
  'create-room': []
  'delete-room': []
  'start-stream': []
  'stop-stream': []
  'start-recording': []
  'stop-recording': []
  'download-recording': []
  'delete-recording': []
}>()

const activeTab = ref('stream') // 'stream' or 'recording'
</script>

<template>
  <div class="control-panel">
    <div class="tabs">
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'stream' }"
        @click="activeTab = 'stream'"
      >
        直播控制
      </button>
      <button 
        class="tab-btn" 
        :class="{ active: activeTab === 'recording' }"
        @click="activeTab = 'recording'"
      >
        錄影控制
      </button>
    </div>

    <div class="tab-content">
      <!-- 直播控制頁面 -->
      <div v-show="activeTab === 'stream'" class="control-section">
        <div class="stream-controls">
          <button 
            @click="emit('create-room')" 
            class="create-room-btn control-btn"
            :disabled="currentRoomId !== ''"
          >
            建立房間
          </button>
          <button 
            @click="emit('start-stream')" 
            class="start-stream-btn control-btn"
            :disabled="isLive || !currentRoomId"
          >
            開始直播
          </button>
          <button 
            @click="emit('stop-stream')" 
            class="stop-stream-btn control-btn"
            :disabled="!isLive"
          >
            結束直播
          </button>
          <button 
            @click="emit('delete-room')" 
            class="delete-room-btn control-btn"
            :disabled="!currentRoomId"
          >
            刪除房間
          </button>
        </div>
      </div>

      <!-- 錄影控制頁面 -->
      <div v-show="activeTab === 'recording'" class="control-section">
        <div class="recording-controls">
          <button 
            :disabled="recordingState.isRecording" 
            @click="emit('start-recording')"
            class="record-btn control-btn"
          >
            開始錄影
          </button>
          <button 
            :disabled="!recordingState.isRecording" 
            @click="emit('stop-recording')"
            class="stop-record-btn control-btn"
          >
            停止錄影
          </button>
          <button 
            :disabled="!recordingState.recordedVideoUrl" 
            @click="emit('download-recording')"
            class="download-btn control-btn"
          >
            下載錄影
          </button>
          <button 
            :disabled="!recordingState.recordedVideoUrl" 
            @click="emit('delete-recording')"
            class="delete-btn control-btn"
          >
            刪除錄影
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  background: #1a1a1a;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: rgba(255, 255, 255, 0.1);
  padding: 1px;
  border-radius: 8px;
  margin: 1rem;
}

.tab-btn {
  padding: 0.75rem;
  background: #1a1a1a;
  border: none;
  color: #888;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:first-child {
  border-radius: 8px 0 0 8px;
}

.tab-btn:last-child {
  border-radius: 0 8px 8px 0;
}

.tab-btn.active {
  background: #646cff;
  color: white;
}

.tab-content {
  flex: 1;
  padding: 0 1rem 1rem;
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recording-controls,
.stream-controls {
  display: grid;
  gap: 0.75rem;
}

.control-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-height: 44px;
  border: none;
  position: relative;
  overflow: hidden;
  color: white;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(rgba(255, 255, 255, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}

.control-btn:not(:disabled):hover::before {
  opacity: 1;
}

/* 錄影相關按鈕 */
.record-btn {
  background: #ff4646;
}

.stop-record-btn {
  background: #666;
}

.download-btn {
  background: #4CAF50;
}

.delete-btn {
  background: #ff4646;
}

/* 直播相關按鈕 */
.create-room-btn {
  background: #646cff;
}

.start-stream-btn {
  background: #4CAF50;
}

.stop-stream-btn {
  background: #ff4646;
}

.delete-room-btn {
  background: #666;
}

/* 桌面版排版 */
@media (min-width: 768px) {
  .control-panel {
    width: 300px;
    height: 100%;
  }
  
  .recording-controls,
  .stream-controls {
    grid-template-columns: 1fr;
  }
}

/* 手機版排版 */
@media (max-width: 767px) {
  .recording-controls,
  .stream-controls {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}

/* 確保在較小的手機螢幕上按鈕仍然可以完整顯示 */
@media (max-width: 360px) {
  .recording-controls,
  .stream-controls {
    grid-template-columns: 1fr;
  }
}
</style>
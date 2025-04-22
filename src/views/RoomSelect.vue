<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomApi } from '@/composables/useRoomApi'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import RoomList from '@/components/RoomList.vue'

const router = useRouter()
const { rooms, isLoading, error, getRoomList } = useRoomApi()

const handleRoomSelect = (roomId: string) => {
  router.push(`/view/${roomId}`)
}

// 定期更新房間列表
let updateInterval: number | null = null

onMounted(() => {
  getRoomList()
  // 每 10 秒更新一次房間列表
  updateInterval = window.setInterval(getRoomList, 10000)
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<template>
  <div class="room-select-container">
    <h1>可用直播間</h1>
    
    <LoadingSpinner v-if="isLoading && !rooms.length" text="載入房間列表中..." />
    
    <div v-else-if="error" class="error-message">
      {{ error }}
      <button @click="getRoomList" class="retry-btn">重試</button>
    </div>
    
    <div v-else-if="!rooms.length" class="empty-message">
      目前沒有進行中的直播
    </div>
    
    <RoomList
      v-else
      :rooms="rooms"
      @select="handleRoomSelect"
    />
  </div>
</template>

<style scoped>
.room-select-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.error-message {
  text-align: center;
  color: #ff4646;
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 70, 70, 0.1);
  border-radius: 8px;
}

.empty-message {
  text-align: center;
  color: #888;
  margin-top: 2rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background: #ff4646;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}

@media (max-width: 768px) {
  .room-select-container {
    padding: 1rem;
  }

  h1 {
    font-size: 1.75rem;
    text-align: center;
  }
}
</style>
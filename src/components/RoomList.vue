<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

interface Room {
  sid: string
  name: string
  numParticipants: number
}

defineProps<{
  rooms: Room[]
}>()

const emit = defineEmits<{
  (e: 'select', roomId: string): void
}>()
</script>

<template>
  <div class="room-grid">
    <div 
      v-for="room in rooms" 
      :key="room.sid"
      class="room-card"
      @click="emit('select', room.name)"
    >
      <div class="room-header">
        <h2>直播間 {{ room.name }}</h2>
      </div>
      
      <div class="room-info">
        <div class="info-item">
          <span class="info-label">房間ID</span>
          <span class="info-value">{{ room.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.room-card {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.room-card:hover {
  transform: translateY(-2px);
  border-color: #646cff;
  box-shadow: 0 4px 12px rgba(100, 108, 255, 0.1);
}

.room-header {
  margin-bottom: 1rem;
}

.room-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #fff;
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  color: #888;
  font-size: 0.9rem;
}

.info-value {
  color: #fff;
  font-weight: 500;
}

@media (max-width: 768px) {
  .room-grid {
    grid-template-columns: 1fr;
  }
}
</style>
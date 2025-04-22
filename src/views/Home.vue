<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateToBroadcast = () => router.push('/broadcast')
const navigateToRooms = () => router.push('/rooms')
</script>

<template>
  <div class="home-container">
    <h1>LiveKit POC</h1>
    <div class="button-container">
      <button class="primary-btn" @click="navigateToBroadcast">
        建立直播
      </button>
      <button class="secondary-btn" @click="navigateToRooms">
        觀看直播
      </button>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 2rem);
  gap: 2rem;
  padding: 1rem;
}

.button-container {
  display: flex;
  flex-direction: row;
  gap: 1rem;
}

@media (max-width: 600px) {
  .button-container {
    flex-direction: column;
    width: 100%;
  }

  .primary-btn, .secondary-btn {
    width: 100%;
  }

  h1 {
    font-size: 2rem;
    text-align: center;
  }
}
.primary-btn, .secondary-btn {
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.primary-btn {
  background: #646cff;
  color: white;
}

.secondary-btn {
  background: transparent;
  border: 2px solid #646cff;
  color: #646cff;
}

.primary-btn:hover, .secondary-btn:hover {
  transform: translateY(-2px);
}
</style>
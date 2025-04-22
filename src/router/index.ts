import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Broadcaster from '../views/Broadcaster.vue'
import RoomSelect from '../views/RoomSelect.vue'
import Viewer from '../views/Viewer.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/broadcast',
      name: 'broadcast',
      component: Broadcaster
    },
    {
      path: '/rooms',
      name: 'rooms',
      component: RoomSelect
    },
    {
      path: '/view/:roomId',
      name: 'viewer',
      component: Viewer,
      props: true
    }
  ]
})

export default router
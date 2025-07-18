# 直播平台專案筆記 📝

## 使用技術 🛠

### 主要框架
- Vue.js (v3.4.38)
- TypeScript (v5.5.3)
- Vite (v5.4.2)

### 狀態管理
- Pinia (v2.1.7)

### 路由管理
- Vue Router (v4.3.0)

### 網路請求
- Axios (v1.6.8)
- Socket.IO Client (v4.7.4)

## 專案結構 📂

```
src/
├── assets/          # 靜態資源
├── components/      # 共用元件
│   ├── ControlPanel.vue    # 控制面板元件
│   ├── LoadingSpinner.vue  # 載入動畫元件
│   └── VideoPlayer.vue     # 影片播放器元件
├── composables/     # 可重用的邏輯組合函式
│   ├── useLoading.ts       # 載入狀態管理
│   ├── useMediaStream.ts   # 媒體串流處理
│   ├── useRecording.ts     # 錄影功能
│   └── useRoom.ts          # 房間管理
├── router/          # 路由配置
├── stores/          # Pinia 狀態管理
│   └── stream.ts           # 直播相關狀態
├── types/           # TypeScript 型別定義
├── views/           # 頁面元件
│   ├── Broadcaster.vue     # 直播主頁面
│   ├── Home.vue           # 首頁
│   ├── RoomSelect.vue     # 房間選擇頁面
│   └── Viewer.vue         # 觀眾觀看頁面
├── App.vue          # 根元件
├── main.ts          # 應用程式入口
└── style.css        # 全域樣式

```

## 環境變數 🔑
```env
VITE_API_BASE_URL      # API 基礎網址
```

## 功能特點 ✨

- 直播功能
  - 建立/刪除直播房間
  - 開始/結束直播
  - 觀看直播

- 錄影功能
  - 開始/停止錄影
  - 下載錄影檔案

- 使用者介面
  - 響應式設計（支援桌面/手機）
  - Loading 動畫
  - 分頁式控制面板

## 開發筆記 📌

1. 使用 Vue 3 Composition API + TypeScript 開發
2. 採用 Pinia 進行狀態管理，方便管理直播相關狀態
3. 使用 Vue Router 處理頁面路由
4. 實作 WebRTC 相關功能處理直播串流
5. 使用 composables 模式拆分邏輯，提高程式碼重用性

import { ref } from 'vue'

export function useLoading() {
  const isLoading = ref(false)
  const loadingText = ref('')

  const startLoading = (text = '') => {
    loadingText.value = text
    isLoading.value = true
  }

  const stopLoading = () => {
    isLoading.value = false
    loadingText.value = ''
  }

  // 包裝 async 函數，自動處理 loading 狀態
  const withLoading = async <T>(
    fn: () => Promise<T>,
    text = ''
  ): Promise<T> => {
    try {
      startLoading(text)
      return await fn()
    } finally {
      stopLoading()
    }
  }

  return {
    isLoading,
    loadingText,
    startLoading,
    stopLoading,
    withLoading
  }
}
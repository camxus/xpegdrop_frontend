export function getLocalStorage(key: string) {
  if (typeof window === "undefined") return null

  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return null
  }
}

export function setLocalStorage(key: string, value: any) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error("Error writing to localStorage:", error)
  }
}

export function removeLocalStorage(key: string) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    console.error("Error removing from localStorage:", error)
  }
}

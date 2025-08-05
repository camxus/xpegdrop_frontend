// Mock API client - replace with your actual API client
export const api = {
  get: async (url: string, options?: { params?: any }): Promise<any> => {
    // Mock implementation
    throw new Error("API client not implemented")
  },
  post: async (url: string, data?: any): Promise<any> => {
    // Mock implementation
    throw new Error("API client not implemented")
  },
  put: async (url: string, data?: any): Promise<any> => {
    // Mock implementation
    throw new Error("API client not implemented")
  },
  delete: async (url: string): Promise<any> => {
    // Mock implementation
    throw new Error("API client not implemented")
  },
}

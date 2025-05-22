// API endpoint'leri için temel URL
const API_URL = "/api/proxy" // Next.js API proxy'mizi kullanıyoruz

// API isteği için yardımcı fonksiyon
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  try {
    console.log(`Fetching: ${API_URL}/${endpoint}`)
    const response = await fetch(`${API_URL}/${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    console.log(`Response status: ${response.status}`)

    // 204 No Content yanıtı için boş dizi döndür
    if (response.status === 204) {
      return []
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const text = await response.text()

    // Boş yanıt kontrolü
    if (!text.trim()) {
      return {}
    }

    try {
      return JSON.parse(text)
    } catch (e) {
      console.error("JSON parse error:", e)
      console.log("Full response text:", text)
      throw new Error("Invalid JSON response")
    }
  } catch (error) {
    console.error("Fetch error:", error)
    throw error
  }
}

// Kullanıcı API'si
export const userAPI = {
  login: async (credentials: { username: string; password: string }) => {
    return fetchAPI("auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  register: async (userData: { username: string; email: string; password: string }) => {
    return fetchAPI("auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },

  getProfile: async (userId: string) => {
    return fetchAPI(`users/${userId}`)
  },

  updateProfile: async (userId: string, profileData: any) => {
    return fetchAPI(`users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(profileData),
    })
  },
}

// Odalar (Kulüpler) API'si
export const roomsAPI = {
  getAll: async () => {
    return fetchAPI("rooms")
  },

  getById: async (roomId: string) => {
    return fetchAPI(`rooms/${roomId}`)
  },

  create: async (roomData: any) => {
    return fetchAPI("rooms", {
      method: "POST",
      body: JSON.stringify(roomData),
    })
  },

  update: async (roomId: string, roomData: any) => {
    return fetchAPI(`rooms/${roomId}`, {
      method: "PUT",
      body: JSON.stringify(roomData),
    })
  },

  delete: async (roomId: string) => {
    return fetchAPI(`rooms/${roomId}`, {
      method: "DELETE",
    })
  },

  join: async (roomId: string, userId: string) => {
    return fetchAPI(`rooms/${roomId}/join`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  },

  leave: async (roomId: string, userId: string) => {
    return fetchAPI(`rooms/${roomId}/leave`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  },
}

// Akış (Stream) API'si
export const streamAPI = {
  getAll: async () => {
    return fetchAPI("streams")
  },

  getById: async (streamId: string) => {
    return fetchAPI(`streams/${streamId}`)
  },

  create: async (streamData: any) => {
    return fetchAPI("streams", {
      method: "POST",
      body: JSON.stringify(streamData),
    })
  },

  update: async (streamId: string, streamData: any) => {
    return fetchAPI(`streams/${streamId}`, {
      method: "PUT",
      body: JSON.stringify(streamData),
    })
  },

  delete: async (streamId: string) => {
    return fetchAPI(`streams/${streamId}`, {
      method: "DELETE",
    })
  },
}

// Mesaj API'si
export const messageAPI = {
  getRoomMessages: async (roomId: string) => {
    return fetchAPI(`messages/room/${roomId}`)
  },

  sendMessage: async (roomId: string, message: { userId: string; content: string }) => {
    return fetchAPI(`messages/room/${roomId}`, {
      method: "POST",
      body: JSON.stringify(message),
    })
  },
}

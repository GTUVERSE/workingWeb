// lib/api-service.ts

const API_URL = "/api/proxy"; // Proxy endpoint'iniz

/**
 * API'ye genel istekleri yönetmek için kullanılan yardımcı fonksiyon.
 * Proxy üzerinden backend'e istek atar.
 * Başarılı yanıtları { data: ... } yapısından çıkarır.
 * Hata durumlarını yönetir.
 * @param endpoint Hedef API endpoint'i (örn: "users", "rooms/123").
 * @param options Standart fetch API seçenekleri (method, body, headers vb.).
 * @returns Promise<any> - API'den gelen veri.
 */
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  try {
    console.log(`[API Service] Fetching via Proxy: ${API_URL}/${endpoint}`);
    const response = await fetch(`${API_URL}/${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        // Authorization header'ı options.headers üzerinden veya
        // getTokenFromRequest gibi bir yardımcı ile eklenebilir (route.ts'de olduğu gibi)
        // Eğer token'ı burada global olarak eklemek isterseniz, bir token yönetim mekanizmasına ihtiyacınız olur.
        // Şimdilik, token'ın proxy (route.ts) katmanında eklendiğini varsayıyoruz.
        ...options.headers,
      },
    });

    console.log(`[API Service] Proxy Response Status for ${endpoint}: ${response.status}`);

    if (response.status === 204) {
      // 204 No Content durumu için.
      // Liste beklenen GET istekleri için boş dizi, diğerleri için null daha mantıklı olabilir.
      // Şimdilik genel bir [] döndürüyoruz, çağıran fonksiyon bunu yorumlayabilir.
      return [];
    }

    const jsonResponse = await response.json();

    if (!response.ok) {
      // HTTP hata durumları (4xx, 5xx)
      // Proxy'nin { error: "mesaj" } formatında hata döndürdüğü varsayılır.
      const errorMessage = jsonResponse.error || `API Error: ${response.status} ${response.statusText || 'Bilinmeyen Hata'}`;
      console.error(`[API Service] API Error from proxy for ${endpoint}:`, errorMessage, jsonResponse);
      throw new Error(errorMessage);
    }

    // Proxy başarılı yanıtları 'data' alanı içinde sarmalar (route.ts'deki yapıya göre)
    if (jsonResponse.hasOwnProperty('data')) {
      return jsonResponse.data;
    } else {
      // Proxy'nin yapısı gereği bu durumun oluşmaması beklenir, ama bir fallback.
      console.warn(`[API Service] Proxy response for ${endpoint} successful, but 'data' field is missing.`, jsonResponse);
      return jsonResponse;
    }

  } catch (error: any) {
    console.error(`[API Service] FetchAPI critical error for endpoint '${endpoint}':`, error.message);
    if (error instanceof Error) {
      throw error; // Zaten bir Error nesnesi ise tekrar fırlat
    }
    // Değilse, string mesajı ile yeni bir Error nesnesi oluştur
    throw new Error(String(error.message || `API isteği sırasında bilinmeyen bir hata oluştu: ${endpoint}`));
  }
};

// --- User API ---
export const userAPI = {
  login: async (credentials: { username: string; password: string }) => {
    return fetchAPI("login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData: { username: string; email: string; password: string }) => {
    return fetchAPI("register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  getProfile: async (userId: string | number) => {
    // Backend /users/:id endpoint'ini hedefliyoruz (varsayılan)
    return fetchAPI(`users/${userId}`);
  },

  getAll: async () => {
    return fetchAPI("users");
  },

  getUserRooms: async (userId: string | number) => {
    // Backend /usersWEB/:userId/rooms (oda tipi dahil) endpoint'ini hedefliyoruz
    return fetchAPI(`usersWEB/${userId}/rooms`);
  },

  getByUsername: async (username: string) => {
    return fetchAPI(`users/username/${encodeURIComponent(username)}`);
  },

  updateUsername: async (userId: string | number, newUsername: string) => {
    return fetchAPI(`users/${userId}/username`, {
      method: "PUT",
      body: JSON.stringify({ username: newUsername }),
    });
  }
};

// --- Rooms API ---
export const roomsAPI = {
  getAll: async () => {
    // Backend /roomsWEB (oda tipi dahil) endpoint'ini hedefliyoruz
    return fetchAPI("roomsWEB");
  },

  getById: async (roomId: string | number) => {
    // Backend /roomsWEB/:id (oda tipi dahil) endpoint'ini hedefliyoruz
    return fetchAPI(`roomsWEB/${roomId}`);
  },

  create: async (roomData: { name: string; type: string }) => {
    // Backend POST /rooms endpoint'i name ve type bekliyor
    return fetchAPI("rooms", {
      method: "POST",
      body: JSON.stringify(roomData),
    });
  },

  update: async (roomId: string | number, roomData: any) => {
    // Backend'de PUT /rooms/:id için bir tanım yoktu, genel bir yapı varsayıyoruz.
    // Gerekirse endpoint ve body yapısını backend'e göre güncelleyin.
    // route.ts'de PUT handler'ının olması gerekir.
    return fetchAPI(`rooms/${roomId}`, {
      method: "PUT",
      body: JSON.stringify(roomData),
    });
  },

  delete: async (roomId: string | number) => {
    return fetchAPI(`rooms/${roomId}`, {
      method: "DELETE",
    });
  },

  addUser: async (roomId: string | number, userId: number) => {
    return fetchAPI(`rooms/${roomId}/users`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  },

  getRoomUsers: async (roomId: string | number) => {
    return fetchAPI(`rooms/${roomId}/users`);
  },

  removeUser: async (roomId: string | number, userId: number) => {
    return fetchAPI(`rooms/${roomId}/users/${userId}`, {
      method: "DELETE",
    });
  },

  searchRoomsByType: async (type: string) => {
    if (!type || type.trim() === "") {
      console.warn("[API Service] Search room by type: type is empty, returning empty array.");
      return Promise.resolve([]); // Boş arama için API'ye gitme, boş dizi döndür.
    }
    // Backend GET /rooms/type/:type endpoint'ini hedefliyoruz
    return fetchAPI(`rooms/type/${encodeURIComponent(type.trim())}`);
  },
};

// --- Stream API ---
// Bu API'lar için backend tanımı yoktu, genel CRUD yapısı varsayılmıştır.
export const streamAPI = {
  getAll: async () => {
    return fetchAPI("streams");
  },

  getById: async (streamId: string | number) => {
    return fetchAPI(`streams/${streamId}`);
  },

  create: async (streamData: any) => {
    return fetchAPI("streams", {
      method: "POST",
      body: JSON.stringify(streamData),
    });
  },

  update: async (streamId: string | number, streamData: any) => {
    // route.ts'de PUT handler'ının olması gerekir.
    return fetchAPI(`streams/${streamId}`, {
      method: "PUT",
      body: JSON.stringify(streamData),
    });
  },

  delete: async (streamId: string | number) => {
    return fetchAPI(`streams/${streamId}`, {
      method: "DELETE",
    });
  },
};

// --- Message API ---
// Bu API'lar için backend tanımı (main.cpp'de) yoktu, ClubPage.tsx'in kullandığı varsayılan yapı.
// Backend'de bu endpoint'ler yoksa, bu çağrılar 404 hatası alacaktır.
export const messageAPI = {
  getRoomMessages: async (roomId: string | number) => {
    // Varsayılan endpoint: /messages/room/:roomId
    return fetchAPI(`messages/room/${roomId}`);
  },

  sendMessage: async (roomId: string | number, message: { userId: string | number; content: string }) => {
    // Varsayılan endpoint: POST /messages/room/:roomId
    return fetchAPI(`messages/room/${roomId}`, {
      method: "POST",
      body: JSON.stringify(message),
    });
  },
};
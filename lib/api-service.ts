// File: lib/api-service.ts

const API_URL = "/api/proxy"; // Proxy endpoint'iniz

const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  try {
    console.log(`Workspaceing via Proxy: ${API_URL}/${endpoint}`);
    const response = await fetch(`${API_URL}/${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    console.log(`Proxy Response Status for ${endpoint}: ${response.status}`);

    if (response.status === 204) {
      // Proxy 204 döndürdüğünde (backend'den 204 gelmiş olabilir),
      // genellikle liste beklenen GET istekleri için boş dizi, diğerleri için null mantıklıdır.
      // Şimdilik, liste API'leri için yaygın olan boş bir dizi döndürelim.
      // route.ts, 204 durumunda null body ile yanıt döner.
      // fetchAPI'nin bu durumu ele alması gerekir.
      return []; // Eğer GET isteği ise ve liste bekleniyorsa [] iyi bir varsayılan.
                 // Tek bir kaynak bekleniyorsa null olabilir.
                 // roomsAPI.getAll() gibi liste döndüren fonksiyonlar için bu uygun.
    }

    const jsonResponse = await response.json(); // Proxy'nin her zaman JSON döndürdüğü varsayılır (204 hariç)

    if (!response.ok) { // 4xx, 5xx gibi HTTP hata durumları
      const errorMessage = jsonResponse.error || `API Error: ${response.status} ${response.statusText}`;
      console.error(`API Error from proxy for ${endpoint}:`, errorMessage, jsonResponse);
      throw new Error(errorMessage);
    }

    // Proxy başarılı yanıtları 'data' alanı içinde sarmalar
    if (jsonResponse.hasOwnProperty('data')) {
      return jsonResponse.data;
    } else {
      // Proxy'nin yapısı gereği bu durumun oluşmaması beklenir.
      console.warn(`Proxy response for ${endpoint} successful, but 'data' field is missing.`, jsonResponse);
      return jsonResponse; // Veri doğrudan kök dizindeyse (beklenmedik durum)
    }

  } catch (error: any) {
    console.error(`WorkspaceAPI error for endpoint '${endpoint}':`, error.message);
    // Hatanın bir Error nesnesi olarak yeniden fırlatıldığından emin ol
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error.message || "An unknown error occurred in fetchAPI"));
  }
};

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

  getProfile: async (userId: string) => {
    // Backend dokümanınızda /users/:id şeklinde belirtilmiş.
    return fetchAPI(`users/${userId}`);
  },

  getAll: async () => {
    // Backend dokümanınızda /users şeklinde belirtilmiş.
    return fetchAPI("users");
  },

  getUserRooms: async (userId: string) => {
    // Backend dokümanınızda /users/:userId/rooms veya /usersWEB/:userId/rooms (oda tipi dahil) belirtilmiş.
    // Oda tipini de almak için 'usersWEB' kullanalım.
    return fetchAPI(`usersWEB/${userId}/rooms`);
  },

  // Kullanıcı Adı ile Kullanıcıyı Getir
  getByUsername: async (username: string) => {
    return fetchAPI(`users/username/${username}`);
  },

  // Kullanıcı Adını Güncelle
  updateUsername: async (userId: string, newUsername: string) => {
    return fetchAPI(`users/${userId}/username`, {
      method: "PUT", // route.ts dosyanıza PUT handler eklemeniz gerekecek
      body: JSON.stringify({ username: newUsername }),
    });
  }
};

export const roomsAPI = {
  getAll: async () => {
    // Backend dokümanınızda /rooms veya /roomsWEB (oda tipi dahil) belirtilmiş.
    // Oda tipini de almak için 'roomsWEB' kullanalım.
    return fetchAPI("roomsWEB");
  },

  getById: async (roomId: string) => {
    // Backend dokümanınızda /rooms/:id veya /roomsWEB/:id (oda tipi dahil) belirtilmiş.
    // Oda tipini de almak için 'roomsWEB' kullanalım.
    return fetchAPI(`roomsWEB/${roomId}`);
  },

  create: async (roomData: { name: string; type: string }) => {
    return fetchAPI("rooms", {
      method: "POST",
      body: JSON.stringify(roomData),
    });
  },

  update: async (roomId: string, roomData: any) => {
    // Bu metodun backend tanımı yok, ancak genel bir PUT isteği olarak varsayıyorum.
    // Eğer varsa, endpoint ve body yapısını ona göre düzenleyin.
    return fetchAPI(`rooms/${roomId}`, {
      method: "PUT", // route.ts dosyanıza PUT handler eklemeniz gerekecek
      body: JSON.stringify(roomData),
    });
  },

  delete: async (roomId: string) => {
    return fetchAPI(`rooms/${roomId}`, {
      method: "DELETE",
    });
  },

  addUser: async (roomId: string, userId: number) => {
    return fetchAPI(`rooms/${roomId}/users`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  },

  getRoomUsers: async (roomId: string) => {
    return fetchAPI(`rooms/${roomId}/users`);
  },

  removeUser: async (roomId: string, userId: number) => {
    return fetchAPI(`rooms/${roomId}/users/${userId}`, {
      method: "DELETE",
    });
  },
};

export const streamAPI = {
  getAll: async () => {
    return fetchAPI("streams");
  },

  getById: async (streamId: string) => {
    return fetchAPI(`streams/${streamId}`);
  },

  create: async (streamData: any) => {
    return fetchAPI("streams", {
      method: "POST",
      body: JSON.stringify(streamData),
    });
  },

  update: async (streamId: string, streamData: any) => {
    return fetchAPI(`streams/${streamId}`, {
      method: "PUT", // route.ts dosyanıza PUT handler eklemeniz gerekecek
      body: JSON.stringify(streamData),
    });
  },

  delete: async (streamId: string) => {
    return fetchAPI(`streams/${streamId}`, {
      method: "DELETE",
    });
  },
};

export const messageAPI = {
  getRoomMessages: async (roomId: string) => {
    return fetchAPI(`messages/room/${roomId}`);
  },

  sendMessage: async (roomId: string, message: { userId: string; content: string }) => {
    // Backend dokümanınızda bu endpoint için spesifik bir tanım yok,
    // ancak genel bir POST isteği olarak varsayıyorum.
    // Endpoint ve body yapısını backend'inize göre doğrulayın.
    return fetchAPI(`messages/room/${roomId}`, { // Veya sadece `messages` olabilir
      method: "POST",
      body: JSON.stringify(message),
    });
  },
};
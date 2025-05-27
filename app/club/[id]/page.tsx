// app/club/[id]/page.tsx
"use client";

import type React from "react";
import MusicPlayer from "@/components/MusicPlayer"; // MusicPlayer bileşeninizin var olduğunu varsayıyoruz

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar"; // Navbar bileşeninizin var olduğunu varsayıyoruz
import { Sidebar } from "@/components/sidebar"; // Sidebar bileşeninizin var olduğunu varsayıyoruz
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MessageSquare, Users, Share2, Heart, Volume2, Music } from "lucide-react";
import { roomsAPI, messageAPI } from "@/lib/api-service";
import { useAuth } from "@/lib/auth-context"; // auth-context dosyanızın yolu
import { Skeleton } from "@/components/ui/skeleton";

type Room = {
  id: string | number;
  name: string;
  host?: string;       // Backend bu bilgiyi sağlıyorsa
  size: number;
  capacity: number;
  type?: string;       // 'genre' yerine 'type' olarak güncellendi
  description?: string; // Backend bu bilgiyi sağlıyorsa
  thumbnail?: string;   // Backend bu bilgiyi sağlıyorsa
};

type Message = {
  id: string | number;
  userId: string | number; // user.id string ise bu da string olmalı
  username: string;
  content: string;
  timestamp?: string;
};

export default function ClubPage() {
  const params = useParams();
  const clubId = params.id as string;
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // AuthContext'ten kullanıcı bilgisi
  const videoRef = useRef<HTMLVideoElement>(null); // Henüz kullanılmıyor gibi görünüyor

  useEffect(() => {
    if (!clubId) {
        setError("Kulüp ID bulunamadı.");
        setLoading(false);
        return;
    }

    const fetchRoomData = async () => {
      try {
        setLoading(true);
        setError(null);

        const roomData = await roomsAPI.getById(clubId);
        console.log("Fetched room:", roomData);

        // Gelen verinin geçerli bir oda nesnesi olup olmadığını kontrol et
        if (roomData && typeof roomData === 'object' && !Array.isArray(roomData) && Object.keys(roomData).length > 0) {
          setRoom(roomData as Room); // Doğrulamadan sonra Room tipine cast et
        } else {
          console.error("Fetched room data is not a valid room object or is empty:", roomData);
          setError("Kulüp bilgileri alınamadı veya geçersiz formatta.");
          setRoom(null); // Hatalı durumda room'u null yap
        }

        // Oda mesajlarını çekme (oda bilgisi başarılıysa denenir)
        if (roomData && typeof roomData === 'object' && !Array.isArray(roomData) && Object.keys(roomData).length > 0) {
            try {
                const messagesData = await messageAPI.getRoomMessages(clubId);
                console.log("Fetched messages:", messagesData);
                if (Array.isArray(messagesData)) {
                    setMessages(messagesData);
                } else {
                    // messagesData dizi değilse (örn: 204 sonrası fetchAPI'den [] yerine null geldiyse)
                    setMessages([]); // Boş mesaj listesi ata
                }
            } catch (msgErr: any) {
                console.error("Failed to fetch messages:", msgErr);
                setError(prevError => prevError ? `${prevError}\nMesajlar yüklenemedi: ${msgErr.message}` : `Mesajlar yüklenemedi: ${msgErr.message}`);
                // Geliştirme için fallback mock mesajlar (isteğe bağlı)
                setMessages([
                    { id: "mock1", userId: "user1", username: "AvatarDancer", content: "This club is amazing tonight!" },
                    { id: "mock2", userId: "user2", username: "VirtualVibes", content: "Love the music selection!" },
                ]);
            }
        }

      } catch (err: any) {
        console.error("Failed to fetch room details:", err);
        setError(`Kulüp bilgilerini yüklerken bir hata oluştu: ${err.message}`);

        // API hatasında fallback mock oda verisi (isteğe bağlı, geliştirme için)
        setRoom({
          id: clubId,
          name: "Neon Lounge - Hata Durumu",
          host: "DJ Virtual",
          size: 0,
          capacity: 0,
          type: "Bilinmiyor", // 'genre' yerine 'type'
          description:
            "Bu kulüp bilgileri yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.",
          thumbnail: "/placeholder.svg?height=720&width=1280",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [clubId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      userId: user.id, // AuthContext'teki User tipine göre user.id'nin tipi (string/number) belirlenmeli
      username: user.username,
      content: chatMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const currentMessage = chatMessage;
    setChatMessage("");

    try {
      const sentMessageData = await messageAPI.sendMessage(clubId, {
        userId: user.id, // Backend'in beklediği userId formatı
        content: currentMessage,
      });
      // İdeal olarak, backend'den dönen mesajla optimistic mesajı güncelle
      // Veya mesajları yeniden çek / WebSocket ile güncelle
      console.log("Message sent, response:", sentMessageData);
       setMessages((prevMessages) =>
         prevMessages.map((msg) =>
           msg.id === tempId && sentMessageData && sentMessageData.id ? { ...sentMessageData, id: sentMessageData.id } : msg
         )
       );
       // Eğer sentMessageData tam bir mesaj objesi değilse veya ID içermiyorsa,
       // ya da sadece onay mesajıysa, mesajları yeniden fetch etmeyi düşünebilirsiniz:
       // const updatedMessages = await messageAPI.getRoomMessages(clubId);
       // if (Array.isArray(updatedMessages)) setMessages(updatedMessages);

    } catch (err: any) {
      console.error("Failed to send message:", err);
      setError(`Mesaj gönderilemedi: ${err.message}`);
      // Optimistic güncellemeyi geri al
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setChatMessage(currentMessage); // Kullanıcının yazdığı mesajı geri yükle
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-gradient-to-b from-black to-zinc-900">
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="w-full aspect-video rounded-lg" />
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="w-full h-24 rounded-lg" />
            </div>
            <div className="lg:col-span-1 h-[calc(100vh-5rem)] border rounded-lg overflow-hidden">
              <Skeleton className="w-full h-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && !room) { // Sadece room null ise ve hata varsa bu bloğu göster
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex flex-1 items-center justify-center text-center px-4">
          <div className="p-6 bg-zinc-800 border border-red-700 text-red-200 rounded-lg max-w-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-3">Bir Sorun Oluştu</h2>
            <p className="whitespace-pre-wrap break-words">{error || "Kulüp bulunamadı veya yüklenirken bir hata oluştu."}</p>
            <Button onClick={() => (window.location.href = "/")} className="mt-6 bg-purple-600 hover:bg-purple-700 text-white">
              Ana Sayfaya Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!room) { // room hala null ise (örneğin API'den geçerli veri gelmediyse ama kritik bir hata oluşmadıysa)
     return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex flex-1 items-center justify-center text-center px-4">
          <div className="p-6 bg-zinc-800 border border-purple-700 text-purple-200 rounded-lg max-w-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-3">Kulüp Yükleniyor...</h2>
            <p>Kulüp bilgileri bulunamadı veya hala yükleniyor. Lütfen bekleyin veya ana sayfaya dönün.</p>
             {error && <p className="mt-2 text-red-400 whitespace-pre-wrap break-words">{error}</p>}
            <Button onClick={() => (window.location.href = "/")} className="mt-6 bg-purple-600 hover:bg-purple-700 text-white">
              Ana Sayfaya Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }


  // room verisi yüklendiğinde burası render edilir
  return (
    <div className="min-h-screen flex flex-col bg-black text-purple-50">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-gradient-to-b from-black to-zinc-900">
          {/* Music Player */}
          <div className="lg:col-span-4 mb-4">
            <MusicPlayer />
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-purple-300 mb-4">Avatar video burada görüntülenecek</p>
                  <div className="w-full h-full bg-gradient-to-r from-purple-900/30 via-pink-800/30 to-blue-900/30 absolute inset-0"></div>
                  <img
                    src={room.thumbnail || "/placeholder.svg?height=720&width=1280"}
                    alt={room.name}
                    className="w-full h-full object-cover absolute inset-0 -z-10 opacity-50"
                  />
                </div>
              </div>
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                CANLI
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Users className="h-3 w-3" /> {room.size}/{room.capacity}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      <Volume2 className="h-5 w-5" />
                    </Button>
                    <div className="h-1 w-24 bg-white/30 rounded-full">
                      <div className="h-full w-1/2 bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 text-xs">
                      HD
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 ring-2 ring-purple-600">
                <AvatarImage src={room.host && room.host.includes('/') ? room.host : "/placeholder.svg"} alt={room.host || room.name} />
                <AvatarFallback className="bg-purple-900">{(room.host || room.name).charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-purple-100">{room.name}</h1>
                <div className="flex items-center gap-2 text-sm text-purple-300 flex-wrap">
                  <span>{room.host || "Bilinmeyen Host"}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Music className="h-3 w-3" /> {room.type || "Çeşitli"} {/* 'genre' yerine 'type' */}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {room.size}/{room.capacity} katılıyor
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-700 text-purple-300 hover:bg-purple-900/30 hover:text-purple-100"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Takip Et
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-700 text-purple-300 hover:bg-purple-900/30 hover:text-purple-100"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Paylaş
                </Button>
              </div>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-lg border border-purple-900/30">
              <h2 className="font-semibold mb-2 text-purple-200">Kulüp Hakkında</h2>
              <p className="text-sm text-purple-300 whitespace-pre-wrap">
                {room.description || "Bu kulüp için henüz bir açıklama girilmemiş."}
              </p>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1 flex flex-col h-[calc(100vh-5rem)] border border-purple-900/30 rounded-lg overflow-hidden bg-zinc-900/50">
            <div className="p-3 border-b border-purple-900/30 flex items-center gap-2 bg-zinc-900 sticky top-0">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <h2 className="font-semibold text-purple-200">Kulüp Sohbeti</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length > 0 ? messages.map((msg) => (
                <div key={msg.id} className="flex gap-2 items-start">
                  <span className="font-semibold text-sm text-purple-400 flex-shrink-0">{msg.username}:</span>
                  <span className="text-sm text-purple-200 break-all">{msg.content}</span>
                </div>
              )) : (
                <p className="text-sm text-purple-400 text-center py-4">Henüz mesaj yok. İlk mesajı sen gönder!</p>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-purple-900/30 flex gap-2 bg-zinc-900 sticky bottom-0">
              <Input
                type="text"
                placeholder={user ? "Bir mesaj gönder..." : "Mesaj göndermek için giriş yapın"}
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-zinc-800 border-purple-900/50 text-purple-100 placeholder:text-purple-400/50 focus:ring-purple-500 focus:border-purple-500"
                disabled={!user}
              />
              <Button
                type="submit"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!user || !chatMessage.trim()}
              >
                Gönder
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
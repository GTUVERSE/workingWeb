// app/club/[id]/page.tsx
"use client";

import type React from "react";
import MusicPlayer from "@/components/MusicPlayer";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MessageSquare, Users, Share2, Heart, Volume2, Music, PlayCircle, VideoOff } from "lucide-react"; // İkonlar eklendi
import { roomsAPI, messageAPI } from "@/lib/api-service";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

const BACKEND_BASE_URL = "http://localhost:18080"; // Backend ana URL'si

type Room = {
  id: string | number;
  name: string;
  host?: string;
  size: number;
  capacity: number;
  type?: string;
  description?: string;
  thumbnail?: string; // Bu, poster olarak kullanılabilir
  url?: string;       // Backend'den gelen video yolu (örn: "video/28/room")
};

type Message = {
  id: string | number;
  userId: string | number;
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
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

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
        console.log("[ClubPage] Fetched room:", roomData);

        if (roomData && typeof roomData === 'object' && !Array.isArray(roomData) && roomData.id) {
          setRoom(roomData as Room);
        } else {
          console.error("[ClubPage] Fetched room data is not a valid room object or is empty:", roomData);
          setError("Kulüp bilgileri alınamadı veya geçersiz formatta.");
          setRoom(null);
        }

        if (roomData && typeof roomData === 'object' && !Array.isArray(roomData) && roomData.id) {
            try {
                const messagesData = await messageAPI.getRoomMessages(clubId);
                console.log("[ClubPage] Fetched messages:", messagesData);
                if (Array.isArray(messagesData)) {
                    setMessages(messagesData);
                } else {
                    setMessages([]);
                }
            } catch (msgErr: any) {
                console.error("[ClubPage] Failed to fetch messages:", msgErr);
                setError(prevError => prevError ? `${prevError}\nMesajlar yüklenemedi: ${msgErr.message}` : `Mesajlar yüklenemedi: ${msgErr.message}`);
                setMessages([
                    { id: "mock1", userId: "user1", username: "Sistem", content: "Sohbet mesajları yüklenemedi." },
                ]);
            }
        }

      } catch (err: any) {
        console.error("[ClubPage] Failed to fetch room details:", err);
        setError(`Kulüp bilgilerini yüklerken bir hata oluştu: ${err.message}`);
        setRoom({ // API hatasında fallback mock oda verisi
          id: clubId,
          name: "Hata Durumu Kulübü",
          host: "Bilinmiyor",
          size: 0,
          capacity: 0,
          type: "Bilinmiyor",
          description: "Bu kulüp bilgileri yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.",
          thumbnail: "/placeholder.svg?height=720&width=1280",
          url: "", // Hata durumunda boş URL
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
      userId: user.id,
      username: user.username,
      content: chatMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const currentMessage = chatMessage;
    setChatMessage("");

    try {
      const sentMessageData = await messageAPI.sendMessage(clubId, {
        userId: user.id,
        content: currentMessage,
      });
      console.log("[ClubPage] Message sent, response:", sentMessageData);
       setMessages((prevMessages) =>
         prevMessages.map((msg) =>
           msg.id === tempId && sentMessageData && sentMessageData.id ? { ...sentMessageData, id: sentMessageData.id } : msg
         )
       );
    } catch (err: any) {
      console.error("[ClubPage] Failed to send message:", err);
      setError(`Mesaj gönderilemedi: ${err.message}`);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setChatMessage(currentMessage);
    }
  };

  // Video oynatma/durdurma fonksiyonu (örnek)
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused || videoRef.current.ended) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };


  if (loading) {
    return ( // Yükleme ekranı
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-gradient-to-b from-black to-zinc-900">
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="w-full aspect-video rounded-lg" />
              <div className="flex items-start gap-4"> <Skeleton className="h-12 w-12 rounded-full" /> <div className="flex-1"> <Skeleton className="h-6 w-3/4 mb-2" /> <Skeleton className="h-4 w-1/2" /> </div> </div>
              <Skeleton className="w-full h-24 rounded-lg" />
            </div>
            <div className="lg:col-span-1 h-[calc(100vh-8rem)] border rounded-lg overflow-hidden"> <Skeleton className="w-full h-full" /> </div>
          </main>
        </div>
      </div>
    );
  }

  if (error && !room) { // Sadece room null ise ve kritik hata varsa bu bloğu göster
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex flex-1 items-center justify-center text-center px-4">
          <div className="p-6 bg-zinc-800 border border-red-700 text-red-200 rounded-lg max-w-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-3">Bir Sorun Oluştu</h2>
            <p className="whitespace-pre-wrap break-words">{error || "Kulüp bulunamadı veya yüklenirken bir hata oluştu."}</p>
            <Button onClick={() => (window.location.href = "/")} className="mt-6 bg-purple-600 hover:bg-purple-700 text-white"> Ana Sayfaya Dön </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!room) { // room hala null ise (API'den geçerli veri gelmediyse ama kritik bir hata oluşmadıysa)
     return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex flex-1 items-center justify-center text-center px-4">
          <div className="p-6 bg-zinc-800 border border-purple-700 text-purple-200 rounded-lg max-w-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-3">Kulüp Yükleniyor...</h2>
            <p>Kulüp bilgileri bulunamadı veya hala yükleniyor. Lütfen bekleyin veya ana sayfaya dönün.</p>
             {error && <p className="mt-2 text-red-400 whitespace-pre-wrap break-words">{error}</p>}
            <Button onClick={() => (window.location.href = "/")} className="mt-6 bg-purple-600 hover:bg-purple-700 text-white"> Ana Sayfaya Dön </Button>
          </div>
        </div>
      </div>
    );
  }

  const videoSource = room.url ? `${BACKEND_BASE_URL}/${room.url.startsWith('/') ? room.url.substring(1) : room.url}` : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-black text-purple-50">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-gradient-to-b from-black to-zinc-900">
          <div className="lg:col-span-4 mb-4"> <MusicPlayer /> </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="relative aspect-video bg-zinc-950 rounded-lg overflow-hidden shadow-2xl border border-purple-900/30">
              {videoSource ? (
                <video
                  ref={videoRef}
                  src={videoSource}
                  controls
                  // autoPlay // Kullanıcı deneyimi için genellikle autoplay'den kaçınılır veya muted ile kullanılır
                  // muted
                  loop
                  className="w-full h-full object-cover"
                  poster={room.thumbnail || `${BACKEND_BASE_URL}/placeholder_video.jpg`} // Backend'den thumbnail alınabilir veya statik bir placeholder
                  onError={(e) => {
                    console.error("Video Error:", e);
                    // Video yüklenemezse bir fallback gösterilebilir
                    (e.target as HTMLVideoElement).style.display = 'none'; // Videoyu gizle
                    // Bir sonraki element (fallback) görünür olacak
                  }}
                >
                  Tarayıcınız video etiketini desteklemiyor.
                </video>
              ) : (
                // Video URL'si yoksa veya video yüklenemezse gösterilecek fallback
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                   <VideoOff className="w-24 h-24 text-purple-700 mb-4" />
                  <p className="text-purple-300 text-lg">Video mevcut değil veya yüklenemedi.</p>
                  {room.thumbnail && <img src={room.thumbnail} alt="Oda görseli" className="mt-4 max-h-40 opacity-50 rounded" />}
                </div>
              )}
               {!videoSource && ( // Video yüklenemediğinde de bu fallback gösterilebilir (video onError ile gizlendiğinde)
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 pointer-events-none">
                  <VideoOff className="w-24 h-24 text-purple-700 mb-4" />
                  <p className="text-purple-300 text-lg">Video mevcut değil.</p>
                </div>
              )}


              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow"> CANLI </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 shadow"> <Users className="h-3 w-3" /> {room.size}/{room.capacity} </div>
              
              {/* Özel Kontroller (Örnek) */}
              {videoSource && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-2">
                    <Button onClick={togglePlay} variant="ghost" size="icon" className="text-white hover:bg-white/20">
                      {videoRef.current?.paused !== false ? <PlayCircle className="h-6 w-6" /> : <VideoOff className="h-6 w-6" /> }
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20"> <Volume2 className="h-5 w-5" /> </Button>
                    {/* Ses Seviyesi Çubuğu Eklenebilir */}
                  </div>
                  <div className="flex items-center gap-2"> <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 text-xs"> HD </Button> </div>
                </div>
              )}
            </div>

            <div className="flex items-start gap-4 p-1">
              <Avatar className="h-12 w-12 ring-2 ring-purple-600">
                <AvatarImage src={room.host && room.host.includes('/') ? room.host : "/placeholder.svg"} alt={room.host || room.name} />
                <AvatarFallback className="bg-purple-900">{(room.host || room.name).charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-purple-100">{room.name}</h1>
                <div className="flex items-center gap-2 text-sm text-purple-300 flex-wrap">
                  <span>{room.host || "Bilinmeyen Host"}</span> <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1"> <Music className="h-3 w-3" /> {room.type || "Çeşitli"} </span> <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1"> <Users className="h-3 w-3" /> {room.size}/{room.capacity} katılıyor </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="border-purple-700 text-purple-300 hover:bg-purple-900/30 hover:text-purple-100"> <Heart className="h-4 w-4 mr-2" /> Takip Et </Button>
                <Button variant="outline" size="sm" className="border-purple-700 text-purple-300 hover:bg-purple-900/30 hover:text-purple-100"> <Share2 className="h-4 w-4 mr-2" /> Paylaş </Button>
              </div>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-lg border border-purple-900/30">
              <h2 className="font-semibold mb-2 text-purple-200">Kulüp Hakkında</h2>
              <p className="text-sm text-purple-300 whitespace-pre-wrap"> {room.description || "Bu kulüp için henüz bir açıklama girilmemiş."} </p>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col h-[calc(100vh-8rem)] border border-purple-900/30 rounded-lg overflow-hidden bg-zinc-900/50">
            <div className="p-3 border-b border-purple-900/30 flex items-center gap-2 bg-zinc-900 sticky top-0"> <MessageSquare className="h-4 w-4 text-purple-400" /> <h2 className="font-semibold text-purple-200">Kulüp Sohbeti</h2> </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length > 0 ? messages.map((msg) => (
                <div key={msg.id} className="flex gap-2 items-start"> <span className="font-semibold text-sm text-purple-400 flex-shrink-0">{msg.username}:</span> <span className="text-sm text-purple-200 break-all">{msg.content}</span> </div>
              )) : ( <p className="text-sm text-purple-400 text-center py-4">Henüz mesaj yok. İlk mesajı sen gönder!</p> )}
            </div>
            <form onSubmit={handleSendMessage} className="p-3 border-t border-purple-900/30 flex gap-2 bg-zinc-900 sticky bottom-0">
              <Input type="text" placeholder={user ? "Bir mesaj gönder..." : "Mesaj göndermek için giriş yapın"} value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} className="flex-1 bg-zinc-800 border-purple-900/50 text-purple-100 placeholder:text-purple-400/50 focus:ring-purple-500 focus:border-purple-500" disabled={!user} />
              <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={!user || !chatMessage.trim()}> Gönder </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
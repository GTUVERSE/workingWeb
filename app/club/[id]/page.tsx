"use client"

import type React from "react"
import MusicPlayer from "@/components/MusicPlayer"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { MessageSquare, Users, Share2, Heart, Volume2, Music } from "lucide-react"
import { roomsAPI, messageAPI } from "@/lib/api-service"
import { useAuth } from "@/lib/auth-context"
import { Skeleton } from "@/components/ui/skeleton"

type Room = {
  id: string | number
  name: string
  host?: string
  size: number
  capacity: number
  genre?: string
  description?: string
  thumbnail?: string
}

type Message = {
  id: string | number
  userId: string | number
  username: string
  content: string
  timestamp?: string
}

export default function ClubPage() {
  const params = useParams()
  const clubId = params.id as string
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatMessage, setChatMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setLoading(true)
        setError(null)

        const roomData = await roomsAPI.getById(clubId)
        console.log("Fetched room:", roomData)
        setRoom(roomData)

        try {
          const messagesData = await messageAPI.getRoomMessages(clubId)
          console.log("Fetched messages:", messagesData)
          if (Array.isArray(messagesData)) {
            setMessages(messagesData)
          }
        } catch (msgErr) {
          console.error("Failed to fetch messages:", msgErr)
          // Fallback mock messages
          setMessages([
            { id: 1, userId: 1, username: "AvatarDancer", content: "This club is amazing tonight!" },
            { id: 2, userId: 2, username: "VirtualVibes", content: "Love the music selection!" },
            { id: 3, userId: 3, username: "DigitalDJ", content: "Who's the DJ tonight?" },
            { id: 4, userId: 4, username: "MetaPartyGoer", content: "The avatar animations are so smooth!" },
          ])
        }
      } catch (err) {
        console.error("Failed to fetch room:", err)
        setError("Kulüp bilgilerini yüklerken bir hata oluştu.")

        // Fallback mock data
        setRoom({
          id: clubId,
          name: "Neon Lounge - Weekend Party",
          host: "DJ Virtual",
          size: 5,
          capacity: 8,
          genre: "Electronic",
          description:
            "Welcome to the Neon Lounge, the hottest virtual club in GTUVERSE! Tonight we're featuring real-time avatar motion mapping with our advanced motion detection technology.",
          thumbnail: "/placeholder.svg?height=720&width=1280",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRoomData()
  }, [clubId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim() || !user) return

    try {
      // Add optimistic update
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        userId: user.id,
        username: user.username,
        content: chatMessage,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, optimisticMessage])
      setChatMessage("")

      // Send to API
      await messageAPI.sendMessage(clubId, {
        userId: user.id,
        content: chatMessage,
      })

      // In a real app, you might want to refresh messages here
      // or implement websockets for real-time updates
    } catch (err) {
      console.error("Failed to send message:", err)
      // You could show an error toast here
    }
  }

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
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="p-4 bg-red-900/30 border border-red-800 text-red-200 rounded-lg max-w-md">
            <h2 className="text-xl font-bold mb-2">Hata</h2>
            <p>{error || "Kulüp bulunamadı"}</p>
            <Button onClick={() => (window.location.href = "/")} className="mt-4 bg-purple-600 hover:bg-purple-700">
              Ana Sayfaya Dön
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-purple-50">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 bg-gradient-to-b from-black to-zinc-900">
          {/* Video Player */}
          
            <div className="lg:col-span-4 mb-4">
            <MusicPlayer />
            </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden">
              {/* This is where you would embed the avatar video */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  <p className="text-purple-300 mb-4">Avatar video would be displayed here</p>
                  <div className="w-full h-full bg-gradient-to-r from-purple-900/30 via-pink-800/30 to-blue-900/30 absolute inset-0"></div>
                  <img
                    src={room.thumbnail || "/placeholder.svg?height=720&width=1280"}
                    alt={room.name}
                    className="w-full h-full object-cover absolute inset-0 -z-10 opacity-50"
                  />
                </div>
              </div>
              <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                LIVE
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <Users className="h-3 w-3" /> {room.size}/{room.capacity}
              </div>

              {/* Video controls overlay */}
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
                <AvatarImage src="/placeholder.svg" alt={room.host || room.name} />
                <AvatarFallback className="bg-purple-900">{(room.host || room.name).charAt(0)}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-2xl font-bold text-purple-100">{room.name}</h1>
                <div className="flex items-center gap-2 text-sm text-purple-300">
                  <span>{room.host || "Host"}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Music className="h-3 w-3" /> {room.genre || "Various"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {room.size}/{room.capacity} attending
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-700 text-purple-300 hover:bg-purple-900/30"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Follow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-purple-700 text-purple-300 hover:bg-purple-900/30"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-lg border border-purple-900/30">
              <h2 className="font-semibold mb-2 text-purple-200">About this Club</h2>
              <p className="text-sm text-purple-300">{room.description || "No description available."}</p>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1 flex flex-col h-[calc(100vh-5rem)] border border-purple-900/30 rounded-lg overflow-hidden bg-zinc-900/50">
            <div className="p-3 border-b border-purple-900/30 flex items-center gap-2 bg-zinc-900">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <h2 className="font-semibold text-purple-200">Club Chat</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <span className="font-semibold text-sm text-purple-400">{msg.username}:</span>
                  <span className="text-sm text-purple-200">{msg.content}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-purple-900/30 flex gap-2 bg-zinc-900">
              <Input
                type="text"
                placeholder="Send a message"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 bg-zinc-800 border-purple-900/50 text-purple-100 placeholder:text-purple-400/50"
                disabled={!user}
              />
              <Button
                type="submit"
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!user || !chatMessage.trim()}
              >
                Chat
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Music } from "lucide-react"
import { roomsAPI } from "@/lib/api-service"
import { Skeleton } from "@/components/ui/skeleton"

type Room = {
  id: string | number
  name: string
  host?: string
  size: number
  capacity: number
  genre?: string
  tags?: string[]
  thumbnail?: string
}

export function ClubsGrid() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = await roomsAPI.getAll()
        console.log("Fetched rooms:", data)

        if (Array.isArray(data)) {
          setRooms(data)
        } else {
          console.error("Expected array but got:", data)
          throw new Error("Invalid data format")
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err)
        setError("Odaları yüklerken bir hata oluştu.")

        // Fallback mock data
        setRooms([
          {
            id: 1,
            name: "Neon Lounge",
            host: "DJ Virtual",
            size: 5,
            capacity: 8,
            genre: "Electronic",
            tags: ["Dance", "Party"],
            thumbnail: "/placeholder.svg?height=180&width=320",
          },
          {
            id: 2,
            name: "Virtual Beats",
            host: "DJ Pixel",
            size: 3,
            capacity: 8,
            genre: "House",
            tags: ["Dance", "Avatars"],
            thumbnail: "/placeholder.svg?height=180&width=320",
          },
          {
            id: 3,
            name: "Digital Disco",
            host: "DJ Binary",
            size: 7,
            capacity: 8,
            genre: "Disco",
            tags: ["Retro", "Dance"],
            thumbnail: "/placeholder.svg?height=180&width=320",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="overflow-hidden border-0 bg-zinc-900/50">
            <CardContent className="p-0">
              <Skeleton className="w-full aspect-video" />
              <div className="p-3">
                <div className="flex gap-2">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-1" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/30 border border-red-800 text-red-200 rounded-lg">
        <p>{error}</p>
        <p className="mt-2">Geçici veriler gösteriliyor.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {rooms.map((room) => (
        <Link href={`/club/${room.id}`} key={room.id}>
          <Card className="overflow-hidden border-0 bg-zinc-900/50 hover:bg-zinc-800/70 transition-colors group">
            <CardContent className="p-0">
              <div className="relative">
                <img
                  src={room.thumbnail || "/placeholder.svg?height=180&width=320"}
                  alt={room.name}
                  className="w-full aspect-video object-cover rounded-t-md group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                  LIVE
                </div>
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Users className="h-3 w-3" /> {room.size}/{room.capacity}
                </div>
              </div>

              <div className="p-3">
                <div className="flex gap-2">
                  <div className="w-9 h-9 rounded-full bg-purple-900/50 flex-shrink-0 flex items-center justify-center text-purple-200">
                    {(room.host || room.name).charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-sm line-clamp-1 text-purple-100">{room.name}</h3>
                    <p className="text-xs text-purple-300">{room.host || "Host"}</p>
                    <p className="text-xs text-purple-400 flex items-center gap-1">
                      <Music className="h-3 w-3" /> {room.genre || "Various"}
                    </p>
                    {room.tags && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {room.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-purple-900/30 text-purple-200 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

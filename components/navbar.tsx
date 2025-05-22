"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-900/50 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center gap-2 mr-4">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 text-transparent bg-clip-text">
              GTUVERSE
            </span>
          </Link>
          <Button
            variant="ghost"
            className="font-semibold text-purple-300 hover:text-purple-100 hover:bg-purple-900/30"
          >
            Explore Clubs
          </Button>
        </div>

        <div className="flex-1 flex items-center max-w-md mx-4">
          <div className="relative w-full">
            <Input
              type="search"
              placeholder="Search clubs"
              className="pl-10 pr-4 py-2 w-full bg-zinc-900 border-purple-900/50 text-purple-100 placeholder:text-purple-300/50"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-purple-400" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-purple-300 hover:text-purple-100 hover:bg-purple-900/30"
              >
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 ring-2 ring-purple-500">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.username} />
                      <AvatarFallback className="bg-purple-900 text-purple-100">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-purple-900">
                  <DropdownMenuLabel className="text-purple-100">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-purple-900/50" />
                  <DropdownMenuItem className="text-purple-200 focus:bg-purple-900 focus:text-purple-100">
                    <Link href="/profile" className="w-full">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-purple-200 focus:bg-purple-900 focus:text-purple-100">
                    <Link href="/settings" className="w-full">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-purple-900/50" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-purple-200 focus:bg-purple-900 focus:text-purple-100"
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-purple-300 hover:text-purple-100 hover:bg-purple-900/30" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

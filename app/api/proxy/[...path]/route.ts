import { type NextRequest, NextResponse } from "next/server"

// Backend API URL'iniz
const API_URL = "http://localhost:18080"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")
  const url = new URL(request.url)
  const queryString = url.search

  console.log(`Proxying GET request to: ${API_URL}/${path}${queryString}`)

  try {
    const response = await fetch(`${API_URL}/${path}${queryString}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    if (!response.ok) {
      return NextResponse.json({ error: `API returned ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch from API" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")

  try {
    const body = await request.json()
    console.log(`Proxying POST request to: ${API_URL}/${path}`, body)

    const response = await fetch(`${API_URL}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    if (!response.ok) {
      return NextResponse.json({ error: `API returned ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch from API" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/")

  try {
    console.log(`Proxying DELETE request to: ${API_URL}/${path}`)

    const response = await fetch(`${API_URL}/${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    if (!response.ok) {
      return NextResponse.json({ error: `API returned ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch from API" }, { status: 500 })
  }
}

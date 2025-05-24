import { type NextRequest, NextResponse } from "next/server"

const API_URL = "http://localhost:18080"
function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader
  }
  return null
}

function isPromise(obj: any): obj is Promise<any> {
  return !!obj && typeof obj.then === "function"
}

async function getParams(contextOrPromise: any) {
  if (isPromise(contextOrPromise)) {
    return (await contextOrPromise).params
  }
  return contextOrPromise.params
}

export async function GET(request: NextRequest, context: any) {
  const params = await getParams(context)
  const path = params.path.join("/")
  const url = new URL(request.url)
  const queryString = url.search
  const token = getTokenFromRequest(request)

  try {
    const response = await fetch(`${API_URL}/${path}${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      cache: "no-store",
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    if (!response.ok) {
      let errorText
      try {
        errorText = await response.text()
      } catch {
        errorText = "API error"
      }
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    let data
    try {
      data = await response.json()
    } catch {
      data = await response.text()
    }
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch from API" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: any) {
  const params = await getParams(context)
  const path = params.path.join("/")
  const token = getTokenFromRequest(request)

  try {
    const body = await request.json()
    const response = await fetch(`${API_URL}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    if (!response.ok) {
      let errorText
      try {
        errorText = await response.text()
      } catch {
        errorText = "API error"
      }
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    let data
    try {
      data = await response.json()
    } catch {
      data = await response.text()
    }
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch from API" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const params = await getParams(context)
  const path = params.path.join("/")
  const token = getTokenFromRequest(request)

  try {
    const response = await fetch(`${API_URL}/${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
    })

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    if (!response.ok) {
      let errorText
      try {
        errorText = await response.text()
      } catch {
        errorText = "API error"
      }
      return NextResponse.json({ error: errorText }, { status: response.status })
    }

    let data
    try {
      data = await response.json()
    } catch {
      data = await response.text()
    }
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Proxy error:", error)
    return NextResponse.json({ error: "Failed to fetch from API" }, { status: 500 })
  }
}
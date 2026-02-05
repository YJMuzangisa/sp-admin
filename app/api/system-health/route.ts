import { NextResponse } from 'next/server'

const BUYBOX_PROCESSOR_URL = process.env.BUYBOX_PROCESSOR_URL || 'http://102.211.29.233:8080'

export async function GET() {
  try {
    const response = await fetch(`${BUYBOX_PROCESSOR_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch health data' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { error: 'Unable to connect to buybox processor' },
      { status: 503 }
    )
  }
}
import { handlers } from '@/lib/auth'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

// Export handlers directly - this is the correct way for Next.js 14
export const { GET, POST } = handlers
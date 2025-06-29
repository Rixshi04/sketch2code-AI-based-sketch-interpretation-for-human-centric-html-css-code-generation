import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isPremium: boolean
      planType: string
      planExpiresAt?: Date | null
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    isPremium: boolean
    planType: string
    planExpiresAt?: Date | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    isPremium: boolean
    planType: string
    planExpiresAt?: Date | null
  }
} 
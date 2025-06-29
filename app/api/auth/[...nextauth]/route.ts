import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import LinkedInProvider from 'next-auth/providers/linkedin'
import GitHubProvider from 'next-auth/providers/github'
import { prisma } from '@/lib/database'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/',
    error: '/auth/login',
    newUser: '/dashboard',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        // Get user from database to include additional fields
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email! },
          include: {
            subscriptions: true,
          },
        })
        
        if (dbUser) {
          session.user.id = dbUser.id
          session.user.isPremium = dbUser.isPremium
          session.user.planType = dbUser.planType
          session.user.planExpiresAt = dbUser.planExpiresAt
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
})

export { handler as GET, handler as POST } 
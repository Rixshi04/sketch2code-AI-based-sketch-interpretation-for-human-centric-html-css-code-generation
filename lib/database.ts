import { prisma } from './prisma'

// Initialize database connection - SQLite (no external server needed)
// MongoDB completely removed - using SQLite file-based database
async function initializeDatabase() {
  try {
    await prisma.$connect();
    if (process.env.NODE_ENV === 'development') {
      console.log('[database] ✅ Prisma connection ready');
    }
  } catch {
    // Silent at module load; first use will retry or throw
  }
}

// Initialize on module load (non-blocking)
if (typeof window === 'undefined') {
  Promise.resolve().then(() => {
    return initializeDatabase().catch(() => {
      // Silent fail - will retry on first use
    });
  });
}

// Export prisma for use in API routes
export { prisma }

export class DatabaseService {
  // User operations
  static async getUserById(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
        include: {
          projects: true
        }
      })
    } catch (error) {
      console.error('Database error in getUserById:', error)
      return null
    }
  }

  static async getUserByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        include: {
          projects: true
        }
      })
    } catch (error) {
      console.error('Database error in getUserByEmail:', error)
      return null
    }
  }

  static async getUserByUsername(username: string) {
    try {
      return await prisma.user.findUnique({
        where: { username },
        include: {
          projects: true
        }
      })
    } catch (error) {
      console.error('Database error in getUserByUsername:', error)
      return null
    }
  }

  static async createUser(data: {
    email: string
    username?: string
    password?: string
    name?: string
    image?: string
  }) {
    try {
      return await prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          password: data.password, // Should be hashed before calling this
          name: data.name,
          image: data.image
        },
        include: {
          projects: true
        }
      })
    } catch (error) {
      console.error('Database error in createUser:', error)
      throw error
    }
  }

  static async updateUser(id: string, data: any) {
    try {
      return await prisma.user.update({
        where: { id },
        data: { ...data, updatedAt: new Date() }
      })
    } catch (error) {
      console.error('Database error in updateUser:', error)
      throw error
    }
  }

  // Project operations
  static async createProject(data: {
    name: string
    description?: string
    platform: string
    userId: string
    sketchUrl?: string
    generatedCode?: string
    codeLanguage?: string
  }) {
    try {
      return await prisma.project.create({
        data: {
          name: data.name,
          description: data.description,
          platform: data.platform,
          userId: data.userId,
          sketchUrl: data.sketchUrl,
          generatedCode: data.generatedCode,
          codeLanguage: data.codeLanguage,
          status: 'draft'
        }
      })
    } catch (error) {
      console.error('Database error in createProject:', error)
      throw error
    }
  }

  static async getProjectById(id: string) {
    try {
      return await prisma.project.findUnique({
        where: { id },
        include: {
          user: true
        }
      })
    } catch (error) {
      console.error('Database error in getProjectById:', error)
      return null
    }
  }

  static async getUserProjects(userId: string, options?: {
    limit?: number
    offset?: number
    status?: string
  }) {
    try {
      return await prisma.project.findMany({
        where: {
          userId,
          ...(options?.status && { status: options.status })
        },
        orderBy: { updatedAt: 'desc' },
        ...(options?.limit && { take: options.limit }),
        ...(options?.offset && { skip: options.offset })
      })
    } catch (error) {
      console.error('Database error in getUserProjects:', error)
      return []
    }
  }

  static async getAllProjects(options?: {
    limit?: number
    offset?: number
    status?: string
    platform?: string
  }) {
    try {
      return await prisma.project.findMany({
        where: {
          ...(options?.status && { status: options.status }),
          ...(options?.platform && { platform: options.platform })
        },
        include: {
          user: true
        },
        orderBy: { updatedAt: 'desc' },
        ...(options?.limit && { take: options.limit }),
        ...(options?.offset && { skip: options.offset })
      })
    } catch (error) {
      console.error('Database error in getAllProjects:', error)
      return []
    }
  }

  static async updateProject(id: string, data: any) {
    try {
      return await prisma.project.update({
        where: { id },
        data: { ...data, updatedAt: new Date() }
      })
    } catch (error) {
      console.error('Database error in updateProject:', error)
      throw error
    }
  }

  static async deleteProject(id: string) {
    try {
      return await prisma.project.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Database error in deleteProject:', error)
      throw error
    }
  }

  // Stub methods for routes that use them (simplified for SQLite)
  static async toggleLike(userId: string, projectId?: string, templateId?: string) {
    // Simplified - just return success
    return { liked: true }
  }

  static async toggleFavorite(userId: string, projectId?: string, templateId?: string) {
    // Simplified - just return success
    return { favorited: true }
  }

  static async trackEvent(data: {
    eventType: string
    eventData?: any
    userId?: string
    sessionId?: string
    userAgent?: string
    ipAddress?: string
    page?: string
    referrer?: string
  }) {
    // Simplified - just log, don't store (analytics model removed)
    console.log('[analytics]', data.eventType, data.userId)
    return null
  }
}

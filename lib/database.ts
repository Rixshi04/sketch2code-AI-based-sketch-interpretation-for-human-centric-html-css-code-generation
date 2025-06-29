import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database service class for common operations
export class DatabaseService {
  // User operations
  static async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        projects: true,
        templates: true,
        subscriptions: true,
      },
    })
  }

  static async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        projects: true,
        templates: true,
        subscriptions: true,
      },
    })
  }

  static async createUser(data: {
    email: string
    name?: string
    image?: string
  }) {
    return await prisma.user.create({
      data,
      include: {
        projects: true,
        templates: true,
        subscriptions: true,
      },
    })
  }

  static async updateUser(id: string, data: any) {
    return await prisma.user.update({
      where: { id },
      data,
      include: {
        projects: true,
        templates: true,
        subscriptions: true,
      },
    })
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
    tags?: string[]
  }) {
    return await prisma.project.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        likes_rel: true,
        favorites: true,
      },
    })
  }

  static async getProjectById(id: string) {
    return await prisma.project.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        likes_rel: true,
        favorites: true,
      },
    })
  }

  static async getUserProjects(userId: string, options?: {
    status?: string
    platform?: string
    limit?: number
    offset?: number
  }) {
    const where: any = { userId }
    
    if (options?.status) where.status = options.status
    if (options?.platform) where.platform = options.platform

    return await prisma.project.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: true,
        likes_rel: true,
        favorites: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    })
  }

  static async updateProject(id: string, data: any) {
    return await prisma.project.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: true,
        likes_rel: true,
        favorites: true,
      },
    })
  }

  static async deleteProject(id: string) {
    return await prisma.project.delete({
      where: { id },
    })
  }

  // Template operations
  static async createTemplate(data: {
    name: string
    description?: string
    category: string
    platform: string
    userId: string
    codeContent: string
    codeLanguage: string
    thumbnail?: string
    previewUrl?: string
    isPremium?: boolean
    price?: number
    tags?: string[]
    features?: string[]
  }) {
    return await prisma.template.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        likes_rel: true,
        favorites: true,
      },
    })
  }

  static async getTemplateById(id: string) {
    return await prisma.template.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        likes_rel: true,
        favorites: true,
      },
    })
  }

  static async getTemplates(options?: {
    category?: string
    platform?: string
    isPremium?: boolean
    isPublished?: boolean
    limit?: number
    offset?: number
    sortBy?: 'rating' | 'downloads' | 'createdAt' | 'updatedAt'
    sortOrder?: 'asc' | 'desc'
  }) {
    const where: any = {}
    
    if (options?.category) where.category = options.category
    if (options?.platform) where.platform = options.platform
    if (options?.isPremium !== undefined) where.isPremium = options.isPremium
    if (options?.isPublished !== undefined) where.isPublished = options.isPublished

    const orderBy: any = {}
    if (options?.sortBy) {
      orderBy[options.sortBy] = options.sortOrder || 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }

    return await prisma.template.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: true,
        likes_rel: true,
        favorites: true,
      },
      orderBy,
      take: options?.limit || 20,
      skip: options?.offset || 0,
    })
  }

  static async updateTemplate(id: string, data: any) {
    return await prisma.template.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: true,
        likes_rel: true,
        favorites: true,
      },
    })
  }

  static async deleteTemplate(id: string) {
    return await prisma.template.delete({
      where: { id },
    })
  }

  // Like operations
  static async toggleLike(data: {
    userId: string
    projectId?: string
    templateId?: string
  }) {
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: data.userId,
        projectId: data.projectId,
        templateId: data.templateId,
      },
    })

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id },
      })
      return { liked: false }
    } else {
      await prisma.like.create({
        data,
      })
      return { liked: true }
    }
  }

  // Favorite operations
  static async toggleFavorite(data: {
    userId: string
    projectId?: string
    templateId?: string
  }) {
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: data.userId,
        projectId: data.projectId,
        templateId: data.templateId,
      },
    })

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      })
      return { favorited: false }
    } else {
      await prisma.favorite.create({
        data,
      })
      return { favorited: true }
    }
  }

  // Comment operations
  static async createComment(data: {
    content: string
    rating?: number
    userId: string
    projectId?: string
    templateId?: string
  }) {
    return await prisma.comment.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })
  }

  // Analytics operations
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
    return await prisma.analytics.create({
      data,
    })
  }

  // File upload operations
  static async createFileUpload(data: {
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    userId?: string
    projectId?: string
    templateId?: string
    metadata?: any
  }) {
    return await prisma.fileUpload.create({
      data,
    })
  }

  // Search operations
  static async searchProjects(query: string, options?: {
    userId?: string
    platform?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
      ],
    }

    if (options?.userId) where.userId = options.userId
    if (options?.platform) where.platform = options.platform

    return await prisma.project.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: true,
        likes_rel: true,
        favorites: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    })
  }

  static async searchTemplates(query: string, options?: {
    category?: string
    platform?: string
    isPremium?: boolean
    limit?: number
    offset?: number
  }) {
    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query] } },
        { features: { hasSome: [query] } },
      ],
    }

    if (options?.category) where.category = options.category
    if (options?.platform) where.platform = options.platform
    if (options?.isPremium !== undefined) where.isPremium = options.isPremium

    return await prisma.template.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: true,
        likes_rel: true,
        favorites: true,
      },
      orderBy: { rating: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    })
  }
} 
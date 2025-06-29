# 🚀 Deployment Guide

This guide will help you deploy SketchMaster to various hosting platforms.

## Quick Start (Vercel - Recommended)

### 1. Prepare Your Code
```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Configure environment variables (see below)
6. Click "Deploy"

Your app will be live in 2-3 minutes!

## Environment Variables Setup

### Required Variables
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here
```

### Optional OAuth Variables
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Platform-Specific Instructions

### Vercel (Recommended)
- **Pros**: Best Next.js support, free tier, automatic deployments
- **Cons**: None for this use case
- **Setup Time**: 5 minutes
- **Cost**: Free for personal projects

### Netlify
- **Pros**: Good free tier, easy setup
- **Cons**: Requires plugin for Next.js
- **Setup Time**: 10 minutes
- **Cost**: Free for personal projects

### Railway
- **Pros**: Good for full-stack apps
- **Cons**: Limited free tier
- **Setup Time**: 10 minutes
- **Cost**: $5/month after free tier

### Render
- **Pros**: Good free tier, easy setup
- **Cons**: Slower builds
- **Setup Time**: 10 minutes
- **Cost**: Free for personal projects

## Getting API Keys

### OpenAI API Key
1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up/login
3. Go to "API Keys" section
4. Create new API key
5. Add billing information (required)

### NextAuth Secret
Generate a secure random string:
```bash
openssl rand -base64 32
```

### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins

### GitHub OAuth (Optional)
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Add your domain to Homepage URL
4. Set Authorization callback URL to `https://your-domain.com/api/auth/callback/github`

## Troubleshooting

### Common Issues

#### Build Fails
- Check Node.js version (should be 18+)
- Ensure all dependencies are in package.json
- Check for TypeScript errors

#### Environment Variables Not Working
- Verify variable names are correct
- Check for typos
- Ensure variables are added to the correct environment

#### API Calls Failing
- Verify OpenAI API key is correct
- Check API key has sufficient credits
- Ensure domain is allowed in OpenAI settings

#### Authentication Issues
- Verify NEXTAUTH_URL matches your deployment URL
- Check OAuth provider settings
- Ensure callback URLs are correct

### Getting Help
- Check the [README.md](README.md) for detailed instructions
- Review platform-specific documentation
- Open an issue on GitHub if needed

## Post-Deployment

### Custom Domain
1. Purchase domain from registrar
2. Add domain in hosting platform
3. Update DNS settings
4. Update NEXTAUTH_URL environment variable

### Monitoring
- Set up uptime monitoring
- Configure error tracking
- Monitor API usage and costs

### Updates
- Push changes to main branch
- Automatic deployment will trigger
- Test on staging environment first

## Cost Estimation

### Free Tier Limits
- **Vercel**: 100GB bandwidth, 100 serverless function executions
- **Netlify**: 100GB bandwidth, 300 build minutes
- **Railway**: $5 credit, then pay-as-you-go
- **Render**: 750 hours/month, 100GB bandwidth

### Typical Monthly Costs
- **Small project**: $0-10/month
- **Medium project**: $10-50/month
- **Large project**: $50+/month

## Security Checklist

- [ ] Environment variables are set
- [ ] API keys are secure
- [ ] HTTPS is enabled
- [ ] CORS is configured
- [ ] Rate limiting is in place
- [ ] Error messages don't expose sensitive data

## Performance Optimization

- [ ] Images are optimized
- [ ] Code splitting is implemented
- [ ] Caching is configured
- [ ] CDN is enabled
- [ ] Bundle size is minimized

---

🎉 **Your SketchMaster app is now live!** 

Share your deployment URL and start generating amazing UI code from sketches! 
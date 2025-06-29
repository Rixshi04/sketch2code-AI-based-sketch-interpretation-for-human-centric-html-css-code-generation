#!/bin/bash

echo "🚀 SketchMaster Deployment Script"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit: SketchMaster AI UI Generator"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo ""
    echo "🔗 Please add your GitHub repository as remote origin:"
    echo "   git remote add origin https://github.com/YOUR_USERNAME/sketchmaster.git"
    echo ""
    echo "📤 Then push to GitHub:"
    echo "   git push -u origin main"
    echo ""
else
    echo "✅ Remote origin already configured"
    echo "📤 Pushing to GitHub..."
    git push origin main
fi

echo ""
echo "🌐 Deployment Options:"
echo "======================"
echo ""
echo "1️⃣  Vercel (Recommended - Free & Easy):"
echo "   - Visit: https://vercel.com"
echo "   - Sign up with GitHub"
echo "   - Click 'New Project'"
echo "   - Import your repository"
echo "   - Add environment variables"
echo "   - Deploy!"
echo ""
echo "2️⃣  Netlify:"
echo "   - Visit: https://netlify.com"
echo "   - Sign up and connect GitHub"
echo "   - Deploy from Git"
echo ""
echo "3️⃣  Railway:"
echo "   - Visit: https://railway.app"
echo "   - Sign up and connect GitHub"
echo "   - Deploy from repository"
echo ""
echo "4️⃣  Render:"
echo "   - Visit: https://render.com"
echo "   - Sign up and connect GitHub"
echo "   - Create new Web Service"
echo ""
echo "🔧 Required Environment Variables:"
echo "=================================="
echo ""
echo "OPENAI_API_KEY=your_openai_api_key_here"
echo "NEXTAUTH_URL=https://your-domain.com"
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo ""
echo "📚 For detailed instructions, see the README.md file"
echo ""
echo "🎉 Happy deploying!" 
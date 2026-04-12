SketchMaster: AI-Driven Cross-Platform UI Code Generator with UX Validation and Interactive Editor

**AI-Driven Cross-Platform UI Code Generator with UX Validation and Interactive Editor**

Transform your sketches and wireframes into production-ready code for multiple platforms using advanced AI technology.

## ⚡ Quick start (one command)

From the project root, run:

```bash
npm run go
```

This will:

1. Install all npm packages  
2. Create `.env.local` from `env.example` (with a generated `NEXTAUTH_SECRET`)  
3. Run Prisma generate and DB push (SQLite)  
4. Create a Python venv in `backend/` and install dependencies  
5. Start the Python ML backend on **http://127.0.0.1:8000**  
6. Start the Next.js app on **http://localhost:3000**

Then open **http://localhost:3000** in your browser. Use **Run demo** on the Generate page to get code and preview without uploading anything. Press **Ctrl+C** in the terminal to stop both servers.

See **RUN.md** for more options and troubleshooting.

## ✨ Features

### 🚀 Core Features
- **Sketch-to-Code**: Upload sketches and generate clean, modern code
- **Multi-Platform Support**: React, Vue, Angular, Flutter, SwiftUI
- **AI-Powered Generation**: Advanced AI models for accurate code generation
- **UX Validation**: Automated accessibility and design best practices checking
- **Interactive Editor**: Monaco-based code editor with syntax highlighting
- **Real-time Preview**: Live preview with responsive design testing
- **Code Export**: Download generated code in multiple formats

### 🎯 Platform Support
- **Web**: React, Vue.js, Angular
- **Mobile**: Flutter (cross-platform), SwiftUI (iOS)
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **TypeScript**: Full TypeScript support for better development experience

### 🔧 Technical Features
- **Modern Stack**: Next.js 14, TypeScript, Tailwind CSS
- **AI Integration**: OpenAI GPT-4 Vision for sketch analysis
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Performance**: Optimized bundle size and loading times
- **Accessibility**: WCAG 2.1 AA compliance
- **SEO**: Meta tags, structured data, performance optimization

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/sketchmaster.git
   cd sketchmaster
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Option 1: Vercel (Recommended - Free & Easy)

Vercel is the best platform for Next.js applications and offers a generous free tier.

#### Step 1: Prepare Your Repository
1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/your-username/sketchmaster.git
   git push -u origin main
   ```

#### Step 2: Deploy to Vercel
1. **Visit [vercel.com](https://vercel.com)** and sign up/login with GitHub
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure environment variables**:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `NEXTAUTH_URL`: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET`: Generate a random secret (you can use `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID`: (Optional) For Google OAuth
   - `GOOGLE_CLIENT_SECRET`: (Optional) For Google OAuth
   - `GITHUB_CLIENT_ID`: (Optional) For GitHub OAuth
   - `GITHUB_CLIENT_SECRET`: (Optional) For GitHub OAuth
   - `LINKEDIN_CLIENT_ID`: (Optional) For LinkedIn OAuth
   - `LINKEDIN_CLIENT_SECRET`: (Optional) For LinkedIn OAuth

5. **Click "Deploy"**

Your app will be live at `https://your-app-name.vercel.app`

#### Step 3: Custom Domain (Optional)
1. In your Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update your DNS settings as instructed

### Option 2: Netlify

#### Step 1: Build Configuration
Create a `netlify.toml` file in your project root:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

#### Step 2: Deploy
1. **Visit [netlify.com](https://netlify.com)** and sign up
2. **Click "New site from Git"**
3. **Connect your GitHub repository**
4. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. **Add environment variables** in the Netlify dashboard
6. **Deploy**

### Option 3: Railway

#### Step 1: Deploy to Railway
1. **Visit [railway.app](https://railway.app)** and sign up
2. **Click "New Project"** → "Deploy from GitHub repo"
3. **Select your repository**
4. **Add environment variables** in the Railway dashboard
5. **Deploy**

### Option 4: Render

#### Step 1: Deploy to Render
1. **Visit [render.com](https://render.com)** and sign up
2. **Click "New"** → "Web Service"
3. **Connect your GitHub repository**
4. **Configure**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. **Add environment variables**
6. **Deploy**

## 🔧 Environment Variables

For production deployment, you'll need these environment variables:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_generated_secret_here

# Optional - OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### How to Get API Keys

#### OpenAI API Key
1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up/login and go to "API Keys"
3. Create a new API key
4. Add billing information (required for API usage)

#### NextAuth Secret
Generate a random secret:
```bash
openssl rand -base64 32
```

#### Google OAuth (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins

#### GitHub OAuth (Optional)
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Add your domain to Homepage URL and Authorization callback URL

#### LinkedIn OAuth (Optional)
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add OAuth 2.0 redirect URLs
4. Set Authorization callback URL to `https://your-domain.com/api/auth/callback/linkedin`
5. Copy Client ID and Client Secret

## 🎨 Usage

### 1. Upload Your Sketch
- Drag and drop your sketch image or click to browse
- Supported formats: JPG, PNG, GIF
- Maximum file size: 10MB
- Tips for better results:
  - Use clear, high-contrast sketches
  - Include text labels for better understanding
  - Ensure good lighting and focus

### 2. Select Target Platform
- Choose from React, Vue, Angular, Flutter, or SwiftUI
- Each platform has specific features and recommendations
- Consider your project requirements and team expertise

### 3. Generate Code
- Click "Generate Code" to start AI processing
- The system analyzes your sketch and generates platform-specific code
- Processing typically takes 10-30 seconds

### 4. Review and Validate
- Check the generated code in the interactive editor
- Review UX validation results and suggestions
- Make any necessary adjustments

### 5. Preview and Export
- Test the generated code in the live preview
- Switch between desktop, tablet, and mobile views
- Download the code for your project

## 🏗️ Project Structure

```
sketchmaster/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── components/            # React components
│   ├── CodeEditor.tsx     # Monaco code editor
│   ├── PlatformSelector.tsx # Platform selection
│   ├── PreviewPanel.tsx   # Live preview
│   ├── SketchUpload.tsx   # File upload
│   └── UXValidator.tsx    # UX validation
├── lib/                   # Utility libraries
│   └── ai-service.ts      # AI integration
├── types/                 # TypeScript types
├── public/                # Static assets
└── package.json           # Dependencies
```

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key for AI features
- `NEXTAUTH_URL`: Application URL for deployment
- `NEXTAUTH_SECRET`: Secret for NextAuth.js
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GITHUB_CLIENT_ID`: GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth client secret
- `LINKEDIN_CLIENT_ID`: LinkedIn OAuth client ID
- `LINKEDIN_CLIENT_SECRET`: LinkedIn OAuth client secret

### Tailwind CSS
The project uses a custom Tailwind configuration with:
- Custom color palette
- Responsive design utilities
- Animation classes
- Component-specific styles

### TypeScript
Strict TypeScript configuration with:
- Path aliases for clean imports
- Strict type checking
- Modern ES2020 features

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the GPT-4 Vision API
- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Monaco Editor for the code editing experience
- All contributors and supporters

## 📞 Support

- **Documentation**: [docs.sketchmaster.dev](https://docs.sketchmaster.dev)
- **Issues**: [GitHub Issues](https://github.com/your-username/sketchmaster/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/sketchmaster/discussions)
- **Email**: support@sketchmaster.dev

## 🔮 Roadmap

### Upcoming Features
- [ ] Figma integration
- [ ] Adobe XD support
- [ ] Sketch file import
- [ ] Team collaboration
- [ ] Version control integration
- [ ] Custom design systems
- [ ] Advanced animations
- [ ] Performance optimization tools

### Platform Expansion
- [ ] React Native
- [ ] Xamarin
- [ ] Kotlin (Android)
- [ ] Unity (Game UI)
- [ ] Electron (Desktop apps)

---

**Made with ❤️ by the SketchMaster Team** 

# **System Architecture: SketchMaster**

## **🏗️ Complete System Architecture Overview**

---

## **📋 Table of Contents**

1. [High-Level Architecture](#high-level-architecture)
2. [Component Architecture](#component-architecture)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Technology Stack](#technology-stack)
5. [Database Architecture](#database-architecture)
6. [API Architecture](#api-architecture)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Scalability Architecture](#scalability-architecture)

---

## **🏗️ High-Level Architecture**

### **1.1 System Overview**

```typescript
```

### **1.2 Architecture Principles**

```typescript
// Design Principles
interface ArchitecturePrinciples {
  modularity: 'Component-based architecture';
  scalability: 'Horizontal and vertical scaling support';
  security: 'Multi-layer security implementation';
  performance: 'Optimized for fast response times';
  maintainability: 'Clean code and documentation';
  extensibility: 'Easy to add new features';
}
```

---

## **🔧 Component Architecture**

### **2.1 Frontend Components**

```typescript
// React Component Hierarchy
interface FrontendArchitecture {
  app: {
    layout: RootLayout;
    pages: {
      home: LandingPage;
      dashboard: UserDashboard;
      auth: {
        login: LoginPage;
        register: RegisterPage;
      };
      templates: TemplateGallery;
      preview: PreviewPage;
    };
  };
  
  components: {
    ui: {
      Button: ReusableButton;
      Input: FormInput;
      Modal: DialogModal;
      Loading: SpinnerComponent;
    };
    features: {
      SketchUpload: FileUploadComponent;
      PlatformSelector: PlatformSelection;
      CodeEditor: MonacoEditorWrapper;
      PreviewPanel: LivePreviewComponent;
      UXValidator: QualityAssuranceComponent;
    };
    layouts: {
      Header: NavigationHeader;
      Sidebar: NavigationSidebar;
      Footer: PageFooter;
  
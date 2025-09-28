# Daily Dashboard

A comprehensive productivity dashboard that transforms your GitHub activity into actionable insights. Track your coding patterns, analyze productivity metrics, and get intelligent suggestions to improve your development workflow.

## ✨ Features

### 🔧 **GitHub Integration**

- **📊 Productivity Analytics**: Deep insights into your coding patterns and habits
- **🎯 Focus Metrics**: Track session length, interruption rates, and concentration patterns
- **📈 Coding Velocity**: Visualize daily code changes with interactive charts
- **🕒 Peak Hours**: Heatmap showing when you're most productive
- **🔄 Active Pull Requests**: Monitor PR status with approval tracking
- **📝 Recent Commits**: View your latest contributions across repositories
- **💡 Smart Suggestions**: AI-powered recommendations based on your coding patterns
- **🌐 Language Distribution**: Analyze your programming language usage

### 🎨 **Modern Interface**

- **📱 Responsive Design**: Optimized for all screen sizes with full-width layout
- **🌙 Dark Mode Support**: Beautiful interface that adapts to your preference
- **⚡ Real-time Updates**: Live data with intelligent caching
- **🎯 Interactive Tooltips**: Detailed explanations for all metrics
- **📊 Visual Analytics**: Charts, heatmaps, and progress indicators

### 🔒 **Privacy & Security**

- **🏠 Local Storage**: All credentials stored securely in your browser
- **🚫 No Server**: Credentials never leave your device
- **🔐 Token-based Auth**: Secure GitHub Personal Access Token authentication

## 🚀 Quick Start

1. **Clone and Install**

   ```bash
   git clone https://github.com/your-username/daily-dashboard.git
   cd daily-dashboard
   npm install
   ```

2. **Run Development Server**

   ```bash
   npm run dev
   ```

3. **Configure GitHub Integration**
   - Navigate to `http://localhost:3000`
   - Click the settings icon (⚙️) in the top right
   - Enable GitHub integration
   - Add your GitHub Personal Access Token and username
   - Select repositories to track (optional)

## 🔧 GitHub Setup

### 1. Create Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` - Access to repositories
   - ✅ `user:email` - Access to user email
   - ✅ `read:user` - Read user profile data
4. Copy the generated token

### 2. Configure Dashboard

1. Open dashboard settings (⚙️ icon)
2. Toggle "GitHub" to enabled
3. Enter your Personal Access Token
4. Enter your GitHub username
5. Optionally select specific repositories to track
6. Save configuration

## 📊 Analytics Features

### 🎯 **Focus Metrics**

- **Average Session Length**: Time between first and last commit in a day
- **Longest Session**: Your longest continuous coding session
- **Total Focus Time**: Cumulative active coding time
- **Interruption Rate**: Average gaps between commits (lower is better)

### 📈 **Coding Velocity**

- **Daily Changes**: Lines added/removed per day over the last week
- **Trend Analysis**: Visual representation of your coding output
- **Net Change Tracking**: Positive/negative code changes with color coding

### 🕒 **Peak Hours Analysis**

- **24-Hour Heatmap**: Visual representation of your most active coding hours
- **Activity Intensity**: Color-coded blocks showing commit frequency
- **Focus Sessions**: Identified time blocks of concentrated work
- **Pattern Recognition**: Understand your natural productivity rhythms

### 💡 **Smart Suggestions**

The dashboard analyzes your recent commits and provides intelligent recommendations:

- **Frontend Heavy?** → Suggests backend tasks and API-related issues
- **Backend Focused?** → Recommends UI improvements and frontend work
- **Low Test Coverage?** → Suggests testing and quality improvements
- **Missing Documentation?** → Recommends documentation tasks
- **Balanced Development** → Encourages continued diverse contributions

Each suggestion includes relevant open issues from your repositories!

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js 13+ app directory
│   ├── globals.css        # Global styles and responsive utilities
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Main dashboard page
├── components/
│   ├── dashboard.tsx      # Main dashboard layout
│   ├── settings/          # Configuration management
│   │   └── settings-modal.tsx
│   ├── ui/               # Reusable UI components
│   └── widgets/
│       └── github-widget.tsx  # Complete GitHub integration
├── lib/
│   └── config.ts         # Configuration and localStorage utilities
└── types/                # TypeScript definitions
```

## 🛠️ Development

### Key Technologies

- **Next.js 13+** with App Router
- **React 18** with Hooks and Context
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **Lucide React** for icons

### Adding New Features

1. **Extend Analytics**:

   ```typescript
   // Add new metrics to ProductivityMetrics interface
   interface ProductivityMetrics {
     // ... existing metrics
     newMetric: {
       value: number;
       trend: "up" | "down" | "stable";
     };
   }
   ```

2. **Add New Suggestions**:

   ```typescript
   // Extend Smart Suggestions logic in fetchSmartSuggestions
   if (customCondition) {
     suggestionType = "custom";
     message = "Your custom suggestion message";
   }
   ```

3. **Customize UI**:
   ```css
   /* Add custom styles in globals.css */
   .custom-widget {
     @apply bg-gradient-to-r from-blue-500 to-purple-600;
   }
   ```

## 🎨 Customization

### Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: 1024px - 1280px
- **Large**: > 1280px

### Color Scheme

The dashboard uses a carefully crafted color palette:

- **Primary**: Blue gradient for main actions
- **Success**: Green for positive metrics
- **Warning**: Orange for attention items
- **Error**: Red for issues
- **Info**: Purple for analytics

### Layout Configuration

```css
/* Main container uses full screen width */
.max-w-[100rem] /* ~160rem = 2560px */

/* Responsive grid system */
.grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6
```

## 🔍 Troubleshooting

### Common Issues

1. **No Data Showing**

   - ✅ Verify GitHub token has correct permissions
   - ✅ Check if repositories are selected in settings
   - ✅ Ensure username is correct

2. **API Rate Limits**

   - ✅ GitHub allows 5,000 requests/hour for authenticated users
   - ✅ Dashboard implements intelligent caching
   - ✅ Consider reducing refresh frequency for large repositories

3. **CORS Errors**
   - ✅ Some GitHub API endpoints have CORS restrictions
   - ✅ Dashboard handles these gracefully with fallbacks
   - ✅ Review browser console for specific error details

### Debug Mode

Enable React Query DevTools:

```typescript
// Add to your layout or providers
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Include in your component tree
<ReactQueryDevtools initialIsOpen={false} />;
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
npx vercel --prod
```

### Netlify

```bash
npm run build
# Deploy the 'out' directory
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Submit a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Add JSDoc comments for complex functions
- Test responsive design on multiple screen sizes

## 📈 Roadmap

- [ ] **Multi-platform Support**: GitLab, Bitbucket integration
- [ ] **Team Analytics**: Collaborative productivity insights
- [ ] **Export Features**: PDF reports, CSV data export
- [ ] **Notification System**: Desktop notifications for important events
- [ ] **Advanced Filtering**: Date ranges, repository filtering
- [ ] **Performance Optimization**: Virtual scrolling, lazy loading
- [ ] **Accessibility**: Full WCAG 2.1 compliance

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: Check this README and inline code comments
- 🐛 **Bug Reports**: [Open an issue](https://github.com/your-username/daily-dashboard/issues)
- 💡 **Feature Requests**: [Start a discussion](https://github.com/your-username/daily-dashboard/discussions)
- 📧 **Contact**: [your-email@example.com](mailto:your-email@example.com)

---

**Built with ❤️ for developers who love data-driven productivity insights.**

> 💡 **Pro Tip**: Use the Smart Suggestions feature to discover new areas of contribution in your repositories and maintain a balanced development approach across frontend, backend, and quality assurance tasks.

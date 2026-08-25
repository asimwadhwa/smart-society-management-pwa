# 🖥️ Society Management - Frontend

The Next.js 14 frontend for Rajarshi Darshan Society Management System.

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/shadcn/ui-latest-000000?style=flat-square" alt="shadcn/ui" />
</p>

## 🚀 Live Demo

**Production URL:** [society-management-system-vert.vercel.app](https://society-management-system-vert.vercel.app)

## 📁 Project Structure

```
client/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── manager-setup/
│   │   ├── (dashboard)/        # Protected dashboard
│   │   │   ├── admin/
│   │   │   ├── complaints/
│   │   │   ├── emergency/
│   │   │   └── maintenance/
│   │   ├── watchman/           # Watchman portal
│   │   ├── showcase/           # Public showcase page
│   │   └── layout.tsx          # Root layout
│   │
│   ├── components/             # React Components
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── layout/             # Navbar, Sidebar
│   │   ├── shared/             # Shared components
│   │   └── ui/                 # shadcn/ui components
│   │
│   ├── context/                # React Context
│   │   └── AuthContext.tsx     # Authentication state
│   │
│   ├── hooks/                  # Custom Hooks
│   │   ├── useAuth.ts
│   │   ├── useComplaints.ts
│   │   ├── useEmergency.ts
│   │   └── useMaintenance.ts
│   │
│   ├── lib/                    # Utilities
│   │   ├── api.ts              # Axios instance
│   │   ├── constants.ts
│   │   └── utils.ts
│   │
│   └── types/                  # TypeScript types
│       └── index.ts
│
├── public/                     # Static assets
├── components.json             # shadcn/ui config
├── next.config.mjs             # Next.js config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
└── package.json
```

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with App Router |
| TypeScript | 5.x | Type-safe development |
| Tailwind CSS | 3.x | Utility-first CSS |
| shadcn/ui | latest | Accessible components |
| Axios | 1.x | HTTP client |
| Lucide React | latest | Icon library |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Schema validation |

## 📦 Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   
   Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
   NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxx
   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/xxxx
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   ```
   http://localhost:3000
   ```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript check |

## 🎨 UI Components

Using [shadcn/ui](https://ui.shadcn.com/) for accessible, customizable components:

- Button, Card, Input, Badge
- Dialog, Sheet, Dropdown Menu
- Table, Tabs, Toast
- Form components with React Hook Form

### Adding New Components

```bash
npx shadcn@latest add [component-name]
```

## 🔐 Authentication Flow

1. User visits protected route
2. Middleware checks for auth cookie
3. If no cookie → Redirect to `/login`
4. On login → JWT stored in httpOnly cookie
5. AuthContext provides user state globally

## 📱 Responsive Design

- **Mobile First** approach
- Breakpoints:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px
- Collapsible sidebar on mobile
- Bottom navigation for watchman portal

## 🎨 Theme & Styling

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#6366f1` | Buttons, links |
| Success | `#22c55e` | Paid status |
| Warning | `#f59e0b` | Pending status |
| Danger | `#ef4444` | Emergency, overdue |
| Info | `#3b82f6` | Information |

### Custom Tailwind Config

```typescript
// tailwind.config.ts
{
  theme: {
    extend: {
      colors: {
        primary: {...},
        // Custom colors
      }
    }
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel Dashboard
3. Set Root Directory: `client`
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx
   NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_xxxx
   NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/xxxx
   ```
5. Deploy

### Manual Build

```bash
npm run build
npm run start
```

## 🧪 Development Tips

### Hot Reload
The development server supports hot reload. Changes are reflected instantly.

### TypeScript Strict Mode
Strict TypeScript is enabled. Fix all type errors before committing.

### Debugging
```bash
# Enable Next.js debugging
NODE_OPTIONS='--inspect' npm run dev
```

## 📱 Pages Overview

| Route | Description | Access |
|-------|-------------|--------|
| `/login` | User login | Public |
| `/register` | User registration | Public |
| `/forgot-password` | Password reset | Public |
| `/manager-setup` | First-time manager setup | Public (once) |
| `/` | Dashboard home | Protected |
| `/maintenance` | Payment management | Protected |
| `/complaints` | Complaints system | Protected |
| `/emergency` | Emergency management | Protected |
| `/admin/*` | Admin pages | Admin/Manager |
| `/watchman` | Watchman portal | Watchman |
| `/showcase` | Project showcase | Public |

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) in the root directory.

## 📄 License

MIT - See [LICENSE](../LICENSE) in the root directory.

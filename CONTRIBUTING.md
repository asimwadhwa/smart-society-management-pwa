# Contributing to Asim Wadhwa Society Management

First off, thank you for considering contributing to this project! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)
- [Need Help?](#need-help)

## 📜 Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Be respectful and inclusive
- Be patient with newcomers
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Society-Management-System.git
   cd Society-Management-System
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/AAYUSH412/Society-Management-System.git
   ```

## 🛠️ Development Setup

### Prerequisites

- Node.js 20.x LTS
- npm 10.x
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Install client dependencies**:
   ```bash
   cd client
   npm install
   ```

2. **Install server dependencies**:
   ```bash
   cd ../server
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   # Server
   cp server/.env.example server/.env.local
   
   # Client
   cp client/.env.example client/.env.local
   ```
   
   Update the `.env.local` files with your credentials.

4. **Start development servers**:
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

## 📁 Project Structure

```
Society_Management/
├── client/                 # Next.js 14 frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   └── package.json
│
├── server/                 # Express.js backend
│   ├── controllers/       # Route handlers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── package.json
│
└── .github/               # GitHub configurations
```

## ✏️ Making Changes

1. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** following the style guidelines

3. **Test your changes** locally

4. **Commit your changes** following commit guidelines

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/). Each commit message should be structured as:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |

### Examples

```bash
feat(auth): add password reset functionality
fix(payments): resolve Razorpay webhook validation issue
docs(readme): update installation instructions
style(client): format code with prettier
refactor(api): simplify error handling middleware
```

## 🔀 Pull Request Process

1. **Update documentation** if needed
2. **Ensure all tests pass**
3. **Fill out the PR template** completely
4. **Request review** from maintainers
5. **Address review feedback** promptly
6. **Squash commits** if requested

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated

## 🎨 Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for frontend code
- Use ES6+ features
- Prefer functional components with hooks
- Use meaningful variable and function names

### React/Next.js

```tsx
// ✅ Good
export function UserCard({ user }: { user: User }) {
  return (
    <Card>
      <CardContent>
        <h3>{user.name}</h3>
      </CardContent>
    </Card>
  );
}

// ❌ Bad
export default function(props) {
  return <div>{props.user.name}</div>
}
```

### API Endpoints

- Use RESTful conventions
- Return consistent response format:
  ```json
  {
    "success": true,
    "data": {},
    "message": "Success message"
  }
  ```

### CSS/Tailwind

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Group related classes together

## 🧪 Testing

### Running Tests

```bash
# Frontend
cd client && npm run lint
cd client && npm run type-check

# Backend
cd server && node --check server.js
```

### Manual Testing Checklist

- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test all user roles (Manager, Admin, Resident, Watchman)
- [ ] Verify error handling

## 🆘 Need Help?

- **Questions?** Open a [Discussion](https://github.com/AAYUSH412/Society-Management-System/discussions)
- **Found a bug?** Open an [Issue](https://github.com/AAYUSH412/Society-Management-System/issues)
- **Security issue?** See [SECURITY.md](./SECURITY.md)

## 🙏 Thank You!

Your contributions help make this project better for everyone. We appreciate your time and effort!

---

Made with ❤️ by [Aayush Vaghela](https://github.com/AAYUSH412)

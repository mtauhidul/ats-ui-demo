# Arista ATS Frontend# React + TypeScript + Vite



Modern React + TypeScript frontend for Arista ATS (Applicant Tracking System), built with Vite.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## 🚀 Quick StartCurrently, two official plugins are available:



### Prerequisites- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- Node.js 18+- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- pnpm (recommended) or npm

- Backend API running (see `ats-backend/README.md`)## React Compiler



### InstallationThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).



```bash## Expanding the ESLint configuration

# Install dependencies

pnpm installIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:



# Copy environment variables```js

cp .env.example .envexport default defineConfig([

# Edit .env with your API URL  globalIgnores(['dist']),

  {

# Run development server    files: ['**/*.{ts,tsx}'],

pnpm dev    extends: [

      // Other configs...

# Build for production

pnpm build      // Remove tseslint.configs.recommended and replace with this

      tseslint.configs.recommendedTypeChecked,

# Preview production build      // Alternatively, use this for stricter rules

pnpm preview      tseslint.configs.strictTypeChecked,

```      // Optionally, add this for stylistic rules

      tseslint.configs.stylisticTypeChecked,

## 📁 Project Structure

      // Other configs...

```    ],

ats-ui/    languageOptions: {

├── public/             # Static assets      parserOptions: {

├── src/        project: ['./tsconfig.node.json', './tsconfig.app.json'],

│   ├── components/     # Reusable UI components        tsconfigRootDir: import.meta.dirname,

│   │   ├── ui/        # Base UI components (shadcn/ui)      },

│   │   ├── layout/    # Layout components (sidebar, nav)      // other options...

│   │   ├── data-table.tsx    },

│   │   ├── candidates-data-table.tsx  },

│   │   └── ...])

│   ├── pages/         # Page components```

│   │   └── dashboard/

│   │       ├── applications/You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

│   │       ├── candidates/

│   │       ├── jobs/```js

│   │       ├── clients/// eslint.config.js

│   │       ├── team/import reactX from 'eslint-plugin-react-x'

│   │       ├── search/import reactDom from 'eslint-plugin-react-dom'

│   │       ├── settings/

│   │       └── help/export default defineConfig([

│   ├── redux/         # Redux state management  globalIgnores(['dist']),

│   │   ├── slices/    # Redux slices (jobs, candidates, etc.)  {

│   │   └── store.ts   # Redux store configuration    files: ['**/*.{ts,tsx}'],

│   ├── lib/           # Utility functions & configs    extends: [

│   │   ├── utils.ts      // Other configs...

│   │   └── api.ts     # API client with authentication      // Enable lint rules for React

│   ├── hooks/         # Custom React hooks      reactX.configs['recommended-typescript'],

│   ├── types/         # TypeScript type definitions      // Enable lint rules for React DOM

│   ├── App.tsx        # Root component      reactDom.configs.recommended,

│   ├── main.tsx       # Entry point    ],

│   └── index.css      # Global styles    languageOptions: {

├── components.json    # shadcn/ui configuration      parserOptions: {

├── tailwind.config.js # Tailwind CSS configuration        project: ['./tsconfig.node.json', './tsconfig.app.json'],

├── vite.config.ts     # Vite configuration        tsconfigRootDir: import.meta.dirname,

└── tsconfig.json      # TypeScript configuration      },

```      // other options...

    },

## 🔧 Available Scripts  },

])

- **`pnpm dev`** - Start development server (http://localhost:5173)```

- **`pnpm build`** - Build for production
- **`pnpm preview`** - Preview production build locally
- **`pnpm lint`** - Run ESLint

## 🎨 Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **State Management:** Redux Toolkit
- **Routing:** React Router DOM
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Forms:** React Hook Form
- **HTTP Client:** Fetch API with custom wrapper
- **Notifications:** Sonner (toast notifications)

## 🏗️ Key Features

### Pages & Modules

1. **Dashboard** - Analytics overview with charts and metrics
2. **Applications** - Review and approve new applications
3. **Candidates** - Manage approved candidates with pipeline view
4. **Jobs** - Create and manage job postings with Kanban pipeline
5. **Clients** - Manage client companies and contacts
6. **Team** - User management with role-based permissions
7. **Search** - Global search across all entities
8. **Settings** - System configuration including:
   - Email automation
   - Email templates
   - Pipeline stages
   - Tags and categories
   - User preferences
9. **Help** - Comprehensive user guide with 100+ FAQs

### Features

- **Role-Based Access Control (RBAC)** - Admin, Recruiter, Hiring Manager, Viewer roles
- **Email Automation** - Automatic resume parsing from monitored email accounts
- **Drag & Drop Pipeline** - Visual Kanban-style candidate tracking
- **Real-time Search** - Fast global search with keyboard shortcuts (Cmd/Ctrl+K)
- **Responsive Design** - Mobile-friendly interface
- **Dark/Light Theme** - User preference support
- **Token Refresh** - Automatic JWT token refresh on expiry
- **Optimistic Updates** - Smooth UI updates with Redux

## 🔐 Authentication

The app uses JWT-based authentication with automatic token refresh:

- Access tokens stored in memory (Redux state)
- Refresh tokens stored in localStorage
- Automatic redirect to login on 401 errors
- Token refresh on API calls when access token expires

## 🎨 UI Components

Built with **shadcn/ui** - a collection of reusable components built with Radix UI and Tailwind CSS:

- Button, Input, Select, Textarea
- Dialog, Sheet, Drawer
- Table, Card, Badge
- Dropdown Menu, Context Menu
- Toast notifications
- And many more...

All components are customizable and located in `src/components/ui/`.

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=ATS
```

## 🚀 Deployment

### Build for Production

```bash
pnpm build
```

This creates optimized production files in the `dist/` directory.

### Deploy to Vercel (Recommended)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Deploy to Netlify

1. Build: `pnpm build`
2. Deploy the `dist/` folder to Netlify

### Environment Variables

Remember to set `VITE_API_URL` to your production backend URL in your hosting platform's environment variables.

## 🐛 Common Issues

### Port Already in Use
If port 5173 is occupied, Vite will automatically use the next available port.

### API Connection Errors
- Ensure backend is running
- Check `VITE_API_URL` in `.env`
- Verify CORS settings in backend

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
- Clear Vite cache: `rm -rf dist .vite`

## 📚 Development Guidelines

### Adding New Pages
1. Create page component in `src/pages/dashboard/`
2. Add route in `src/App.tsx`
3. Add navigation item in `src/components/app-sidebar.tsx`
4. Add permissions check if needed

### Adding New Redux Slices
1. Create slice in `src/redux/slices/`
2. Add to store in `src/redux/store.ts`
3. Use `createAsyncThunk` for API calls

### Adding UI Components
Use shadcn/ui CLI to add new components:
```bash
npx shadcn-ui@latest add [component-name]
```

## 👥 Team

Frontend developed by Mir Tauhidul Islam
- Email: mislam.tauhidul@gmail.com
- Email: mislam@aristagroups.com

## 📄 License

Proprietary - All rights reserved

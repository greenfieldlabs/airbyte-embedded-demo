# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Turborepo monorepo demonstrating Airbyte Embedded Widget with three frontend implementations (Vanilla JS, React, Next.js) and a shared Express.js backend. Implements a three-step authentication flow: demo password → user creation → Airbyte widget integration.

## Common Commands

```bash
# Development - run all apps simultaneously
npm run dev

# Run individual apps
npm run dev --filter=@airbyte-demo/server      # Backend (port 3000)
npm run dev --filter=@airbyte-demo/reactjs     # React (port 3002)
npm run dev --filter=@airbyte-demo/nextjs      # Next.js (port 3001)

# Build, lint, test, clean
npm run build
npm run lint
npm run test
npm run clean
```

## Architecture

```
apps/
├── server/          # Express.js backend + Vanilla JS frontend
│   ├── src/         # index.js (routes), db.js (file/Redis), airbyte_api.js
│   └── static/      # Vanilla JS: index.html, script.js, styles.css
├── reactjs/src/     # React (CRA) - App.js, components/, api/client.js
└── nextjs/src/      # Next.js - pages/index.js, components/, lib/apiClient.js
```

**Backend API Endpoints:**
- `POST /api/login` - Demo password auth (sets `appPassword` cookie)
- `POST /api/users` - Create/login user (sets `userEmail` cookie)
- `GET /api/users/me` - Get current user
- `POST /api/airbyte/token` - Generate Airbyte widget token

**Database:** Auto-switches between file-based (`users.db`) and Redis when `REDIS_URL` is set.

**Frontend API Proxies:** React uses `package.json` proxy config; Next.js uses `next.config.js` rewrites.

## Source Templates Script

Manage Airbyte source templates via CLI (`scripts/source-templates.sh`):

```bash
./scripts/source-templates.sh list                    # List all templates
./scripts/source-templates.sh get <id>                # Get template by ID
./scripts/source-templates.sh create '<json>'         # Create template
./scripts/source-templates.sh update <id> '<json>'    # Update template
./scripts/source-templates.sh delete <id>             # Delete template
```

JSON format for create/update:
```json
{"name": "Connector Name", "workspaceId": "uuid", "definitionId": "uuid", "configuration": {}}
```

Requires `SONAR_AIRBYTE_CLIENT_ID` and `SONAR_AIRBYTE_CLIENT_SECRET` (loaded from `apps/server/.env`).

## Environment Setup

Copy `apps/server/.env.example` to `apps/server/.env` and configure:
- `SONAR_AIRBYTE_WEBAPP_PASSWORD` - Demo access password
- `SONAR_AIRBYTE_ORGANIZATION_ID`, `SONAR_AIRBYTE_CLIENT_ID`, `SONAR_AIRBYTE_CLIENT_SECRET` - Airbyte credentials
- `SONAR_AIRBYTE_ALLOWED_ORIGIN` - CORS origin (default: http://localhost:3000)
- `REDIS_URL` - Optional Redis connection string

---

# UI Consistency Requirements

## CRITICAL: Multi-Platform UI Synchronization

**WHENEVER ANY UI change is made, it MUST be synchronized across ALL THREE platforms:**

### 1. Vanilla JS (Server) - `apps/server/static/`
- **Main file:** `index.html`
- **Scripts:** `script.js`
- **Styles:** `styles.css`
- Pure HTML/CSS/JS implementation

### 2. Next.js App - `apps/nextjs/src/`
- **Main file:** `pages/index.js`
- **Components:** `components/` directory
- **Styles:** `styles/globals.css`
- React with Next.js framework

### 3. React.js App - `apps/reactjs/src/`
- **Main file:** `App.js`
- **Components:** `components/` directory
- **Styles:** `index.css`
- Pure React implementation

## Required Actions for UI Changes

When making ANY UI modification:

1. **Identify the change scope** - Does it affect:
   - Layout/structure
   - Components (forms, buttons, toggles)
   - Styling/theming
   - User interactions
   - Authentication flows

2. **Apply changes to ALL THREE platforms:**
   - Update vanilla JS version first (simplest implementation)
   - Adapt to React.js version (componentize if needed)
   - Adapt to Next.js version (consider SSR implications)

3. **Maintain functional equivalency:**
   - Same user experience across all platforms
   - Same authentication behavior
   - Same theming support (light/dark mode)
   - Same form validation and error handling

4. **Test all implementations:**
   - Verify identical functionality
   - Check responsive design consistency
   - Ensure theme switching works uniformly

## Component Mapping

| Feature | Vanilla JS | Next.js | React.js |
|---------|------------|---------|----------|
| Theme Toggle | Button in HTML + JS | `ThemeToggle` component | `ThemeToggle` component |
| Password Form | HTML form | `PasswordForm` component | `PasswordForm` component |
| User Form | HTML form | `UserForm` component | `UserForm` component |
| User Info | HTML div | `UserInfo` component | `UserInfo` component |
| Toast Messages | HTML div | `Toast` component | `Toast` component |
| Logout Toggle | HTML button | `LogoutToggle` component | `LogoutToggle` component |

## Styling Consistency

- **CSS Variables:** Use consistent CSS custom properties across all implementations
- **Theme Support:** Ensure `data-theme` attribute works uniformly
- **Responsive Design:** Maintain same breakpoints and mobile behavior
- **Visual Identity:** Keep logo, colors, and typography identical

**NO EXCEPTIONS** - All UI changes must be applied to all three implementations.

## README Consistency Requirements

**WHENEVER ANY README content is modified, ensure consistency across all frontend implementations:**

### Required README Sections (in order):
1. **Title** - Technology-specific (e.g., "React.js Version", "Next.js Version")
2. **Description** - Brief description with technology-specific details
3. **Quick Start** - Installation and startup instructions
4. **Features** - Common features + technology-specific advantages
5. **Project Structure** - Directory structure (technology-specific paths)
6. **API Integration** - How the frontend connects to backend
7. **Development** - Development features and tools
8. **Building for Production** - Build instructions
9. **Testing** - Test setup and commands
10. **Environment Variables** - Production deployment variables

### Consistency Requirements:
- **Common Content**: Features, authentication flow, and general descriptions should be identical
- **Technology-Specific Content**: Build processes, development tools, and framework advantages should reflect the specific technology
- **Port Numbers**: Maintain consistent port assignments (Next.js: 3001, React.js: 3002, Server: 3000)
- **API Integration**: Document the specific proxy/connection method for each frontend

### Technology-Specific Sections:
- **React.js**: Focus on Create React App, proxy configuration, Jest testing
- **Next.js**: Emphasize SSR, image optimization, built-in features, TypeScript readiness
- **Vanilla JS**: Keep server README focused on backend API and static file serving

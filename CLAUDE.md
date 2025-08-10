# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**eduplan** - A monorepo project designed to support frontend, backend, and database components.

## Repository Structure

This is a monorepo using npm workspaces with the following structure:

```
eduplan/
├── apps/           # Application packages
│   └── web/       # React frontend (Vite + TypeScript)
├── packages/       # Shared packages (future use)
└── vercel.json    # Vercel deployment configuration
```

## Development Commands

Run from the root directory:

```bash
# Install dependencies
npm install

# Development
npm run dev          # Start the React dev server (apps/web)

# Build
npm run build        # Build the React app for production

# Preview production build
npm run preview      # Preview the production build locally
```

## Technology Stack

### Frontend (apps/web)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Deployment**: Vercel
- **Package Manager**: npm workspaces

## Architecture Decisions

1. **Monorepo Structure**: Using npm workspaces to manage multiple apps and packages
2. **Frontend First**: Starting with React frontend, with placeholder for future backend and database
3. **TypeScript**: Strict TypeScript configuration across the entire monorepo
4. **Deployment**: Configured for Vercel deployment with automatic builds

## Future Expansion

The monorepo is structured to accommodate:
- Backend services in `apps/api` or similar
- Shared packages in `packages/` directory
- Database migrations and schemas
- Additional frontend applications if needed
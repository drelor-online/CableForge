# CableForge

A desktop application for electrical engineers designing oil & gas facilities. CableForge helps create cable schedules, I/O lists, and conduit management with engineering calculations and NEC compliance validation.

## 📋 Project Structure

```
cableforge-app/
├── docs/                  # Project documentation
│   ├── REQUIREMENTS.md    # Functional requirements from Q&A session
│   ├── TECHNICAL_SPEC.md  # Database schema and architecture
│   ├── USER_STORIES.md    # User stories with acceptance criteria
│   └── DEVELOPMENT_ROADMAP.md # Implementation roadmap
├── mockups/               # HTML/CSS prototypes and design mockups
├── tests/                 # Test files and configurations
├── src/                   # React TypeScript frontend
│   ├── components/        # UI components
│   ├── services/          # Backend service interfaces
│   ├── stores/            # Zustand state management
│   └── types/             # TypeScript type definitions
├── src-tauri/             # Rust backend
│   ├── src/database/      # SQLite database operations
│   ├── src/validation/    # Cable validation engine
│   └── src/commands.rs    # Tauri IPC commands
└── public/                # Static assets
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (for React frontend)
- **Rust** 1.70+ (for Tauri backend)
- **Git** (for version control)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cableforge-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Tauri CLI**
   ```bash
   npm install -g @tauri-apps/cli
   ```

## 🛠️ Development

### Available Scripts

#### `npm run tauri dev`
Runs the Tauri desktop application in development mode with hot reloading.
- Frontend: React dev server on port 3000
- Backend: Rust compilation with auto-reload
- Opens desktop window automatically

#### `npm start`
Runs only the React frontend (for UI development).
Open [http://localhost:3000](http://localhost:3000) to view in browser.

#### `npm run build`
Builds the React app for production to the `build` folder.

#### `npm run tauri build`
Builds the complete desktop application for production.
Creates platform-specific installers in `src-tauri/target/release/bundle/`

#### `npm test`
Launches the test runner with Vitest.

#### `npm run test:e2e`
Runs end-to-end tests with Playwright.

### Development Workflow

1. **Start development server**
   ```bash
   npm run tauri dev
   ```

2. **Make changes**
   - Frontend: Edit files in `src/`
   - Backend: Edit files in `src-tauri/src/`
   - Both will hot-reload automatically

3. **Run tests**
   ```bash
   npm test              # Unit tests
   npm run test:e2e      # E2E tests
   ```

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **UI Framework**: React 19 with TypeScript
- **State Management**: Zustand stores
- **Data Grid**: AG-Grid Community for Excel-like tables
- **Styling**: CSS with custom design system
- **IPC**: Tauri API for backend communication

### Backend (Rust + Tauri)
- **Framework**: Tauri 2.8.2 for desktop app shell
- **Database**: SQLite with rusqlite (no ORM)
- **Validation**: Custom NEC-based cable validation engine
- **File Operations**: Native file I/O with .cfp project files

### Key Features Implemented ✅
- ✅ **Project Management**: New, open, save, save-as operations
- ✅ **Cable Schedule**: Excel-like table with inline editing
- ✅ **Database Integration**: SQLite with portable .cfp files
- ✅ **Real-time Validation**: NEC compliance and duplicate detection
- ✅ **File Operations**: Native file dialogs and disk I/O
- ✅ **Desktop App**: Cross-platform Tauri application

## 📖 Documentation

Comprehensive documentation is available in the `docs/` folder:

- **[Requirements](docs/REQUIREMENTS.md)** - Complete functional requirements
- **[Technical Specs](docs/TECHNICAL_SPEC.md)** - Database schema and architecture
- **[User Stories](docs/USER_STORIES.md)** - Feature requirements with acceptance criteria
- **[Development Roadmap](docs/DEVELOPMENT_ROADMAP.md)** - Implementation phases

## 🧪 Testing

The project includes comprehensive testing setup:

- **Unit Tests**: Vitest for component and service testing
- **E2E Tests**: Playwright for full application testing
- **TDD Approach**: Test-driven development workflow

## 🎯 Target Users

Electrical engineers working on:
- Oil & gas facility design
- Industrial plant electrical systems
- Cable schedule development
- I/O list management
- NEC compliance documentation

## 📝 Project Status

**Current Phase**: Core cable management with validation system
**Next Priorities**: I/O list management, conduit routing, export functionality

---

Built with ❤️ for electrical engineers by electrical engineers.
# Graph Report - NewerPDInfoCenter  (2026-09-14)

## Corpus Check
- Corpus is ~42,978 words - fits in a single context window. You may not need a graph.

## Summary
- 167 nodes · 316 edges · 14 communities (11 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Frontend Operations
- Backend Authentication
- Frontend Build Configuration
- Dashboard Alerts
- Workspace Scripts
- Frontend Toolchain
- Backend Dependencies
- Police Command Branding
- Development Orchestration
- Realtime WebSocket Flow
- Backend Scripts
- Graphify Navigation

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 19 edges
2. `react` - 17 edges
3. `lucide-react` - 14 edges
4. `playCriticalAlertSound()` - 12 edges
5. `api` - 10 edges
6. `playUrgentAlertSound()` - 10 edges
7. `App()` - 8 edges
8. `playStandardNoticeSound()` - 8 edges
9. `playAckChirp()` - 7 edges
10. `scripts` - 7 edges

## Surprising Connections (you probably didn't know these)
- `NISD POLICE DEPT - Tactical Command & Dispatch System` --conceptually_related_to--> `Northside ISD Police emblem logo`  [INFERRED]
  frontend/index.html → frontend/public/logo.png
- `Northside ISD Police emblem logo` --conceptually_related_to--> `Northside ISD Police Department identity`  [INFERRED]
  frontend/public/logo.png → frontend/index.html
- `NISD POLICE DEPT - Tactical Command & Dispatch System` --references--> `Northside ISD Police shield patch`  [EXTRACTED]
  frontend/index.html → frontend/public/nisd_police_patch.png
- `Northside ISD Police shield patch` --conceptually_related_to--> `Northside ISD Police Department identity`  [EXTRACTED]
  frontend/public/nisd_police_patch.png → frontend/index.html
- `App()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/App.jsx → frontend/src/services/AuthContext.jsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **NISD Police dispatch identity and frontend assets** — frontend_index_html_nisd_police_tactical_command_dispatch_system, frontend_public_logo_png_northside_isd_police_emblem, frontend_public_nisd_police_patch_png_northside_isd_police_patch, concept_northside_isd_police_department, concept_tactical_command_dispatch_system [INFERRED 0.75]
- **Repository graphify workflow guidance** — _github_copilot_instructions_md_graphify_navigation_rules, concept_graphify_knowledge_graph_navigation [EXTRACTED 1.00]

## Communities (14 total, 1 thin omitted)

### Community 0 - "Frontend Operations"
Cohesion: 0.17
Nodes (22): ActiveNoticeBanner(), AssetManager(), DepartmentRoster(), DispatchConsoleModal(), PRESET_TEMPLATES, EmployeeFormModal(), LoginScreen(), NoticeManagerModal() (+14 more)

### Community 1 - "Backend Authentication"
Cohesion: 0.09
Nodes (27): db, dbPath, __dirname, __filename, initSchema(), description, main, name (+19 more)

### Community 2 - "Frontend Build Configuration"
Cohesion: 0.08
Nodes (24): dependencies, clsx, lucide-react, react, react-dom, tailwind-merge, name, private (+16 more)

### Community 3 - "Dashboard Alerts"
Cohesion: 0.34
Nodes (11): App(), AlertHistoryModal(), DashboardOverview(), EmergencyOverlay(), Navbar(), getAudioContext(), playAckChirp(), playCriticalAlertSound() (+3 more)

### Community 4 - "Workspace Scripts"
Cohesion: 0.17
Nodes (11): description, name, private, scripts, backend, dev, frontend, install:all (+3 more)

### Community 5 - "Frontend Toolchain"
Cohesion: 0.25
Nodes (8): devDependencies, autoprefixer, postcss, tailwindcss, @types/react, @types/react-dom, vite, @vitejs/plugin-react

### Community 6 - "Backend Dependencies"
Cohesion: 0.29
Nodes (7): dependencies, bcryptjs, better-sqlite3, cors, dotenv, express, ws

### Community 7 - "Police Command Branding"
Cohesion: 0.43
Nodes (7): Dark tactical visual theme, Frontend root application mount, Northside ISD Police Department identity, Tactical command and dispatch system, NISD POLICE DEPT - Tactical Command & Dispatch System, Northside ISD Police emblem logo, Northside ISD Police shield patch

### Community 8 - "Development Orchestration"
Cohesion: 0.33
Nodes (4): backend, __dirname, __filename, frontend

### Community 9 - "Realtime WebSocket Flow"
Cohesion: 0.40
Nodes (3): connectWebSocket(), listeners, sendWebSocketMessage()

### Community 10 - "Backend Scripts"
Cohesion: 0.50
Nodes (4): scripts, dev, seed, start

## Knowledge Gaps
- **73 isolated node(s):** `__filename`, `__dirname`, `dbPath`, `name`, `version` (+68 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 82 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Frontend Operations` to `Frontend Build Configuration`, `Dashboard Alerts`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Why does `lucide-react` connect `Frontend Operations` to `Frontend Build Configuration`, `Dashboard Alerts`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Frontend Toolchain` to `Frontend Build Configuration`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `__filename`, `__dirname`, `dbPath` to the rest of the system?**
  _73 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Authentication` be split into smaller, more focused modules?**
  _Cohesion score 0.0873440285204991 - nodes in this community are weakly interconnected._
- **Should `Frontend Build Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
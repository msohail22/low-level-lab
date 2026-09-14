# UI Overhaul — Self-Contained AI Execution Blueprint

This document is a **100% self-contained, turnkey blueprint** designed for an AI Coding Agent to execute the complete UI overhaul for Low Level Lab in a single run.

---

## 1. Overview & Core Aesthetic

- **Design Philosophy**: *"Low Level Lab, reset as a reference manual"* (Reference: `PDF Gallery_20260914_094519.pdf`).
- **Layout & Structure**:
  - `1px solid hairline borders` replace dropped shadows, rounded elevation boxes, and soft gradient backgrounds.
  - Structure comes strictly from grid lines and hairlines (`border-color: var(--rule)`). Corners are sharp (`0px` or `2px` max).
- **Typography Rules**:
  - **Headings & Standfirsts**: `Spectral` (Serif). Major page titles set to 42pt/50pt, standfirst subtitles set to 18pt italic.
  - **Data, Code, Addresses & Metrics**: `IBM Plex Mono` (Monospace). Numbers are always mono and tabular (`font-variant-numeric: tabular-nums`).
- **Color System Rules**:
  - **Light Mode (Paper Theme)**:
    - Base Canvas: `#EDEDE7` (`--paper`)
    - Sunk Surface / Panel: `#E4E4DC` (`--paper-sunk`)
    - Primary Text / Ink: `#14171C` (`--ink`)
    - Muted Text: `#66665E` (`--ink-muted`)
    - Hairline Rule: `#C7C7B2` (`--rule`)
    - Index Blue (*"you are here" / "solved"*): `#1F3FD8` (`--index-blue`)
    - Marker / Gold (*Identity highlight*): `#A8791C` on paper (`--marker-gold`) / `#EDE55B` (`--marker-bg`)
  - **Dark Mode (Ground Theme)**:
    - Base Canvas: `#14171C` (`--paper`)
    - Raised Surface / Panel: `#1B1F26` (`--paper-sunk`)
    - Primary Text / Ink: `#EDEDE7` (`--ink`)
    - Muted Text: `#999990` (`--ink-muted`)
    - Hairline Rule: `#2E343C` (`--rule`)
    - Index Blue Lifted: `#6E8BFF` (`--index-blue`)
    - Marker / Gold: `#EDE55B` (`--marker-gold` / `--marker-bg`)

---

## 2. Reference Resources in Repo

An AI agent working on this task can read these three reference files created during analysis:
1. `docs/low-level-lab-ui-preview.html`: Fully interactive standalone HTML prototype with all CSS tokens, components, widgets, and layouts.
2. `docs/ui-overhaul-architecture.mmd`: Architecture flowchart and state machine diagram.
3. `docs/ui-overhaul-plan.md`: Comprehensive breakdown of all 17 PDF design sheets.

---

## 3. Step-by-Step AI Execution Tasks

### Task 1: Update HTML & Global CSS Variables
1. **`index.html`**:
   Add Google Fonts for `Spectral` and `IBM Plex Mono`:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Spectral:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
   ```
2. **`src/index.css`**:
   Replace generic SaaS CSS variable definitions with reference manual tokens:
   ```css
   :root {
     --paper: #EDEDE7;
     --paper-sunk: #E4E4DC;
     --ink: #14171C;
     --ink-muted: #66665E;
     --index-blue: #1F3FD8;
     --marker-gold: #A8791C;
     --marker-bg: #EDE55B;
     --rule: #C7C7B2;
     --font-serif: 'Spectral', Georgia, serif;
     --font-mono: 'IBM Plex Mono', monospace;
   }
   .dark {
     --paper: #14171C;
     --paper-sunk: #1B1F26;
     --ink: #EDEDE7;
     --ink-muted: #999990;
     --index-blue: #6E8BFF;
     --marker-gold: #EDE55B;
     --marker-bg: #EDE55B;
     --rule: #2E343C;
   }
   body {
     background-color: var(--paper);
     color: var(--ink);
     font-family: var(--font-serif);
   }
   .mono {
     font-family: var(--font-mono);
     font-variant-numeric: tabular-nums;
   }
   ```

---

### Task 2: Build Custom Reference Manual Widgets

1. **`src/components/shared/MemorySpaceWidget.tsx`**:
   - Renders the interactive Process Address Space (`0xFFFF stack down`, `0xFF20 frame: parse()` gold row, `0x7A00 mmap`, `0x4100 heap up`, `0x2000 statics`, `0x0400 text`).
2. **`src/components/shared/HardwareLatencyWidget.tsx`**:
   - Renders the memory hierarchy timing matrix (`L1 4c`, `L2 14c`, `L3 60c`, `DRAM 220c [where you lose]` gold highlighted row).
3. **`src/components/shared/ActivityHeatmap.tsx`**:
   - Renders the 60-day monospace activity grid for the Progress Ledger.

---

### Task 3: Overhaul Core Layout (`Sidebar.tsx` & `AppLayout.tsx`)

1. **`src/components/layout/Sidebar.tsx`**:
   - Header with 3-pin IC logo badge and `LOW LEVEL LAB` uppercase title.
   - Section headers: `STUDY`, `CONTRIBUTE`, `ACCOUNT`.
   - Nav items with tabular numeric badge counts (`Questions [248]`, `Review queue [4]`).
   - Theme toggle button in sidebar footer (`Theme: Paper / Ground`).
2. **`src/components/layout/AppLayout.tsx`**:
   - Top header bar displaying workspace context (`LOW LEVEL LAB — REFERENCE MANUAL SPECIFICATION`).

---

### Task 4: Overhaul Main Application Pages

1. **`src/pages/DashboardPage.tsx`**:
   - Title: *"You left off inside the stack frame."*
   - Stat row with tabular monospace numbers (`77/248 Solved`, `6/9 Topics`, `12 Day Streak`).
   - Grid combining `Pick up where you left off` hairline table and `MemorySpaceWidget`.
2. **`src/pages/QuestionsPage.tsx`**:
   - Search bar + Topic/Difficulty filters.
   - Hairline table view of question bank with ID, Title, Topic tag, and Difficulty pill.
3. **`src/pages/TopicDetailPage.tsx`**:
   - Topic summary + `HardwareLatencyWidget` side panel + subtopics taxonomy list (`a-f`).
4. **`src/pages/QuestionDetailPage.tsx`**:
   - Margin sidebar metadata layout (ID, Topic, Difficulty, Est Time, Author).
   - Standfirst italic subtitle, drop-cap `"S"`, C code blocks, and left accent border callout.
   - Action buttons: `[Reveal answer]`, `[Mark as solved]`, `[Next question]`.
5. **`src/pages/ProgressPage.tsx`**:
   - Title: *"Seventy-seven solved, eight months in."*
   - 60-day heatmap grid + topic breakdown ledger table.
6. **`src/pages/AnalyticsPage.tsx`**:
   - Daily reads line chart + KPIs (3412 reads, 61% solved, 28 saved) + question performance table.
7. **`src/pages/ProfilePage.tsx`**:
   - Author profile card + standing metrics + saved for later empty state.
8. **`src/pages/AuthPage.tsx`**:
   - Sign in split-screen with memory space diagram left + auth form right.
9. **`src/pages/ContentManagementPage.tsx`**:
   - Tabs: `Manage Topics`, `Reviewer Queue` (with change request drawer), `Admin Queue` (two-stage `Approve`/`Publish`), `OpenFGA Roles` (tuple matrix).

---

## 4. Verification Check

After completing all edits, verify build integrity with:
```bash
pnpm lint && pnpm build
```

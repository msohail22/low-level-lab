```markdown
# Systems Programming Judge

A Codeforces-style coding platform focused on **systems programming**, built with **C++ and TypeScript**.

This platform is designed for solving problems in areas like:
- Low-level programming (C/C++)
- Assembly
- OS concepts (processes, memory, scheduling)
- Networking
- Compilers

Unlike traditional coding platforms, the focus here is on **execution behavior, system interaction, and performance**, not just algorithmic correctness.

---

## Architecture Overview

```

Frontend (Next.js - TypeScript)
↓ HTTP
Backend API (NestJS - TypeScript)
↓
Queue (Redis / BullMQ)  →  (Future: Kafka)
↓
Workers (C++)
↓
Sandbox (C++)

```

---

## Core Components

### 1. Frontend (`apps/web`)
- Built with Next.js
- Provides problem UI, code editor, submissions, results

### 2. Backend API (`backend/api`)
- Handles:
  - authentication
  - problem management
  - submissions
- Pushes jobs to the queue

### 3. Queue
- **Current:** Redis + BullMQ
- **Future:** Apache Kafka (for high-throughput, distributed processing)
- Decouples API from execution
- Enables async processing and scaling

### 4. Workers (`workers/judge`)
- Written in C++
- Pull jobs from queue
- Compile and execute user code

### 5. Sandbox (`sandbox/core`)
- Low-level execution environment
- Uses OS primitives:
  - `fork`, `exec`
  - `setrlimit`
  - (optional) `seccomp`
- Ensures safe execution of untrusted code

---

## Execution Flow

1. User submits code  
2. API receives request and enqueues job  
3. Worker pulls job from queue  
4. Code is compiled and executed inside sandbox  
5. Output and status are returned to API  
6. User sees result  

---

## Goals

- Learn and implement **systems-level execution**
- Build a **secure code runner**
- Explore **process isolation and resource limits**
- Support non-traditional problems (OS, networking, compilers)
- Evolve into a **distributed judging system (Kafka-based)**

---

## Tech Stack

- **Frontend:** Next.js, React, TypeScript  
- **Backend:** NestJS, TypeScript  
- **Queue (current):** Redis, BullMQ  
- **Queue (future):** Apache Kafka  
- **Execution:** C++  
- **Sandbox:** Linux system calls  

---

## Why this project

This is not just another coding platform. It is designed to:
- Go deeper into **how code actually runs**
- Work closer to the **OS and hardware boundary**
- Build real-world understanding of **execution environments**
- Transition from simple queues to **distributed event-driven systems**

---

## Status

Work in progress.
```


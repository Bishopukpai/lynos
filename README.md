# 🎬 Scenepilot

> **AI-powered production management infrastructure for film and media teams.**

Scenepilot is an AI-powered production management platform designed to help film, television, and media production teams plan, coordinate, and manage their productions from a centralized workspace.

It combines production management workflows with AI-assisted planning, team collaboration, notifications, organization management, and intelligent production support.

---

## What the Project Does

Scenepilot provides a centralized digital workspace where production teams can manage the operational side of a media production.

Instead of relying on disconnected spreadsheets, messaging applications, documents, and manual coordination, Scenepilot brings important production workflows into a single platform.

The long-term vision is to provide an **AI-native operating system for media production**, where production teams can use intelligent agents to assist with research, planning, coordination, and decision-making.

---

## 1. The Problem It Solves

Film and media production involves coordinating many moving parts simultaneously:

* Production teams
* Projects and organizations
* Schedules
* Tasks
* Communication
* Research
* Production planning
* Team permissions
* Notifications
* Production documents
* Operational decisions

These workflows are often distributed across multiple tools.

This creates several problems:

* Information becomes fragmented across different platforms.
* Production managers spend significant time coordinating routine tasks.
* Teams have difficulty maintaining a single source of truth.
* Important notifications and updates can be missed.
* Production information is difficult to organize and retrieve.
* Planning and research require significant manual effort.

### Scenepilot addresses this by providing a unified production workspace with AI capabilities built directly into the workflow.

The goal is not simply to digitize existing production processes, but to make them **more intelligent, collaborative, and automated**.

---

## 2. Key Features

### 🏢 Organization Management

Manage production organizations and their members from a centralized workspace.

* Organization workspaces
* Member management
* Role-based access
* Team invitations
* Organization settings
* Member status management

### 🔔 Production Notifications

Keep teams informed about important activity.

* Notification center
* Unread notification tracking
* Invitation notifications
* Team activity updates
* Notification refresh
* Accept/decline workflows

### 👥 Team Collaboration

Give production teams a shared environment for coordinating their work.

* Team members
* Organization roles
* Permissions
* Collaboration workflows
* Centralized production information

### 🤖 AI-Powered Production Assistance

Scenepilot is designed around AI-assisted production workflows.

Future AI capabilities include:

* Production planning
* Research assistance
* Intelligent recommendations
* Production analysis
* Automated task generation
* Context-aware production assistance

### 📋 Production Management

Centralize production-related operational information.

The platform is designed to support workflows such as:

* Project management
* Production planning
* Task coordination
* Team management
* Scheduling
* Production research
* Operational tracking

### 🔐 Secure Authentication & Authorization

Scenepilot is designed with authenticated production workspaces and permission-aware functionality.

Users can access resources based on their organization membership and assigned permissions.

---

## 3. Screenshots / Demo

> a live demo will be added as the platform reaches production-ready milestones, but for now here are some pictures of progress made:

## Landing Page
<img width="1898" height="887" alt="Screenshot 2026-08-10 081151" src="https://github.com/user-attachments/assets/d785d438-6455-4cb5-9fd9-c6c82a514360" />

## Sign-up page
<img width="1208" height="867" alt="Screenshot 2026-08-12 182216" src="https://github.com/user-attachments/assets/242cedd3-1179-45f6-a8a8-304d75364093" />

## Sign-in page
<img width="952" height="905" alt="Screenshot 2026-08-15 060256" src="https://github.com/user-attachments/assets/6f82c613-1202-4d4e-a38d-5a02618d6fd2" />

## Dashboard
<img width="1895" height="905" alt="Screenshot 2026-08-19 110911" src="https://github.com/user-attachments/assets/ff7a6838-36e4-4291-a649-8fb3ad365a9f" />

## Invitation modal
<img width="1108" height="720" alt="Screenshot 2026-08-19 071813" src="https://github.com/user-attachments/assets/47557d01-8014-490a-a724-b28e2ba4c570" />

## Notification panel
<img width="1571" height="597" alt="Screenshot 2026-08-19 071633" src="https://github.com/user-attachments/assets/eebc980c-7af7-46c4-bda1-d3cc8e4a387e" />


## 4. Tech Stack

Scenepilot  is built using a modern full-stack TypeScript architecture.

| Technology        | Purpose                                |
| ----------------- | -------------------------------------- |
| **Next.js**       | Full-stack React application framework |
| **React**         | User interface                         |
| **TypeScript**    | Type-safe application development      |
| **Tailwind CSS**  | UI styling                             |
| **MongoDB**       | Application database                   |
| **MongoDB Atlas** | Cloud database infrastructure          |
| **Google Gemini** | AI capabilities                        |
| **Node.js**       | Server-side runtime                    |
| **Lucide React**  | Interface icons                        |
| **GitHub**        | Source control and collaboration       |

### Core Architecture

```text
Frontend
   │
   ▼
Next.js / React
   │
   ├── UI Components
   ├── Application Pages
   ├── Organization Management
   ├── Notifications
   └── Production Workflows
          │
          ▼
     Server / API Layer
          │
     ┌────┴────┐
     ▼         ▼
 MongoDB    Gemini AI
     │         │
     ▼         ▼
Production   AI-powered
Data         workflows
```

---

## 5. Architecture

Scenepilot's  follows a modular full-stack architecture designed to support the gradual introduction of AI agents and production automation.

### High-Level Architecture

```text
                         ┌──────────────────────┐
                         │      Scenepilot      │
                         │      Web Client      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Next.js         │
                         │ Application Layer    │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼
             Authentication   Production       Organization
             & Authorization   Workflows        Management
                    │               │                │
                    └───────────────┼────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Data Layer      │
                         │       MongoDB        │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      AI Layer        │
                         │   Google Gemini      │
                         └──────────────────────┘
```

### Design Principles

 Scenepilot  is being developed around several principles:

**Modularity**

Production capabilities should be independently maintainable and extensible.

**AI-native workflows**

AI should assist users inside existing production workflows rather than exist as an isolated chatbot.

**Centralized production context**

The platform should maintain useful context about projects, teams, tasks, and production operations.

**Scalability**

The architecture is designed to support additional production services and AI agents as the platform evolves.

**Security**

Authentication, authorization, environment configuration, and database access are treated as core infrastructure rather than afterthoughts.

---

## 6. How to Run It Locally

### Prerequisites

Make sure you have installed:

* Node.js 20+
* npm
* Git
* MongoDB / MongoDB Atlas account
* Google Gemini API access

### Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

cd YOUR_REPOSITORY
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a local environment file:

```bash
cp .env.example .env.local
```

Then configure the required values.

See the **Environment Variables** section below.

### Start the Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

### Run Linting

```bash
npm run lint
```

### Run TypeScript Validation

```bash
npx tsc --noEmit
```

### Create a Production Build

```bash
npm run build
```

### Start the Production Server

```bash
npm start
```

---

## 7. Environment Variables

Scenepilot uses environment variables for sensitive configuration.

Create a `.env.local` file in the root of the project.

Example:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONGODB_URI=
AUTH_SECRET=
GOOGLE_CLOUD_PROJECT_ID=
GEMINI_API_KEY=
PARALLEL_API_KEY=
```

> **Important:** Never commit `.env.local` or production secrets to GitHub.

A sanitized `.env.example` file should be maintained in the repository so developers know which variables are required without exposing credentials.

### Environment Security

The following should never be committed:

```text
.env
.env.local
.env.production
API keys
Database credentials
Private tokens
Authentication secrets
```

---

## 8. Database Setup

Scenepilot uses **MongoDB** as its primary application database.

MongoDB Atlas can be used to provide the cloud database infrastructure.

### Create a MongoDB Database

1. Create a MongoDB Atlas account.
2. Create a cluster.
3. Create a database user.
4. Configure network access.
5. Obtain the MongoDB connection string.
6. Add the connection string to `.env.local`.

Example:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
```

The application uses the MongoDB connection configuration to access production data.

### Database Responsibilities

MongoDB is intended to store application data such as:

* Users
* Organizations
* Organization members
* Notifications
* Production projects
* Production-related application data

As the application grows, additional collections and indexes can be introduced for specific production workflows.

---

## 9. Authentication

Authentication protects access to production workspaces and user-specific resources.

The authentication architecture is designed around:

```text
User
 │
 ▼
Authentication
 │
 ▼
Authenticated Session
 │
 ▼
Organization Membership
 │
 ▼
Role / Permissions
 │
 ▼
Authorized Resources
```

Authorization is particularly important because production organizations may contain multiple users with different responsibilities and access levels.

### Authorization Model

The platform is designed to support organization-level access control, including:

* Organization membership
* User roles
* Permission-aware actions
* Protected production resources
* Team administration

> The exact authentication provider and implementation should be documented here once the authentication layer is finalized.

---

## 10. Deployment

Scenepilot is designed to be deployed as a modern Next.js application.

### Recommended Deployment Architecture

```text
                  GitHub
                     │
                     ▼
                CI / Build
                     │
                     ▼
              Next.js Hosting
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
      MongoDB Atlas         Gemini API
          │                     │
          └──────────┬──────────┘
                     ▼
                StudioOS
```

### Production Deployment

A typical deployment process is:

```bash
npm ci
npm run lint
npx tsc --noEmit
npm run build
```

Then deploy the resulting Next.js application through the selected hosting platform.

### Production Environment Variables

Production secrets should be configured through the hosting provider's environment-variable management system rather than committed to the repository.

---

## 11. Roadmap

Scenepilot is being developed incrementally toward a complete AI-powered production operating system.

### Phase 1 — Core Platform

* [x] Next.js application
* [x] TypeScript foundation
* [x] Tailwind-based UI
* [x] MongoDB integration
* [x] Organization management
* [x] Team/member management
* [x] Notification system
* [ ] Production project management
* [ ] Production workspace improvements

### Phase 2 — Production Management

* [ ] Production projects
* [ ] Production task management
* [ ] Production scheduling
* [ ] Production milestones
* [ ] Team assignments
* [ ] Production dashboards
* [ ] Production documents
* [ ] Activity history

### Phase 3 — AI Production Assistant

* [ ] Gemini-powered production assistant
* [ ] AI production planning
* [ ] Intelligent task generation
* [ ] Production research
* [ ] AI recommendations
* [ ] Context-aware production assistance

### Phase 4 — Autonomous Production Agents

* [ ] Director/production AI agent
* [ ] Research agent
* [ ] Production planning agent
* [ ] Scheduling agent
* [ ] Automated workflow execution
* [ ] Agent-to-agent collaboration

### Phase 5 — Production Intelligence

* [ ] Production analytics
* [ ] Performance insights
* [ ] Risk detection
* [ ] Schedule optimization
* [ ] Resource optimization
* [ ] AI-powered production forecasting

### Phase 6 — Production Ecosystem

* [ ] External integrations
* [ ] Communication integrations
* [ ] File storage integrations
* [ ] Calendar integrations
* [ ] Production service integrations
* [ ] API platform
* [ ] Enterprise capabilities

---

## 12. Future Improvements

The long-term vision for Scenepilot extends beyond traditional production management software.

### 🧠 Autonomous Production Operations

Scenepilot could evolve from a tool that helps production teams manage work into an intelligent system capable of actively coordinating production operations.

AI agents could:

* Monitor production progress
* Identify potential issues
* Recommend corrective actions
* Research production requirements
* Generate planning documents
* Coordinate repetitive workflows
* Surface important information automatically

### 🎥 Production Intelligence

Future versions could analyze production data to provide insights into:

* Schedule risks
* Resource allocation
* Production bottlenecks
* Task dependencies
* Budget-related risks
* Team workload
* Production performance

### 🔌 Production Integrations

Scenepilot could integrate with the tools production teams already use, creating a connected production ecosystem rather than forcing teams to abandon existing workflows.

### 🌎 Scalable Production Infrastructure

The long-term goal is to build infrastructure that can support productions ranging from independent projects to larger professional media organizations.

---

## Vision

Scenepilot aims to become more than another project-management application.

The vision is to build an **AI-powered operating system for media production**—a platform where production teams can manage their people, projects, workflows, information, and decisions while AI handles increasingly complex operational tasks.

> **Build the infrastructure. Let AI handle the complexity. Let production teams focus on creating.**

---

## Project Status

🚧 **Active Development**

Scenepilot is currently under active development. Features, architecture, and APIs may change as the platform evolves.

---

## Contributing

Contributions, suggestions, and technical discussions are welcome as the project matures.

If you find an issue or have an idea for improving Scenepilot, please open a GitHub Issue describing:

1. The problem
2. The proposed solution
3. Why the change would benefit production teams

---

## License

This project is currently under active development.

See the `LICENSE` file for licensing information.

---

## Author

**Ukpai Bishop**

Building AI-powered software infrastructure for modern production workflows.

[GitHub](https://github.com/Bishopukpai)

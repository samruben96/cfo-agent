---
stepsCompleted: [1, 2, 3, 4]
status: complete
completedAt: 2025-12-29
starterTemplateInitialized: true
inputDocuments:
  - path: "_bmad-output/planning-artifacts/prd.md"
    type: "prd"
  - path: "_bmad-output/planning-artifacts/architecture.md"
    type: "architecture"
  - path: "_bmad-output/planning-artifacts/ux-design-specification.md"
    type: "ux-design"
  - path: "_bmad-output/project-context.md"
    type: "project-context"
---

# bfi-cfo-bot - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bfi-cfo-bot, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**User Management & Onboarding (FR1-FR6)**
- FR1: Users can create an account with email and password
- FR2: Users can log in and log out securely
- FR3: Users can reset their password via email
- FR4: Users can complete an onboarding questionnaire (5-8 questions about their agency)
- FR5: Users can update their agency profile information after onboarding
- FR6: System isolates each user's data from other users (tenant isolation)

**Data Ingestion (FR7-FR16, FR50-FR51)**
- FR7: Users can connect their QuickBooks Online account via OAuth
- FR8: Users can disconnect their QuickBooks Online account
- FR9: Users can upload CSV files containing financial data (P&L, payroll, employee roster)
- FR10: Users can upload PDF documents (P&L reports, payroll summaries)
- FR11: Users can manually input overhead costs via intake forms (rent, utilities, software, insurance)
- FR12: Users can manually input employee/headcount data via intake forms (role, department, salary, benefits)
- FR13: Users can provide or update data conversationally through the chat interface
- FR14: System pulls P&L and payroll data from connected QuickBooks accounts
- FR15: System parses uploaded CSV files and extracts structured data
- FR16: System processes uploaded PDF documents and extracts financial data
- FR50: System syncs QuickBooks data on-demand when user requests refresh
- FR51: System displays last sync timestamp for connected data sources

**Document Processing & Data Clarification (FR17-FR21)**
- FR17: System identifies unclear or ambiguous data in uploaded documents
- FR18: System prompts users to clarify ambiguous data through interactive questions
- FR19: Users can categorize or re-categorize extracted expense items
- FR20: System handles partial data extraction gracefully when documents are incomplete
- FR21: System notifies users of document processing status and any issues found

**CFO Intelligence & Calculations (FR22-FR29, FR46-FR47)**
- FR22: System calculates fully loaded employee cost (salary + taxes + benefits + overhead allocation)
- FR23: System calculates basic EBITDA from available financial data
- FR24: System calculates payroll as a percentage of revenue (payroll ratio)
- FR25: System calculates profitability per employee or per role
- FR26: System calculates hiring affordability based on current margins and proposed salary
- FR27: System provides context for calculations (e.g., industry benchmarks where available)
- FR28: System tracks and aggregates software/SaaS costs
- FR29: System allocates overhead costs across employees for true cost analysis
- FR46: System calculates basic cash position and cash runway based on available data
- FR47: System identifies and displays spending trends over time (not just totals)

**Chat Interface & Q&A (FR30-FR35, FR48-FR49)**
- FR30: Users can ask financial questions in natural language
- FR31: System responds to questions with clear, contextual answers
- FR32: System provides answers within acceptable response time
- FR33: Users can ask follow-up questions in conversation context
- FR34: System suggests relevant follow-up questions or insights
- FR35: Users can request specific calculations through chat (e.g., "What if I hire at $50K?")
- FR48: Users can view their previous chat conversations (session history)
- FR49: Users can continue or reference previous conversations

**Report Generation & Storage (FR36-FR41)**
- FR36: Users can request formatted reports through the chat interface
- FR37: System generates formatted financial reports (employee cost breakdown, payroll analysis, etc.)
- FR38: Users can save generated reports for later access
- FR39: Users can view previously saved reports
- FR40: Users can download or share generated reports
- FR41: System stores uploaded documents for reference

**System & Data Management (FR42-FR45)**
- FR42: Users can view what data sources are connected
- FR43: Users can view the status of their data (last sync, completeness)
- FR44: Users can delete their account and associated data
- FR45: System maintains audit trail of data changes and calculations

### NonFunctional Requirements

**Performance (NFR1-NFR6)**
- NFR1: Chat responses return within 3 seconds for simple queries
- NFR2: Complex calculations (multi-employee analysis) complete within 5 seconds
- NFR3: Document upload provides immediate acknowledgment with processing status
- NFR4: PDF/CSV document processing completes within 30 seconds for typical files (<10 pages/1000 rows)
- NFR5: QuickBooks data sync completes within 10 seconds for typical account size
- NFR6: UI remains responsive during background processing operations

**Security (NFR7-NFR13)**
- NFR7: All data encrypted at rest (database, file storage)
- NFR8: All data encrypted in transit (HTTPS/TLS)
- NFR9: User authentication via secure methods (Supabase Auth)
- NFR10: QuickBooks OAuth tokens stored securely and refreshed appropriately
- NFR11: Tenant data isolation enforced at database level (no cross-tenant data access)
- NFR12: Session management with appropriate timeouts
- NFR13: Secure file upload handling (type validation, size limits, malware considerations)

**Reliability & Data Integrity (NFR14-NFR19)**
- NFR14: System availability of 99% during business hours (reasonable SaaS standard)
- NFR15: Financial calculations are accurate and consistent (critical requirement)
- NFR16: Data changes logged for audit trail (FR45 support)
- NFR17: Graceful error handling - no silent data loss
- NFR18: Failed operations provide clear error messages to users
- NFR19: Document processing failures don't corrupt existing data

**Integration (NFR20-NFR23)**
- NFR20: QuickBooks OAuth integration follows Intuit best practices
- NFR21: Integration failures handled gracefully with user notification
- NFR22: System continues to function when integrations are unavailable (degraded mode)
- NFR23: Clear feedback when connected services require re-authentication

**Scalability (NFR24-NFR27)**
- NFR24: Architecture supports horizontal scaling without major refactoring
- NFR25: Database schema supports efficient queries as data grows
- NFR26: File storage approach scales with document volume
- NFR27: No hard-coded limits that would block reasonable growth

### Additional Requirements

**From Architecture Document:**
- Starter Template: Use `npx create-next-app@latest bfi-cfo-bot -e with-supabase` (Official Supabase Starter)
- Technology Stack: Next.js 15 (App Router) + TypeScript (strict) + Supabase PostgreSQL + Vercel AI SDK + OpenAI GPT-5.2
- Testing Infrastructure: Vitest for unit/integration tests + Playwright for E2E tests
- Document Processing: Zerox library + GPT-5.2 vision for PDF extraction with structured schemas
- RLS Required: Every database table MUST have Row Level Security policies
- Server Actions: All mutations via Server Actions with `{ data, error }` return shape
- Streaming Chat: Implement streaming responses via Vercel AI SDK `streamText()`
- Single Environment: Single Supabase project for dev + prod (MVP simplicity)
- Theme Customization: Configure UX spec colors in `tailwind.config.ts` before any UI work
- Dependency Pinning: Pin all dependency versions in `package.json` from Day 1

**From UX Design Specification:**
- Chat-First Architecture: Chat interface is the primary (only) product surface
- Collapsible Panel Layout: Clean chat by default with side panel available on-demand
- Streaming Response Delivery: Text appears progressively for perceived speed
- Desktop-First Responsive: Optimized for desktop/laptop with responsive fallbacks
- WCAG 2.1 AA Compliance: All text meets 4.5:1 contrast, keyboard navigable, screen reader support
- Visual Design Theme: "Professional Warmth" with Deep Navy (#1e3a5f) and Warm Gold (#d4a574)
- Typography: Inter font family with defined type scale
- First Win in 5 Minutes: User must get valuable insight in first session
- Custom Components Required:
  - ChatMessage (user + assistant variants with streaming)
  - RichResponseCard (cost-breakdown, hiring-analysis, metric-highlight, report-summary)
  - TypingIndicator (animated dots during response generation)
  - DataSourceBadge (quickbooks, document, manual, calculated variants)
  - QuickActionButton (primary, secondary, ghost variants)
  - DocumentDropZone (drag-and-drop file upload)
  - OnboardingQuestion (intake question display during setup)
- Empty State Design: Warm welcome, example questions, never feel cold or empty
- Error Handling: Conversational tone, friendly recovery paths, never "Error 500"

**From Project Context:**
- Server Action Response: ALL Server Actions must return `{ data: T | null, error: string | null }`
- Import Order: React/Next → External packages → Internal @/ aliases → Relative → Types
- Path Aliases: Always use @/ for project root, never ../../../
- Naming Conventions: camelCase (TS), snake_case (DB), PascalCase (components)
- Component Props: Always accept optional `className`, use `cn()` for class merging
- Logging Pattern: Structured logging with `[ServiceName]` prefix
- Testing Location: Co-located unit tests (ChatMessage.test.tsx next to ChatMessage.tsx)

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Account creation with email/password |
| FR2 | Epic 1 | Secure login/logout |
| FR3 | Epic 1 | Password reset via email |
| FR4 | Epic 2 | Onboarding questionnaire (5-8 questions) |
| FR5 | Epic 2 | Update agency profile after onboarding |
| FR6 | Epic 1 | Tenant data isolation |
| FR7 | Epic 4 | Connect QuickBooks via OAuth |
| FR8 | Epic 4 | Disconnect QuickBooks |
| FR9 | Epic 3 | Upload CSV files |
| FR10 | Epic 3 | Upload PDF documents |
| FR11 | Epic 3 | Manual overhead cost input forms |
| FR12 | Epic 3 | Manual employee/headcount input forms |
| FR13 | Epic 2 | Conversational data input through chat |
| FR14 | Epic 4 | Pull P&L/payroll from QuickBooks |
| FR15 | Epic 3 | Parse CSV files and extract data |
| FR16 | Epic 3 | Process PDF documents and extract data |
| FR17 | Epic 3 | Identify unclear/ambiguous document data |
| FR18 | Epic 3 | Prompt users to clarify ambiguous data |
| FR19 | Epic 3 | Categorize/re-categorize expense items |
| FR20 | Epic 3 | Handle partial data extraction gracefully |
| FR21 | Epic 3 | Notify users of processing status/issues |
| FR22 | Epic 5 | Calculate fully loaded employee cost |
| FR23 | Epic 5 | Calculate basic EBITDA |
| FR24 | Epic 5 | Calculate payroll ratio |
| FR25 | Epic 5 | Calculate profitability per employee/role |
| FR26 | Epic 5 | Calculate hiring affordability |
| FR27 | Epic 5 | Provide context/industry benchmarks |
| FR28 | Epic 5 | Track and aggregate software/SaaS costs |
| FR29 | Epic 5 | Allocate overhead costs for true cost analysis |
| FR30 | Epic 2 | Ask financial questions in natural language |
| FR31 | Epic 2 | Respond with clear, contextual answers |
| FR32 | Epic 2 | Provide answers within acceptable response time |
| FR33 | Epic 2 | Follow-up questions in conversation context |
| FR34 | Epic 2 | Suggest relevant follow-up questions |
| FR35 | Epic 2 | Request specific calculations through chat |
| FR36 | Epic 6 | Request formatted reports through chat |
| FR37 | Epic 6 | Generate formatted financial reports |
| FR38 | Epic 6 | Save generated reports |
| FR39 | Epic 6 | View previously saved reports |
| FR40 | Epic 6 | Download or share reports |
| FR41 | Epic 3 | Store uploaded documents |
| FR42 | Epic 6 | View connected data sources |
| FR43 | Epic 6 | View data status (last sync, completeness) |
| FR44 | Epic 6 | Delete account and associated data |
| FR45 | Epic 6 | Maintain audit trail of changes/calculations |
| FR46 | Epic 5 | Calculate cash position and runway |
| FR47 | Epic 5 | Identify and display spending trends |
| FR48 | Epic 2 | View previous chat conversations |
| FR49 | Epic 2 | Continue or reference previous conversations |
| FR50 | Epic 4 | Sync QuickBooks data on-demand |
| FR51 | Epic 4 | Display last sync timestamp |

## Epic List

### Epic 1: Foundation & Authentication
Users can create secure accounts, log in, and have their data completely isolated from other users.

**FRs Covered:** FR1, FR2, FR3, FR6

**User Outcomes:**
- Create an account with email/password
- Log in and out securely
- Reset password via email
- Data isolated from other users (tenant isolation)

**Implementation Notes:** Project initialization with Official Supabase Starter, Supabase Auth setup, RLS policies on all tables, basic app shell with UX spec layout structure and theme colors.

---

### Epic 2: Onboarding & Conversational Core
Users can complete onboarding, provide data conversationally, and ask financial questions to get first insights.

**FRs Covered:** FR4, FR5, FR13, FR30, FR31, FR32, FR33, FR34, FR35, FR48, FR49

**User Outcomes:**
- Complete 5-8 question onboarding about their agency
- Update agency profile information
- Ask financial questions in natural language
- Get clear, contextual answers with streaming responses
- Ask follow-up questions in conversation context
- View and continue previous conversations
- Receive suggested follow-up questions and insights

**Implementation Notes:** Streaming chat via Vercel AI SDK, OpenAI GPT-5.2 integration, ChatMessage and TypingIndicator components, conversation persistence. Delivers "first win in 5 minutes" from onboarding data alone.

---

### Epic 3: Document & Form Data Input
Users can upload financial documents and fill intake forms to provide detailed financial data.

**FRs Covered:** FR9, FR10, FR11, FR12, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR41

**User Outcomes:**
- Upload CSV files (P&L, payroll, employee roster)
- Upload PDF documents (P&L reports, payroll summaries)
- Fill overhead cost intake forms (rent, utilities, software, insurance)
- Fill employee/headcount intake forms (role, department, salary, benefits)
- See document processing status and any issues
- Clarify ambiguous data through interactive questions
- Re-categorize extracted expense items
- Access stored documents for reference

**Implementation Notes:** Zerox + GPT-5.2 vision for PDF processing, CSV parsing with structured extraction, DocumentDropZone component, interactive data clarification flow, Supabase Storage for documents.

---

### Epic 4: QuickBooks Integration
Users can connect QuickBooks Online for automatic, continuous data synchronization.

**FRs Covered:** FR7, FR8, FR14, FR50, FR51

**User Outcomes:**
- Connect QuickBooks Online account via OAuth
- Disconnect QuickBooks when needed
- Have P&L and payroll data pulled automatically
- Request on-demand data refresh
- See last sync timestamp for connected data

**Implementation Notes:** OAuth 2.0 following Intuit best practices, secure token storage and refresh, ConnectionStatus component, sync trigger via Server Action.

---

### Epic 5: CFO Intelligence Engine
System provides accurate, consistent, CFO-grade financial calculations and analytics.

**FRs Covered:** FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR46, FR47

**User Outcomes:**
- Get fully loaded employee cost (salary + taxes + benefits + overhead allocation)
- See basic EBITDA calculations
- View payroll as percentage of revenue with industry benchmarks
- Analyze profitability per employee or per role
- Run hiring affordability analysis ("Can I afford to hire at $50K?")
- Track aggregated software/SaaS costs
- See overhead allocation across employees for true cost
- View cash position and cash runway
- See spending trends over time

**Implementation Notes:** Structured calculation functions in lib/calculations/, RichResponseCard variants for displaying results, industry benchmark data where available. Critical: NFR15 requires calculations to be accurate and consistent.

---

### Epic 6: Reports & System Management
Users can generate, save, and manage reports and control their data.

**FRs Covered:** FR36, FR37, FR38, FR39, FR40, FR42, FR43, FR44, FR45

**User Outcomes:**
- Request formatted reports through chat interface
- Get formatted financial reports (employee cost breakdown, payroll analysis, etc.)
- Save generated reports for later access
- View previously saved reports
- Download or share generated reports
- View connected data sources
- View data status (last sync, completeness)
- Delete account and all associated data
- Have audit trail of data changes and calculations

**Implementation Notes:** Report generation with RichResponseCard report-summary variant, Supabase Storage for report PDFs, collapsible panel for saved reports and data sources, account deletion with cascade.

---

## Epic 1: Foundation & Authentication

Users can create secure accounts, log in, and have their data completely isolated from other users.

**FRs Covered:** FR1, FR2, FR3, FR6

---

### Story 1.1: Project Initialization & App Shell

As a **developer**,
I want **the project initialized with proper structure, theming, and basic layout**,
So that **all subsequent features have a consistent foundation to build upon**.

**Acceptance Criteria:**

**Given** the Official Supabase Starter has been initialized
**When** I run the development server
**Then** the app loads with the configured UX theme colors (Deep Navy #1e3a5f, Warm Gold #d4a574)
**And** Tailwind is configured with all design tokens from the UX spec
**And** the basic layout structure exists (header, main chat area placeholder, collapsible panel placeholder)
**And** shadcn/ui is installed and configured
**And** all dependencies are pinned in package.json
**And** the project follows the directory structure from architecture.md

---

### Story 1.2: Database Schema & RLS Foundation

As a **user**,
I want **my data to be completely isolated from other users**,
So that **my financial information remains private and secure**.

**Acceptance Criteria:**

**Given** the Supabase project is connected
**When** the database migrations run
**Then** a `profiles` table exists linked to `auth.users`
**And** the `profiles` table has RLS enabled
**And** users can only read/write their own profile row
**And** the RLS policy uses `auth.uid() = user_id` pattern
**And** a test confirms cross-tenant data access is blocked

**Given** a user is authenticated
**When** they query any user-scoped table
**Then** they only receive their own data
**And** queries for other user IDs return empty results

---

### Story 1.3: User Registration

As a **new user**,
I want **to create an account with my email and password**,
So that **I can access the CFO bot and have my data saved**.

**Acceptance Criteria:**

**Given** I am on the signup page
**When** I enter a valid email and password (min 8 characters)
**And** I click "Create Account"
**Then** my account is created in Supabase Auth
**And** a profile row is created for me automatically
**And** I receive a confirmation email
**And** I am redirected to the onboarding flow

**Given** I enter an email that's already registered
**When** I click "Create Account"
**Then** I see a friendly error message "This email is already registered"
**And** I am offered a link to login instead

**Given** I enter an invalid email format or password less than 8 characters
**When** I try to submit
**Then** I see inline validation errors

---

### Story 1.4: User Login & Logout

As a **returning user**,
I want **to log in and out of my account securely**,
So that **I can access my data and protect it when I'm done**.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I enter my valid email and password
**And** I click "Log In"
**Then** I am authenticated and redirected to the dashboard/chat
**And** my session is stored securely in cookies

**Given** I enter incorrect credentials
**When** I click "Log In"
**Then** I see a friendly error "Invalid email or password"

**Given** I am logged in
**When** I click "Log Out"
**Then** my session is terminated
**And** I am redirected to the login page

**Given** my session expires
**When** I try to access a protected route
**Then** I am redirected to login

---

### Story 1.5: Password Reset

As a **user who forgot their password**,
I want **to reset my password via email**,
So that **I can regain access to my account**.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I click "Forgot Password"
**Then** I am taken to the password reset request page

**Given** I enter my registered email and click "Send Reset Link"
**Then** I see a confirmation "Check your email for reset instructions"
**And** a password reset email is sent

**Given** I click the reset link in my email
**When** I enter a valid new password and submit
**Then** my password is updated
**And** I am redirected to login with a success message

---

## Epic 2: Onboarding & Conversational Core

Users can complete onboarding, provide data conversationally, and ask financial questions to get first insights.

**FRs Covered:** FR4, FR5, FR13, FR30, FR31, FR32, FR33, FR34, FR35, FR48, FR49

---

### Story 2.1: Onboarding Flow

As a **new user**,
I want **to complete a quick onboarding questionnaire about my agency**,
So that **the CFO bot has basic context to help me**.

**Acceptance Criteria:**

**Given** I just registered and am redirected to onboarding
**When** I view the onboarding screen
**Then** I see a welcoming message and the first question

**Given** I am in the onboarding flow
**When** I answer each question (5-8 questions total)
**Then** I see progress indication (e.g., "Question 3 of 6")
**And** my answers are saved to my profile

**Given** I complete all onboarding questions
**When** I finish the last question
**Then** my profile is marked as onboarding_complete
**And** I am redirected to the main chat interface
**And** I see a welcome message with my first insight based on my answers

**Onboarding Questions:**
1. Agency name
2. Annual revenue range (dropdown)
3. Number of employees
4. Your role (Owner / Office Manager / Other)
5. Biggest financial question you want answered
6. (Optional) Monthly rent/overhead estimate

---

### Story 2.2: Agency Profile Management

As a **user**,
I want **to update my agency profile information after onboarding**,
So that **the CFO bot has accurate data about my agency**.

**Acceptance Criteria:**

**Given** I am logged in and have completed onboarding
**When** I navigate to Settings > Agency Profile
**Then** I see my current profile information pre-filled

**Given** I am viewing my agency profile
**When** I update any field and click "Save"
**Then** my changes are saved
**And** I see a success confirmation
**And** the chat uses my updated information going forward

**Given** I update my employee count or revenue
**When** I return to the chat
**Then** the CFO bot acknowledges the updated data in relevant answers

---

### Story 2.3: Chat Interface & Message Display

As a **user**,
I want **to see a clean chat interface where I can view my conversation**,
So that **I can easily read and follow the CFO bot's responses**.

**Acceptance Criteria:**

**Given** I am on the chat page
**When** the page loads
**Then** I see a centered chat area (max-width ~800px)
**And** I see a fixed input area at the bottom
**And** I see example questions if no conversation exists
**And** user messages appear right-aligned with accent background
**And** assistant messages appear left-aligned with white background

**Given** the assistant is responding
**When** the response is streaming
**Then** I see a typing indicator (animated dots) immediately
**And** text appears progressively as it streams
**And** the chat auto-scrolls to follow new content

**Given** I scroll up during streaming
**When** new content arrives
**Then** auto-scroll is paused so I can read
**And** I see a "scroll to bottom" indicator

---

### Story 2.4: Send Message & Get AI Response

As a **user**,
I want **to ask financial questions in natural language and get responses**,
So that **I can get CFO-grade insights without financial expertise**.

**Acceptance Criteria:**

**Given** I am on the chat page with the input focused
**When** I type a question and press Enter (or click Send)
**Then** my message appears in the chat
**And** the input clears
**And** a typing indicator shows immediately
**And** the AI response streams in progressively

**Given** I ask a question like "What does each employee cost me?"
**When** the AI responds
**Then** I receive a clear, contextual answer in plain English
**And** the response completes within 3 seconds for simple queries (NFR1)

**Given** my message fails to send (network error)
**When** the error occurs
**Then** I see a friendly error message
**And** my message is preserved so I can retry

---

### Story 2.5: Conversation Context & Follow-ups

As a **user**,
I want **to ask follow-up questions that reference our conversation**,
So that **I can drill deeper without repeating context**.

**Acceptance Criteria:**

**Given** I asked "What's my payroll ratio?"
**When** I follow up with "How does that compare to industry average?"
**Then** the AI understands "that" refers to my payroll ratio
**And** provides relevant comparison without me re-stating the topic

**Given** I'm in a conversation about employee costs
**When** I ask "Show me the breakdown"
**Then** the AI shows detailed breakdown of the previously discussed costs

**Given** I ask an unrelated question mid-conversation
**When** the AI responds
**Then** it handles the topic switch gracefully
**And** I can return to the previous topic if needed

---

### Story 2.6: Conversational Data Input

As a **user**,
I want **to provide or update data through the chat conversation**,
So that **I don't need to navigate away to forms**.

**Acceptance Criteria:**

**Given** I'm in the chat
**When** I say "My rent is $3,500 per month"
**Then** the AI acknowledges and saves this data
**And** confirms "Got it, I've updated your monthly rent to $3,500"

**Given** I say "I have 8 employees"
**When** the AI processes this
**Then** my employee count is updated
**And** future calculations use this number

**Given** the AI needs information to answer my question
**When** it asks "What's your monthly software spend?"
**Then** I can answer conversationally
**And** the data is captured and used immediately

---

### Story 2.7: Suggested Follow-up Questions

As a **user**,
I want **to see relevant follow-up question suggestions**,
So that **I can explore insights I might not have thought to ask**.

**Acceptance Criteria:**

**Given** the AI has just answered my question
**When** the response completes
**Then** I see 2-3 suggested follow-up questions below the response
**And** suggestions are contextually relevant to my question and data

**Given** I asked about employee costs
**When** I see suggestions
**Then** they might include "Show me profitability by role" or "Can I afford to hire?"

**Given** I click a suggested question
**When** I click it
**Then** it populates the input and sends automatically
**And** the conversation continues naturally

---

### Story 2.8: Conversation History Persistence

As a **user**,
I want **my conversations to be saved**,
So that **I can reference past discussions and continue where I left off**.

**Acceptance Criteria:**

**Given** I have an active conversation
**When** I close the browser and return later
**Then** my conversation history is restored
**And** I can scroll up to see previous messages

**Given** I have past conversations
**When** I open the chat
**Then** the most recent conversation loads by default

**Given** I want to start fresh
**When** I click "New Conversation"
**Then** a new conversation starts
**And** my previous conversation is saved and accessible

---

### Story 2.9: View & Continue Past Conversations

As a **user**,
I want **to view my previous chat conversations**,
So that **I can reference past insights and continue discussions**.

**Acceptance Criteria:**

**Given** I have multiple past conversations
**When** I open the conversation history (via panel or menu)
**Then** I see a list of past conversations with dates/previews

**Given** I select a past conversation
**When** I click on it
**Then** that conversation loads in the chat area
**And** I can continue the conversation with new messages

**Given** I'm viewing conversation history
**When** I search or filter
**Then** I can find specific conversations by date or keyword

---

## Epic 3: Document & Form Data Input

Users can upload financial documents and fill intake forms to provide detailed financial data.

**FRs Covered:** FR9, FR10, FR11, FR12, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR41

---

### Story 3.1: Overhead Cost Intake Form

As a **user**,
I want **to enter my overhead costs via a structured form**,
So that **the CFO bot can accurately calculate true employee costs**.

**Acceptance Criteria:**

**Given** I navigate to Data > Overhead Costs (or access via chat/panel)
**When** I view the form
**Then** I see fields for: Rent, Utilities, Insurance, Software/SaaS (itemized), Other

**Given** I fill in overhead costs
**When** I click "Save"
**Then** my data is saved to the database
**And** I see a success confirmation
**And** this data is available for CFO calculations

**Given** I have existing overhead data
**When** I return to the form
**Then** my previous values are pre-filled
**And** I can update any values

---

### Story 3.2: Employee/Headcount Intake Form

As a **user**,
I want **to enter my employee information via a structured form**,
So that **the CFO bot can calculate per-employee and per-role costs**.

**Acceptance Criteria:**

**Given** I navigate to Data > Employees
**When** I view the form
**Then** I can add employees with: Name/ID, Role, Department, Salary, Benefits cost

**Given** I add an employee
**When** I click "Add Employee"
**Then** the employee is saved
**And** appears in my employee list

**Given** I have multiple employees
**When** I view the list
**Then** I can edit or remove any employee
**And** see a total headcount and payroll summary

---

### Story 3.3: CSV File Upload

As a **user**,
I want **to upload CSV files containing financial data**,
So that **I can import data without manual entry**.

**Acceptance Criteria:**

**Given** I want to upload a CSV
**When** I drag-drop or select a CSV file
**Then** I see upload progress
**And** the file is validated for correct format

**Given** the CSV is valid
**When** processing completes
**Then** I see a preview of extracted data
**And** I can confirm or adjust mappings
**And** data is imported to the appropriate tables

**Given** the CSV has format issues
**When** processing fails
**Then** I see a friendly error explaining the issue
**And** guidance on correct format

**Supported CSV types:** P&L export, Payroll report, Employee roster

---

### Story 3.4: PDF Document Upload

As a **user**,
I want **to upload PDF documents like P&L reports**,
So that **I can provide financial data from existing documents**.

**Acceptance Criteria:**

**Given** I want to upload a PDF
**When** I drag-drop or select a PDF file
**Then** I see upload acknowledgment immediately
**And** I see "Processing..." status

**Given** the PDF is being processed
**When** Zerox + GPT-5.2 extracts data
**Then** processing completes within 30 seconds for typical files (NFR4)
**And** I see a summary of extracted data

**Given** processing completes successfully
**When** I view the results
**Then** I see extracted revenue, expenses, payroll figures
**And** I can confirm the extraction is correct

---

### Story 3.5: Document Processing Status & Notifications

As a **user**,
I want **to see the status of my document processing**,
So that **I know when my data is ready to use**.

**Acceptance Criteria:**

**Given** I uploaded a document
**When** processing is in progress
**Then** I see real-time status updates (Uploading → Processing → Extracting → Complete)

**Given** processing completes
**When** extraction succeeds
**Then** I receive a notification (in-app and/or toast)
**And** the document appears in my document list

**Given** processing fails
**When** an error occurs
**Then** I see a clear error message
**And** suggestions for resolution (re-upload, try different format, manual entry)

---

### Story 3.6: Data Clarification Flow

As a **user**,
I want **to clarify ambiguous data that the system couldn't parse**,
So that **my financial data is accurate**.

**Acceptance Criteria:**

**Given** a document has ambiguous data (e.g., unclear expense category)
**When** processing completes with questions
**Then** I see a clarification prompt in the chat or a dedicated UI

**Given** I'm in a clarification flow
**When** the system asks "Is 'Tech Services' the same as 'Software'?"
**Then** I can answer Yes/No or provide a category
**And** my answer is applied to the data

**Given** I complete all clarifications
**When** I finish
**Then** the data is finalized
**And** I see confirmation that data is ready for analysis

---

### Story 3.7: Expense Categorization & Re-categorization

As a **user**,
I want **to categorize or change categories on extracted expenses**,
So that **my expense breakdown is accurate**.

**Acceptance Criteria:**

**Given** I have extracted expense data
**When** I view the expense list
**Then** I see each expense with its assigned category

**Given** an expense is mis-categorized
**When** I click to edit the category
**Then** I can select from standard categories or create a custom one
**And** the change is saved immediately

**Given** I re-categorize an expense
**When** I run calculations
**Then** the updated category is used in all reports and analyses

---

### Story 3.8: Partial Data Extraction Handling

As a **user**,
I want **the system to work with partial data when documents are incomplete**,
So that **I still get value even with imperfect documents**.

**Acceptance Criteria:**

**Given** a document is partially readable
**When** processing completes
**Then** I see what was successfully extracted
**And** I see what couldn't be extracted with reasons

**Given** partial data was extracted
**When** I ask the CFO bot a question
**Then** it uses available data
**And** indicates any limitations in its answer

**Given** I have partial data
**When** I upload additional documents
**Then** new data fills in gaps
**And** my data completeness improves

---

### Story 3.9: Document Storage & Access

As a **user**,
I want **my uploaded documents stored and accessible**,
So that **I can reference them later**.

**Acceptance Criteria:**

**Given** I uploaded documents
**When** I navigate to Documents (via panel or menu)
**Then** I see a list of all uploaded documents with upload dates

**Given** I select a document
**When** I click on it
**Then** I can view or download the original file
**And** see the extracted data summary

**Given** I want to remove a document
**When** I click "Delete"
**Then** the document and its extracted data are removed
**And** I see confirmation before deletion (destructive action)

---

## Epic 4: QuickBooks Integration

Users can connect QuickBooks Online for automatic, continuous data synchronization.

**FRs Covered:** FR7, FR8, FR14, FR50, FR51

---

### Story 4.1: QuickBooks OAuth Connection

As a **user**,
I want **to connect my QuickBooks Online account**,
So that **my financial data syncs automatically**.

**Acceptance Criteria:**

**Given** I navigate to Connections or click "Connect QuickBooks" in chat/panel
**When** I click the connect button
**Then** I am redirected to QuickBooks OAuth authorization page

**Given** I'm on the QuickBooks authorization page
**When** I grant permission
**Then** I am redirected back to the app
**And** my QuickBooks connection is established
**And** I see "QuickBooks Connected" status

**Given** I deny permission or cancel
**When** I return to the app
**Then** I see a message that connection was not completed
**And** I can try again

---

### Story 4.2: QuickBooks Initial Data Sync

As a **user**,
I want **my QuickBooks data to sync after connecting**,
So that **I can immediately ask questions about my real financial data**.

**Acceptance Criteria:**

**Given** I just connected QuickBooks
**When** the connection is established
**Then** an initial sync begins automatically
**And** I see sync progress indicator

**Given** sync is in progress
**When** data is being fetched
**Then** P&L data is pulled
**And** payroll data is pulled (if available)
**And** sync completes within 10 seconds for typical accounts (NFR5)

**Given** sync completes
**When** I view my data status
**Then** I see "Last synced: [timestamp]"
**And** I can ask questions using my QuickBooks data

---

### Story 4.3: On-Demand QuickBooks Refresh

As a **user**,
I want **to manually refresh my QuickBooks data**,
So that **I can ensure I have the latest numbers**.

**Acceptance Criteria:**

**Given** I have QuickBooks connected
**When** I click "Refresh" or say "Refresh my QuickBooks data"
**Then** a new sync begins
**And** I see sync progress

**Given** sync completes
**When** new data is available
**Then** the last sync timestamp updates
**And** any new/changed data is reflected in my answers

**Given** I ask the CFO bot
**When** I say "When was my data last updated?"
**Then** it tells me the last sync timestamp for each data source

---

### Story 4.4: QuickBooks Connection Status Display

As a **user**,
I want **to see my QuickBooks connection status and last sync time**,
So that **I know if my data is current**.

**Acceptance Criteria:**

**Given** I have QuickBooks connected
**When** I view the Connections panel or Data Sources
**Then** I see QuickBooks with "Connected" status
**And** I see last sync timestamp
**And** I see a "Refresh" button

**Given** my QuickBooks token expired
**When** I view connection status
**Then** I see "Reconnection needed" warning
**And** a button to re-authenticate

**Given** data source badges in chat responses
**When** an answer uses QuickBooks data
**Then** I see "Based on QuickBooks data from [date]"

---

### Story 4.5: QuickBooks Disconnection

As a **user**,
I want **to disconnect my QuickBooks account**,
So that **I can revoke access if needed**.

**Acceptance Criteria:**

**Given** I have QuickBooks connected
**When** I click "Disconnect QuickBooks"
**Then** I see a confirmation dialog explaining what will happen

**Given** I confirm disconnection
**When** the action completes
**Then** my QuickBooks OAuth tokens are deleted
**And** my synced data remains (not deleted)
**And** connection status shows "Not connected"

**Given** I reconnect later
**When** I go through OAuth again
**Then** new sync replaces/updates existing data

---

## Epic 5: CFO Intelligence Engine

System provides accurate, consistent, CFO-grade financial calculations and analytics.

**FRs Covered:** FR22, FR23, FR24, FR25, FR26, FR27, FR28, FR29, FR46, FR47

---

### Story 5.1: Fully Loaded Employee Cost Calculation

As a **user**,
I want **to see the true fully-loaded cost of each employee**,
So that **I understand what employees actually cost beyond their salary**.

**Acceptance Criteria:**

**Given** I have employee data (salary, benefits) and overhead data
**When** I ask "What does each employee cost me?" or "Show me fully loaded costs"
**Then** I see a breakdown per employee showing:
  - Base salary
  - Payroll taxes (estimated %)
  - Benefits
  - Allocated overhead (rent, software, etc. divided by headcount)
  - **Total fully loaded cost**

**Given** the calculation runs
**When** results are displayed
**Then** calculations are accurate and consistent (NFR15)
**And** I can ask "How did you calculate this?" to see the formula

**Given** I have incomplete data
**When** I ask for employee costs
**Then** the AI tells me what data is missing
**And** provides estimates with caveats where possible

---

### Story 5.2: EBITDA Calculation

As a **user**,
I want **to see my basic EBITDA**,
So that **I understand my agency's operating profitability**.

**Acceptance Criteria:**

**Given** I have revenue and expense data
**When** I ask "What's my EBITDA?" or "Show me profitability"
**Then** I see EBITDA calculated as: Revenue - Operating Expenses (before interest, taxes, depreciation, amortization)

**Given** the calculation displays
**When** I view the result
**Then** I see the formula breakdown
**And** which data sources were used

**Given** I'm missing expense categories
**When** I ask for EBITDA
**Then** the AI indicates which expenses might be missing
**And** provides the calculation with available data

---

### Story 5.3: Payroll Ratio Calculation

As a **user**,
I want **to see my payroll as a percentage of revenue**,
So that **I can benchmark against industry standards**.

**Acceptance Criteria:**

**Given** I have payroll and revenue data
**When** I ask "What's my payroll ratio?" or "What percent of revenue is payroll?"
**Then** I see: Payroll Ratio = (Total Payroll / Revenue) × 100%

**Given** the result displays
**When** I view my payroll ratio
**Then** I see industry benchmark comparison (e.g., "Industry average: 45-50%")
**And** context on whether I'm above/below/within range

**Given** I ask for more detail
**When** I say "Break it down by role"
**Then** I see payroll ratio contribution by role type

---

### Story 5.4: Profitability Per Employee/Role

As a **user**,
I want **to see profitability broken down by employee or role**,
So that **I can identify my most and least profitable team members**.

**Acceptance Criteria:**

**Given** I have employee costs and revenue data
**When** I ask "Show me profitability by employee" or "Who's most profitable?"
**Then** I see each employee with:
  - Their fully loaded cost
  - Revenue attribution (if available) or equal split
  - Profit contribution

**Given** I ask for role-level analysis
**When** I say "Profitability by role"
**Then** I see aggregated profitability for Producers, CSRs, Admin, etc.

**Given** some employees lack revenue attribution
**When** calculation runs
**Then** the AI explains the attribution method used
**And** suggests how to improve accuracy

---

### Story 5.5: Hiring Affordability Analysis

As a **user**,
I want **to know if I can afford to hire a new employee**,
So that **I can make confident hiring decisions**.

**Acceptance Criteria:**

**Given** I have current financial data
**When** I ask "Can I afford to hire a CSR at $45K?"
**Then** I see analysis including:
  - Fully loaded cost of new hire
  - Impact on current margins
  - Revenue/policies needed to break even
  - Clear Yes/No/Maybe recommendation with reasoning

**Given** I ask without specifying salary
**When** I say "Can I afford to hire?"
**Then** the AI asks for the role and expected salary
**And** then provides analysis

**Given** the analysis shows marginal affordability
**When** I view the result
**Then** I see conditions under which it becomes clearly affordable
**And** risks if revenue doesn't grow

---

### Story 5.6: Software/SaaS Cost Tracking

As a **user**,
I want **to see my total software and SaaS spending**,
So that **I can identify potential savings**.

**Acceptance Criteria:**

**Given** I have overhead data with software costs
**When** I ask "What am I spending on software?" or "Show me SaaS costs"
**Then** I see itemized software costs and total

**Given** I have multiple software entries
**When** viewing the breakdown
**Then** each tool is listed with monthly/annual cost
**And** I see total annual software spend

**Given** I ask for context
**When** I say "Is this too much?"
**Then** the AI provides perspective (% of revenue, per-employee cost)

---

### Story 5.7: Overhead Cost Allocation

As a **user**,
I want **to see how overhead costs are allocated across employees**,
So that **I understand true per-employee costs**.

**Acceptance Criteria:**

**Given** I have overhead and employee data
**When** I ask "Show me overhead allocation" or this is part of employee cost
**Then** I see total overhead divided by headcount
**And** breakdown by category (rent per person, software per person, etc.)

**Given** the calculation displays
**When** I review allocation
**Then** the method is transparent (equal split or other)
**And** I can ask for alternative allocation methods if needed

---

### Story 5.8: Cash Position & Runway

As a **user**,
I want **to see my cash position and runway**,
So that **I know how long I can operate at current burn rate**.

**Acceptance Criteria:**

**Given** I have cash balance and expense data
**When** I ask "What's my cash runway?" or "How long can I operate?"
**Then** I see:
  - Current cash position (if available)
  - Monthly burn rate
  - Estimated runway in months

**Given** cash data isn't available
**When** I ask about runway
**Then** the AI asks me to provide current cash balance
**And** calculates once provided

**Given** runway is concerning (< 3 months)
**When** displaying results
**Then** the AI highlights this as a warning

---

### Story 5.9: Spending Trends Analysis

As a **user**,
I want **to see how my spending has changed over time**,
So that **I can identify creeping costs**.

**Acceptance Criteria:**

**Given** I have multiple months of expense data
**When** I ask "Show me spending trends" or "Is my spending increasing?"
**Then** I see month-over-month or period-over-period comparison
**And** categories with significant changes are highlighted

**Given** payroll has increased
**When** viewing trends
**Then** I see "Payroll increased X% from [period] to [period]"
**And** context on what drove the change (new hires, raises)

**Given** I only have one period of data
**When** asking for trends
**Then** the AI indicates more data needed
**And** offers to analyze once more data is available

---

### Story 5.10: Industry Benchmarks & Context

As a **user**,
I want **to see how my metrics compare to industry benchmarks**,
So that **I know if I'm performing well relative to peers**.

**Acceptance Criteria:**

**Given** I ask about a metric (payroll ratio, overhead %, etc.)
**When** the AI responds
**Then** it includes relevant industry benchmark when available
**And** indicates source/basis for benchmark

**Given** I ask "How do I compare to other agencies?"
**When** the AI responds
**Then** it provides comparison across key metrics
**And** highlights areas above/below/within benchmarks

**Given** benchmark data isn't available for a metric
**When** providing analysis
**Then** the AI indicates no benchmark available
**And** still provides the raw metric

---

## Epic 6: Reports & System Management

Users can generate, save, and manage reports and control their data.

**FRs Covered:** FR36, FR37, FR38, FR39, FR40, FR42, FR43, FR44, FR45

---

### Story 6.1: Request Report via Chat

As a **user**,
I want **to request formatted reports through the chat**,
So that **I can get professional outputs to share or save**.

**Acceptance Criteria:**

**Given** I'm in the chat
**When** I say "Generate a report on employee costs" or "Create a payroll report"
**Then** the AI generates a formatted report
**And** displays it in a RichResponseCard with report-summary variant

**Given** a report is generated
**When** I view it
**Then** it has a clear title, date, and formatted sections
**And** includes relevant data visualizations where appropriate

---

### Story 6.2: Generate Formatted Financial Reports

As a **user**,
I want **professionally formatted financial reports**,
So that **I can share them with partners or use in meetings**.

**Acceptance Criteria:**

**Given** I request an employee cost report
**When** the report generates
**Then** I see a formatted breakdown with:
  - Report title and date
  - Summary metrics
  - Detailed table with all employees
  - Totals and averages

**Given** I request a payroll analysis report
**When** the report generates
**Then** I see payroll ratio, breakdown by role, trend if available

**Given** the report displays
**When** I view it
**Then** it's screenshot-worthy and professionally formatted

---

### Story 6.3: Save Reports for Later Access

As a **user**,
I want **to save generated reports**,
So that **I can access them later without regenerating**.

**Acceptance Criteria:**

**Given** a report is displayed in chat
**When** I click "Save Report"
**Then** the report is saved to my account
**And** I see confirmation "Report saved"

**Given** I'm saving a report
**When** the save completes
**Then** I can optionally name the report
**And** it appears in my saved reports list

---

### Story 6.4: View Saved Reports

As a **user**,
I want **to view my previously saved reports**,
So that **I can reference past analyses**.

**Acceptance Criteria:**

**Given** I have saved reports
**When** I navigate to Reports (via panel or menu)
**Then** I see a list of saved reports with names and dates

**Given** I select a saved report
**When** I click on it
**Then** the full report displays
**And** I can see all the original data and formatting

**Given** I have many reports
**When** viewing the list
**Then** I can sort by date
**And** search by name

---

### Story 6.5: Download & Share Reports

As a **user**,
I want **to download or share my reports**,
So that **I can use them outside the app**.

**Acceptance Criteria:**

**Given** I'm viewing a report
**When** I click "Download"
**Then** the report downloads as PDF
**And** maintains professional formatting

**Given** I want to share a report
**When** I click "Share"
**Then** I get options to copy link or export
**And** can share via email or other means

**Given** I share a report link
**When** the recipient opens it
**Then** they can view the report (with appropriate access controls)

---

### Story 6.6: View Connected Data Sources

As a **user**,
I want **to see all my connected data sources**,
So that **I know what data the CFO bot is using**.

**Acceptance Criteria:**

**Given** I navigate to Data Sources or Connections
**When** I view the page
**Then** I see all data sources with status:
  - QuickBooks: Connected/Not connected, last sync
  - Documents: Count uploaded, last upload
  - Manual data: Overhead entered, Employees entered

**Given** a data source needs attention
**When** viewing the list
**Then** I see a warning indicator (e.g., "QuickBooks needs reconnection")

---

### Story 6.7: View Data Status & Completeness

As a **user**,
I want **to see the completeness of my data**,
So that **I know if I can get accurate answers**.

**Acceptance Criteria:**

**Given** I view my data status
**When** the page loads
**Then** I see a data completeness indicator (e.g., 75% complete)
**And** I see what data is present vs. missing

**Given** data is missing
**When** viewing status
**Then** I see suggestions to improve completeness
**And** links to add missing data (upload, forms, connect QB)

**Given** I ask "Is my data complete?"
**When** the AI responds
**Then** it tells me completeness status
**And** what's missing for full analysis

---

### Story 6.8: Audit Trail of Changes

As a **user**,
I want **a record of data changes and calculations**,
So that **I can trust and verify the system's work**.

**Acceptance Criteria:**

**Given** data changes (manual edit, sync, upload)
**When** the change occurs
**Then** it's logged with timestamp and source

**Given** I ask "How did you calculate this?"
**When** viewing any calculation
**Then** I can see the inputs, formula, and data sources used

**Given** I want to see history
**When** I access audit trail (admin/settings)
**Then** I see chronological log of data changes

---

### Story 6.9: Account Deletion

As a **user**,
I want **to delete my account and all associated data**,
So that **I can completely remove my information if needed**.

**Acceptance Criteria:**

**Given** I navigate to Settings > Account
**When** I click "Delete Account"
**Then** I see a serious warning explaining what will be deleted

**Given** I confirm deletion
**When** I type "DELETE" and confirm
**Then** my account is deleted
**And** all my data is deleted (profiles, documents, reports, conversations)
**And** I am logged out and redirected to the home page

**Given** account deletion fails
**When** an error occurs
**Then** I see an error message
**And** my account remains intact

---

## Epic Summary

| Epic | Stories | FRs Covered |
|------|---------|-------------|
| Epic 1: Foundation & Authentication | 5 | FR1, FR2, FR3, FR6 |
| Epic 2: Onboarding & Conversational Core | 9 | FR4, FR5, FR13, FR30-FR35, FR48, FR49 |
| Epic 3: Document & Form Data Input | 9 | FR9-FR12, FR15-FR21, FR41 |
| Epic 4: QuickBooks Integration | 5 | FR7, FR8, FR14, FR50, FR51 |
| Epic 5: CFO Intelligence Engine | 10 | FR22-FR29, FR46, FR47 |
| Epic 6: Reports & System Management | 9 | FR36-FR40, FR42-FR45 |
| **Total** | **47 Stories** | **51 FRs** |

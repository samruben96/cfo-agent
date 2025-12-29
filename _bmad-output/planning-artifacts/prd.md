---
stepsCompleted: [1, 2, 3, 4, 5-skipped, 6-skipped, 7, 8, 9, 10, 11]
status: complete
completedAt: 2025-12-29
inputDocuments:
  - path: "_bmad-output/planning-artifacts/product-brief-bfi-cfo-bot-2025-12-29.md"
    type: "product-brief"
workflowType: 'prd'
lastStep: 2
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
projectType: greenfield
date: 2025-12-29
---

# Product Requirements Document - bfi-cfo-bot

**Author:** Sam
**Date:** 2025-12-29

## Executive Summary

bfi-cfo-bot is a conversational CFO assistant built for independent insurance agencies in the $1-5M revenue range. It transforms complex financial data into instant, actionable insights through a natural language chat interface.

Agency owners and office managers can ask questions in plain English—"What does each employee cost me?", "Can I afford to hire?"—and receive immediate answers or formatted reports. The system ingests data through QuickBooks, CSV uploads, manual intake forms, conversational input, and optional AgencyZoom integration (BYOK), delivering CFO-grade intelligence without requiring a financial background.

The product targets a clear gap: small agency owners currently rely on spreadsheets and quarterly accountant conversations, leaving them without answers when critical business decisions need to be made.

### What Makes This Special

1. **Conversational + Reports**: Ask questions naturally and receive instant answers OR formatted reports through the same chat interface
2. **Insurance Agency Focus**: Purpose-built for the metrics, workflows, and integrations (AgencyZoom) that matter to independent agencies
3. **Minimal Friction Onboarding**: Start with 5-8 questions and get value immediately—no complex setup required
4. **Multiple Data Paths**: QuickBooks, CSV, manual forms, or chat-based input—users choose what works for them
5. **AgencyZoom BYOK Integration**: Connect to agency management data users already maintain
6. **Tiered Depth**: Users control how much data they share—more data = deeper insights

## Project Classification

**Technical Type:** SaaS B2B / Web App (Chatbot Interface)
**Domain:** Financial Intelligence (InsureTech-adjacent)
**Complexity:** Medium
**Project Context:** Greenfield - new project

This is a financial intelligence tool verticalized for the insurance agency market. While it serves agencies, the core functionality is CFO-grade financial analysis delivered through a conversational interface—not insurance operations (claims, underwriting, etc.).

## Success Criteria

### User Success

- User gets answers to financial questions they couldn't easily answer before
- User makes hiring, spending, or operational decisions with data-backed confidence
- User saves time compared to manual spreadsheet analysis or waiting for accountant
- User can upload documents and retrieve generated reports when needed

**Activation Milestones:**
1. Account created
2. Onboarding completed (5-8 questions)
3. First question asked
4. First data source connected (QBO, CSV, AgencyZoom, or document upload)
5. First report generated
6. Return visit within 7 days
7. 3+ sessions in first month

### Business Success

**Adoption Metrics:**
- Number of accounts created
- Onboarding completion rate
- Data source connection rate

**Engagement Metrics:**
- Weekly active users
- Questions/reports per user per week
- Document uploads per user

**Retention Metrics:**
- 7-day return rate
- 30-day retention
- Users with multiple data sources connected

### Technical Success

- **Response Time:** Chat responses delivered quickly (sub-3 second for simple queries)
- **Document Processing:** Uploaded documents processed and available for querying promptly
- **Reliability:** System available when users need it (standard SaaS uptime expectations)
- **Data Integrity:** Financial calculations are accurate and consistent

### Measurable Outcomes

Success will be validated when:
- Users complete onboarding and connect at least one data source
- Users ask CFO questions and receive accurate, actionable answers or reports
- Users return for repeat sessions unprompted
- Users upload documents and retrieve stored reports

## Product Scope

### MVP - Minimum Viable Product

**Core Features:**
1. **User Management** - Account creation, authentication, agency profile
2. **Onboarding Flow** - 5-8 question intake for basic setup
3. **Data Input Methods:**
   - QuickBooks Online connection (P&L, payroll)
   - CSV upload
   - Manual intake forms (overhead, SaaS, headcount)
   - Chat-based data input
   - Document upload (P&L PDFs, payroll reports, etc.)
4. **AgencyZoom Integration (BYOK)** - User provides API key
5. **Chat Interface** - Natural language Q&A + formatted report delivery
6. **Document Storage** - Store uploaded documents and generated reports
7. **Core CFO Metrics:**
   - Fully loaded employee cost
   - Basic EBITDA calculation
   - Profitability per employee/role
   - Hiring affordability analysis
   - Payroll ratio insights

**Out of Scope for MVP:**
- Proactive alerts/notifications
- Advanced scenario modeling
- Multi-user/team access
- White-label features
- Mobile app
- Historical trend analysis
- Plaid/bank integration

### Growth Features (Post-MVP)

- Proactive alerts (payroll creep, spending anomalies, cash warnings)
- Historical trend analysis and forecasting
- Scenario modeling ("What if I hire 2 producers?")
- Multi-user access for larger agencies
- Deeper AgencyZoom insights (producer profitability, book analysis)

### Vision (Future)

- Mobile-friendly or native app experience
- White-label capabilities for consultants/coaches
- Expanded integrations beyond AgencyZoom
- Industry benchmarking against similar agencies
- AI-powered recommendations and forecasting

## User Journeys

### Journey 1: Mike Santos - Finally Getting Answers

Mike owns a $2.5M independent insurance agency with 8 employees. He's great at sales—landed three new commercial accounts last month—but when his office manager asks "can we afford to hire another CSR?", he freezes. He glances at QuickBooks, sees numbers he doesn't fully understand, and says "let me think about it." That night, he's up wondering if he's leaving money on the table or heading toward a cash crunch.

A colleague at an agency mastermind mentions a "CFO chatbot" they've been using. Mike is skeptical—he's tried financial dashboards before and never opened them after the first week. But this is different: it's just a chat. He signs up, answers 8 quick questions about his agency (employees, rent, software costs), and uploads last month's P&L as a PDF.

The next morning, coffee in hand, Mike types: "What does each employee actually cost me?" The bot responds in seconds with a breakdown he's never seen before—not just salaries, but taxes, benefits, his share of rent and software, everything loaded in. His "cheapest" employee actually costs 40% more than he thought.

Emboldened, he asks: "Can I afford to hire a CSR at $45K?" The bot walks through the math: fully loaded cost, impact on his margins, how many policies the new hire would need to service to break even. For the first time, Mike has a real answer. He screenshots the response and texts his office manager: "Yes. Let's post the job."

Two months later, Mike checks in with the bot weekly—usually Sunday nights before the week starts. He's connected QuickBooks for real-time data and even linked his AgencyZoom to see producer-level profitability. When his accountant asks how he's suddenly so sharp on his numbers, Mike just smiles.

**Journey reveals requirements for:**
- Quick onboarding (8 questions, immediate value)
- Document upload and processing (P&L PDFs)
- Natural language Q&A with instant responses
- Fully loaded employee cost calculations
- Hiring affordability analysis
- Report generation (screenshot-able answers)
- QuickBooks integration
- AgencyZoom BYOK integration

---

### Journey 2: Sarah Chen - Looking Like a CFO

Sarah has been the office manager at Midwest Insurance Partners for six years. The owner, Dave, trusts her with everything operational—but lately he's been asking harder questions. "What's our payroll as a percentage of revenue?" "Are we spending too much on software?" Sarah pulls numbers from QuickBooks and cobbles together spreadsheets, but she's never confident in her answers. She feels like she's guessing.

Dave forwards her a link to the CFO bot with a note: "Can you set this up for us?" Sarah sighs—another tool to learn. But the onboarding is surprisingly painless. She connects their QuickBooks account directly, answers a few questions about overhead, and uploads their employee roster as a CSV.

The first thing she asks: "What's our payroll ratio?" The answer comes back instantly: 52% of revenue. The bot adds context: "Industry benchmark for agencies your size is 45-50%. You're slightly above—want me to break down by role?" Sarah's eyes widen. She's never had this kind of analysis at her fingertips.

She spends the next hour exploring. "Show me our software costs." "What does our top producer actually cost us?" "Generate a report on employee profitability." Each question gets a clear answer—or a formatted report she can save and share.

The next week, Dave asks about hiring. Instead of scrambling, Sarah pulls up the saved report and walks him through the numbers like she's been doing this for years. "Based on our current margins, we can afford one CSR at $42K, but if we want a producer, we'd need to hit these revenue targets first." Dave is impressed. Sarah feels like she finally has the tools to do her job properly.

**Journey reveals requirements for:**
- QuickBooks direct connection
- CSV upload for employee data
- Payroll ratio calculations with benchmarks
- Software cost analysis
- Per-employee and per-role profitability
- Report generation and storage
- Saved reports for later retrieval
- Clear, confident answers with context

---

### Journey 3: Mike (Edge Case) - Uploading Messy Data

Mike's been using the bot for a month and loves it. But his bookkeeper just sent over a "P&L" that's actually three documents merged into one PDF with inconsistent formatting. He uploads it anyway.

The bot responds: "I found some issues with this document. It looks like multiple reports combined. I was able to extract revenue ($2.3M) and total payroll ($1.1M), but some expense categories are unclear. Want me to show you what I found and ask about the unclear items?"

Mike clicks yes. The bot walks him through five questions: "Is 'Tech Services' the same as 'Software Subscriptions'?" "This $15K expense has no category—what is it?" After two minutes, the data is cleaned up and usable.

Mike thinks: "That was easier than explaining it to my accountant."

**Journey reveals requirements for:**
- Document parsing with error handling
- Graceful handling of messy/merged documents
- Interactive data clarification flow
- User-assisted categorization
- Partial data extraction (don't fail completely)

---

### Journey Requirements Summary

| Capability Area | Revealed By |
|-----------------|-------------|
| Onboarding (quick, 8 questions) | Mike, Sarah |
| Document upload + processing | Mike, Sarah, Edge Case |
| Natural language chat Q&A | Mike, Sarah |
| Report generation + storage | Mike, Sarah |
| QuickBooks integration | Mike, Sarah |
| CSV upload | Sarah |
| AgencyZoom BYOK | Mike |
| Employee cost calculations | Mike, Sarah |
| Hiring affordability analysis | Mike |
| Payroll ratio + benchmarks | Sarah |
| Per-role profitability | Sarah |
| Error handling for messy data | Edge Case |
| Interactive data clarification | Edge Case |

## SaaS B2B Specific Requirements

### Multi-Tenancy Architecture

- **Tenant Isolation:** Each agency's data is completely isolated from other agencies
- **No Cross-Tenant Sharing:** Agencies cannot see or share data with other agencies
- **Data Boundary:** All queries scoped to tenant ID at database level

### User & Permission Model

**MVP:**
- Single user per account (individual agency owner or office manager)
- One login = one agency's data

**Future Consideration:**
- Team accounts with multiple users per agency
- Role-based access (Owner, Manager, Read-only) - post-MVP

### Integration Architecture

| Integration | Method | Priority |
|-------------|--------|----------|
| QuickBooks Online | OAuth 2.0 | MVP |
| AgencyZoom | API Key (BYOK) | MVP |
| CSV Upload | Direct file upload | MVP |
| Document Upload | Direct file upload + processing | MVP |

**Integration Principles:**
- User-initiated connections (no automatic data access)
- Clear permission scopes communicated to user
- Graceful handling of disconnected/expired integrations

### Data & Infrastructure

**Primary Stack:**
- **Database/Backend:** Supabase (PostgreSQL + Auth + Storage)
- **File Storage:** Supabase Storage for documents and generated reports
- **Authentication:** Supabase Auth

**Data Considerations:**
- Standard encryption at rest and in transit
- Secure document storage with access controls
- No special data residency requirements for MVP

### Technical Constraints

- **Response Time:** Sub-3 second for chat queries
- **Document Processing:** Async processing acceptable for large files
- **Scalability:** Design for growth but optimize for MVP simplicity
- **Browser Support:** Modern browsers (Chrome, Safari, Firefox, Edge)

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Approach:** Problem-Solving MVP
- Solve the core problem (CFO insights) with minimal features
- Validate that users ask questions and find answers valuable
- Prove data accuracy before adding more integrations

**Team:** Solo developer with AI-assisted development (BMAD)

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Mike (agency owner) - getting answers to financial questions
- Sarah (office manager) - running reports and looking competent

**Must-Have Capabilities:**

| Feature | Rationale |
|---------|-----------|
| User auth + onboarding | Entry point to product |
| Chat interface (Q&A + reports) | Core value delivery |
| QuickBooks Online integration | Primary data source for most agencies |
| CSV upload | Fallback for non-QBO users |
| Document upload + processing | Critical for getting accurate P&L data |
| Manual intake forms | Overhead, SaaS, headcount inputs |
| Document/report storage | Users need to retrieve past reports |
| Core CFO calculations | Employee cost, EBITDA, payroll ratio, hiring analysis |

**Explicitly Deferred from MVP:**
- AgencyZoom integration (moved to Phase 2)
- Proactive alerts/notifications
- Multi-user/team accounts
- Historical trend analysis
- Scenario modeling

### Post-MVP Features

**Phase 2 (Growth):**
- AgencyZoom BYOK integration
- Team accounts with multiple users
- Proactive alerts (payroll creep, spending anomalies)
- Basic historical trends

**Phase 3 (Expansion):**
- Advanced scenario modeling
- Producer-level profitability (deeper AgencyZoom)
- Industry benchmarking
- White-label capabilities
- Mobile experience

### Risk Mitigation Strategy

**Critical Risk: Data Accuracy**
- If CFO calculations are wrong, product is worthless
- Mitigation: Extensive testing of calculation logic, clear data validation, user-assisted clarification for ambiguous inputs
- Validation: Have real agency owners verify calculations against their known data

**Technical Risk: Document Processing**
- P&L PDFs vary wildly in format
- Mitigation: Start with common formats, graceful error handling, user-assisted extraction
- Fallback: Users can always input data manually or via CSV

**Market Risk: Will users actually use it?**
- Agencies might sign up but not form the habit
- Mitigation: Focus on "aha moment" in first session, weekly check-in value
- Validation: Track first-week engagement closely

**Resource Risk: Solo Dev Capacity**
- Building with BMAD, but still limited bandwidth
- Mitigation: Ruthless MVP scope, defer AgencyZoom, focus on core value
- Contingency: Further scope cuts if needed (e.g., start with Q&A only, add reports later)

## Functional Requirements

### User Management & Onboarding

- FR1: Users can create an account with email and password
- FR2: Users can log in and log out securely
- FR3: Users can reset their password via email
- FR4: Users can complete an onboarding questionnaire (5-8 questions about their agency)
- FR5: Users can update their agency profile information after onboarding
- FR6: System isolates each user's data from other users (tenant isolation)

### Data Ingestion

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

### Document Processing & Data Clarification

- FR17: System identifies unclear or ambiguous data in uploaded documents
- FR18: System prompts users to clarify ambiguous data through interactive questions
- FR19: Users can categorize or re-categorize extracted expense items
- FR20: System handles partial data extraction gracefully when documents are incomplete
- FR21: System notifies users of document processing status and any issues found

### CFO Intelligence & Calculations

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

### Chat Interface & Q&A

- FR30: Users can ask financial questions in natural language
- FR31: System responds to questions with clear, contextual answers
- FR32: System provides answers within acceptable response time
- FR33: Users can ask follow-up questions in conversation context
- FR34: System suggests relevant follow-up questions or insights
- FR35: Users can request specific calculations through chat (e.g., "What if I hire at $50K?")
- FR48: Users can view their previous chat conversations (session history)
- FR49: Users can continue or reference previous conversations

### Report Generation & Storage

- FR36: Users can request formatted reports through the chat interface
- FR37: System generates formatted financial reports (employee cost breakdown, payroll analysis, etc.)
- FR38: Users can save generated reports for later access
- FR39: Users can view previously saved reports
- FR40: Users can download or share generated reports
- FR41: System stores uploaded documents for reference

### System & Data Management

- FR42: Users can view what data sources are connected
- FR43: Users can view the status of their data (last sync, completeness)
- FR44: Users can delete their account and associated data
- FR45: System maintains audit trail of data changes and calculations

## Non-Functional Requirements

### Performance

- NFR1: Chat responses return within 3 seconds for simple queries
- NFR2: Complex calculations (multi-employee analysis) complete within 5 seconds
- NFR3: Document upload provides immediate acknowledgment with processing status
- NFR4: PDF/CSV document processing completes within 30 seconds for typical files (<10 pages/1000 rows)
- NFR5: QuickBooks data sync completes within 10 seconds for typical account size
- NFR6: UI remains responsive during background processing operations

### Security

- NFR7: All data encrypted at rest (database, file storage)
- NFR8: All data encrypted in transit (HTTPS/TLS)
- NFR9: User authentication via secure methods (Supabase Auth)
- NFR10: QuickBooks OAuth tokens stored securely and refreshed appropriately
- NFR11: Tenant data isolation enforced at database level (no cross-tenant data access)
- NFR12: Session management with appropriate timeouts
- NFR13: Secure file upload handling (type validation, size limits, malware considerations)

### Reliability & Data Integrity

- NFR14: System availability of 99% during business hours (reasonable SaaS standard)
- NFR15: Financial calculations are accurate and consistent (critical requirement)
- NFR16: Data changes logged for audit trail (FR45 support)
- NFR17: Graceful error handling - no silent data loss
- NFR18: Failed operations provide clear error messages to users
- NFR19: Document processing failures don't corrupt existing data

### Integration

- NFR20: QuickBooks OAuth integration follows Intuit best practices
- NFR21: Integration failures handled gracefully with user notification
- NFR22: System continues to function when integrations are unavailable (degraded mode)
- NFR23: Clear feedback when connected services require re-authentication

### Scalability (Design for Growth)

- NFR24: Architecture supports horizontal scaling without major refactoring
- NFR25: Database schema supports efficient queries as data grows
- NFR26: File storage approach scales with document volume
- NFR27: No hard-coded limits that would block reasonable growth

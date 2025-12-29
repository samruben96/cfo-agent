---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
completedAt: 2025-12-29
inputDocuments:
  - type: "client-requirements"
    name: "CFO Bot Data Blueprint & Onboarding Model"
    source: "user-provided"
    notes: "Good/Better/Best onboarding model, metric calculations, data sources"
refinements:
  - "No Plaid integration (not feasible)"
  - "Optional AgencyZoom integration"
  - "Target: Independent insurance agencies"
  - "Product form: Chatbot acting as CFO"
date: 2025-12-29
author: Sam
---

# Product Brief: bfi-cfo-bot

## Executive Summary

bfi-cfo-bot is a conversational CFO assistant built specifically for independent insurance agencies in the $1-5M revenue range. It transforms complex financial data into actionable insights through a simple chat interface, giving agency owners CFO-grade intelligence without requiring a financial background.

The product uses a tiered onboarding model (Good/Better/Best) that allows agencies to start with minimal friction while enabling deeper insights as they connect more data sources. Optional AgencyZoom integration leverages the agency management data many users already maintain.

---

## Core Vision

### Problem Statement

Independent insurance agency owners lack accessible, real-time financial intelligence. They rely on spreadsheets they struggle to maintain and accountants they speak to quarterly—leaving them without answers to critical questions about employee costs, hiring capacity, and spending trends when decisions need to be made.

### Problem Impact

Without CFO-level visibility, agency owners:
- Make hiring decisions without understanding true fully-loaded employee costs
- Miss spending leaks in software, overhead, and operational expenses
- Lack clarity on profitability per producer or role
- React to cash flow issues instead of anticipating them

### Why Existing Solutions Fall Short

- **Spreadsheets**: Require manual updates, financial expertise, and time agency owners don't have
- **Accountants**: Provide retrospective analysis quarterly, not real-time decision support
- **Generic dashboards**: Don't speak the language of insurance agencies or integrate with tools like AgencyZoom
- **Enterprise CFO tools**: Too complex and expensive for the $1-5M agency market

### Proposed Solution

An interactive chatbot that acts as a virtual CFO—answering financial questions in plain English, surfacing alerts about margin risks and spending trends, and providing actionable guidance on hiring, costs, and profitability.

The system ingests data through:
- QuickBooks or CSV uploads (P&L, payroll)
- Short intake forms (headcount, overhead, SaaS costs)
- Optional AgencyZoom integration (agency-specific business data)

### Key Differentiators

1. **Conversational interface**: Ask questions naturally, get answers instantly—no reports to interpret
2. **Insurance agency focus**: Built for the workflows and metrics that matter to agencies
3. **Minimal friction onboarding**: Start with 5-8 questions, get value immediately, deepen over time
4. **AgencyZoom integration**: Connects to data agencies already maintain
5. **Tiered depth model**: Good/Better/Best allows users to choose their level of engagement

---

## Target Users

### Primary Users

**1. The Agency Owner - "Mike"**

Mike owns a $2.5M independent insurance agency with 8 employees. He's great at sales and client relationships but financial management feels like a chore. He glances at QuickBooks occasionally, talks to his accountant quarterly, and mostly flies by gut feel on hiring and spending decisions.

- **Goals**: Understand if he can afford another producer, know where money is leaking, feel confident about the business's financial health
- **Frustrations**: Spreadsheets are tedious, accountant feedback comes too late, doesn't know what questions to ask
- **Tech comfort**: Uses AgencyZoom daily, comfortable with chat interfaces, avoids anything that feels like "accounting software"
- **Success looks like**: Asking "Can I afford to hire a CSR?" and getting a clear, confident answer in 30 seconds

**2. The Office Manager - "Sarah"**

Sarah handles the day-to-day operations at a $3M agency. The owner trusts her with financial oversight but she's not a CFO. She pulls reports, tracks expenses, and flags issues—but lacks tools to do deeper analysis.

- **Goals**: Give the owner accurate financial updates, catch problems before they escalate, look competent when asked tough questions
- **Frustrations**: Data is scattered across systems, she can pull numbers but not insights, feels like she's guessing
- **Tech comfort**: Power user of AgencyZoom and QuickBooks, quick to adopt tools that make her look good
- **Success looks like**: Proactively telling the owner "Our payroll ratio is creeping up—here's what's driving it"

### Secondary Users

**Bookkeeper/Accountant (External)**
- May be asked to upload data or validate outputs
- Could champion the tool if it reduces their client's finance questions
- Needs clean data export for their own workflows

**Business Coach/Consultant**
- May recommend the tool to agency owner clients
- Could use outputs during strategy sessions
- Values standardized metrics across multiple agencies they advise

### User Journey

| Stage | Experience |
|-------|------------|
| **Discovery** | Hears about it from a peer agency owner, business coach, or AgencyZoom community |
| **Onboarding** | Answers 5-8 quick questions, optionally connects QBO or uploads CSV |
| **First Value** | Asks "What does each employee cost me?" and gets an instant breakdown |
| **Aha Moment** | Realizes they've been underestimating true employee costs by 30%+ |
| **Ongoing Use** | Checks in weekly or when making decisions (hiring, major purchases, renewals) |
| **Expansion** | Connects more data sources for deeper insights (Better → Best tier) |

---

## Success Metrics

### User Success Metrics

**Value Delivery**
- User gets an answer to a financial question they couldn't easily answer before
- User makes a decision (hiring, spending, etc.) with data-backed confidence
- User saves time vs. manual spreadsheet analysis or waiting for accountant

**Engagement Signals**
- User completes onboarding (5-8 questions answered)
- User asks their first real question
- User connects at least one data source (QBO, CSV, or AgencyZoom)
- User returns for a second session
- User develops a regular check-in habit (daily or weekly)

**Activation Milestones**
1. Account created
2. Onboarding completed
3. First question asked
4. First data source connected
5. Return visit within 7 days
6. 3+ sessions in first month

### Business Objectives

**Adoption**
- Number of accounts created
- Onboarding completion rate
- Data source connection rate (QBO, CSV, AgencyZoom)

**Engagement**
- Weekly active users
- Questions asked per user per week
- Retention: % of users active after 30/60/90 days

**Product-Market Fit Signals**
- Users who connect multiple data sources
- Users who return unprompted (not via reminder emails)
- Organic referrals from existing users

### Key Performance Indicators

| KPI | What It Measures | Why It Matters |
|-----|------------------|----------------|
| **Onboarding Completion Rate** | % who finish initial setup | First hurdle to value |
| **Data Connection Rate** | % who connect QBO/CSV/AgencyZoom | Depth of engagement |
| **Weekly Active Users** | Users with 1+ sessions/week | Habit formation |
| **Questions per Session** | Avg queries per visit | Value extraction |
| **7-Day Return Rate** | % who come back within a week | Early retention signal |
| **30-Day Retention** | % still active after 1 month | Product stickiness |

---

## MVP Scope

### Core Features

**1. User Management**
- Account creation and authentication
- User profile with agency information

**2. Onboarding Flow**
- 5-8 question intake (employees, overhead, basic agency info)
- Guided setup experience

**3. Data Input Methods**
- **QuickBooks Online connection** - P&L, payroll data
- **CSV upload** - For users without QBO or prefer manual import
- **Manual intake form** - Overhead, SaaS costs, headcount details
- **Chat-based input** - Provide/update data conversationally

**4. AgencyZoom Integration (BYOK)**
- User provides their own API key
- Pull agency-specific data (commissions, producers, policies)
- Optional but available from day one

**5. Chat Interface**
- Natural language Q&A with the CFO bot
- Ask financial questions, get instant answers
- Conversational data collection and updates

**6. Core CFO Metrics & Calculations**
- Fully loaded employee cost (salary + taxes + benefits + overhead)
- Basic EBITDA calculation
- Profitability per employee/role
- Hiring affordability analysis
- Payroll ratio insights

**7. Key Questions the Bot Can Answer**
- "What does each employee actually cost me?"
- "Can I afford to hire another CSR/producer?"
- "What's my payroll as a percentage of revenue?"
- "Where is my money going?"
- "What's my EBITDA?"

### Out of Scope for MVP

- **Proactive alerts** - No push notifications or automated warnings (Q&A only)
- **Advanced scenario modeling** - Complex what-if analysis deferred
- **Multi-user/team access** - Single user per account initially
- **White-label/reseller features** - Focus on core product first
- **Mobile app** - Web-based chat interface only
- **Historical trend analysis** - Focus on current state, not time-series
- **Plaid/bank integration** - Explicitly excluded per earlier decision

### MVP Success Criteria

- Users complete onboarding and connect at least one data source
- Users can ask core CFO questions and get accurate, helpful answers
- Users return for repeat sessions (7-day return rate)
- At least one "aha moment" per user (discovering insight they didn't have before)
- AgencyZoom BYOK integration works for users who opt in

### Future Vision

**Post-MVP Enhancements:**
- Proactive alerts (payroll creep, spending anomalies, cash squeeze warnings)
- Historical trend analysis and forecasting
- Scenario modeling ("What if I hire 2 producers?")
- Multi-user access for larger agencies
- Deeper AgencyZoom insights (producer profitability, book analysis)
- Mobile-friendly or native app experience
- White-label capabilities for consultants/coaches

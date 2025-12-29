---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
status: complete
completedDate: 2025-12-29
inputDocuments:
  - path: "_bmad-output/planning-artifacts/product-brief-bfi-cfo-bot-2025-12-29.md"
    type: "product-brief"
  - path: "_bmad-output/planning-artifacts/prd.md"
    type: "prd"
date: 2025-12-29
author: Sam
---

# UX Design Specification: bfi-cfo-bot

**Author:** Sam
**Date:** 2025-12-29

---

## Executive Summary

### Project Vision

bfi-cfo-bot transforms financial complexity into conversational clarity for independent insurance agency owners. Through a natural language chat interface, agency owners and office managers can ask CFO-grade questions—"What does each employee cost me?", "Can I afford to hire?"—and receive instant, actionable answers without financial expertise.

The product serves agencies in the $1-5M revenue range who currently rely on spreadsheets they struggle to maintain and accountants they speak to quarterly. By ingesting data through QuickBooks, CSV uploads, document processing, and simple intake questions, the bot delivers real-time financial intelligence when decisions need to be made.

### Target Users

**Primary: Agency Owner (Mike)**
- Owns $2.5M agency with 8 employees
- Expert at sales and relationships, uncomfortable with financial analysis
- Uses AgencyZoom daily, comfortable with chat interfaces
- Success: Asking "Can I afford to hire a CSR?" and getting a confident answer in 30 seconds

**Primary: Office Manager (Sarah)**
- Handles day-to-day operations, trusted with financial oversight
- Can pull reports but struggles to extract actionable insights
- Power user of AgencyZoom and QuickBooks
- Success: Proactively telling the owner "Our payroll ratio is creeping up—here's why"

**Device Context:** Primarily desktop/laptop during work hours. Chat interface should feel native to users comfortable with modern messaging apps.

### Key Design Challenges

1. **Building Trust in AI Financial Advice** — Users are making real business decisions (hiring, spending) based on bot responses. The UX must convey accuracy and transparency without overwhelming users with calculations they don't want to see.

2. **Graceful Handling of Messy Data** — P&L PDFs vary wildly. CSVs are inconsistent. Manual inputs are incomplete. The experience must clarify and clean data conversationally without feeling like an interrogation.

3. **Onboarding That Delivers Immediate Value** — The 5-8 question intake must feel worthwhile at every step. Users need to reach their first "aha moment" (e.g., discovering true employee costs) within their first session.

4. **Managing Chat Expectations** — Users expect ChatGPT-like instant responses, but CFO calculations require data. The UX must elegantly bridge the gap between "ask anything" and "I need information from you first."

5. **First Session Success** — If users don't get a valuable insight in session one, they won't return. The design must prioritize early wins over comprehensive setup.

### Design Opportunities

1. **Conversational Data Collection** — Transform required inputs into natural dialogue. Instead of forms, gather data through helpful questions within the chat flow.

2. **Shareable, Screenshot-able Insights** — Design answers as visual artifacts worth sharing—clear breakdowns, quotable summaries, formatted reports that look good in a text message.

3. **Progressive Depth Model** — Mirror the Good/Better/Best data tier in UX: valuable insights from minimal data, with clear paths to deeper analysis as users connect more sources.

4. **Proactive Intelligence Seeds** — Even in Q&A-only MVP, include contextual observations ("Your payroll ratio is above industry average") that hint at the CFO-grade intelligence the system provides.

## Core User Experience

### Defining Experience

The core experience of bfi-cfo-bot is a **conversation**. Users type financial questions in plain English and receive immediate, actionable answers. There are no dashboards to interpret, no reports to generate manually, no learning curve. The chat input is the entire product surface.

**Core Interaction Loop:**
1. User asks a question ("What does each employee cost me?")
2. System responds with a clear, contextual answer (not raw data)
3. User can drill deeper ("Show me the breakdown") or ask something new
4. Repeat

This loop must feel as natural as texting a knowledgeable friend who happens to be a CFO.

### Platform Strategy

**Primary Platform:** Web application (responsive desktop-first)
- Optimized for desktop/laptop use during business hours
- Mouse and keyboard as primary input methods
- Modern browser support (Chrome, Safari, Firefox, Edge)

**Platform Decisions:**
- No native mobile app for MVP (web-responsive is sufficient)
- No offline functionality required (always connected to data sources)
- No touch-specific optimizations needed initially

**Rationale:** Agency owners and office managers work at desks. The chat interface translates well to web without platform-specific features.

### Effortless Interactions

**Must Be Effortless:**

1. **Asking a question** — No syntax to learn, no buttons to find. Type naturally, hit enter.

2. **Understanding the answer** — Plain English, not accounting jargon. Numbers in context, not isolation.

3. **Getting more detail** — "Show me the breakdown" or "How did you calculate that?" always works.

4. **Providing data** — When the system needs information, it asks conversationally. No forms to hunt for.

5. **Returning after time away** — Pick up where you left off. The bot remembers context.

**Friction We're Eliminating:**
- Learning dashboard navigation (competitors)
- Interpreting financial reports (spreadsheets)
- Waiting for scheduled calls (accountants)
- Translating data into decisions (everywhere)

### Critical Success Moments

**Make-or-Break Moments:**

| Moment | Success Looks Like | Failure Looks Like |
|--------|-------------------|-------------------|
| **First Question** | Clear, useful answer in <5 seconds | "I need more data to answer that" |
| **First Insight** | "I didn't know that!" reaction | Answer they could have found themselves |
| **Data Upload** | "That was easy" with immediate value | Errors, confusion, or silence |
| **Hiring Decision** | Confident "yes" or "no" with reasoning | Vague "it depends" without guidance |
| **Return Visit** | Remembers context, ready to help | Feels like starting over |

**The "Aha Moment":** When Mike discovers his employees cost 40% more than he thought—that's the moment he becomes a user for life. Design everything to accelerate arrival at this moment.

### Experience Principles

**1. Conversation First**
The chat input is the product. Every feature, insight, and action flows through natural language. No dashboards to navigate, no menus to learn.

**2. Answers, Not Data**
Users want decisions, not numbers. Transform financial data into actionable guidance. "Yes, you can afford to hire" beats "Your margin is 12.3%."

**3. Trust Through Transparency**
Show the math only when asked, but always make it available. Users trust what they could verify. Include "How did you calculate this?" as an ever-present option.

**4. First Win in Five Minutes**
The first session must deliver an insight the user didn't have before. Optimize for time-to-value over setup completeness. Partial data → partial insights → full value as data grows.

**5. Graceful Incompleteness**
Missing data is normal, not an error. Never block the user. Work with available information, ask for more conversationally, and improve answers as data improves.

## Desired Emotional Response

### Primary Emotional Goals

**Core Transformation:** From financial anxiety to financial confidence

Users should feel like they've gained CFO-level superpowers without needing to become financial experts. The product transforms the emotional experience of financial decision-making from stressful guesswork to calm clarity.

**Primary Emotions:**
- **Confident** — "I know the answer and I trust it"
- **Smart** — "I just made a CFO-level decision without being a CFO"
- **Calm** — Financial clarity replaces financial anxiety
- **In Control** — "I have visibility I never had before"

**Emotions to Avoid:**
- Feeling dumb or inadequate
- Overwhelmed by financial jargon or data
- Skeptical about accuracy
- Frustrated by complexity or slowness

### Emotional Journey Mapping

| Stage | Desired Feeling | Design Implication |
|-------|-----------------|-------------------|
| **First Visit** | Curious, hopeful | Warm welcome, immediate hint of value |
| **Onboarding** | "This is easy" | Fast progress, relevant questions |
| **First Question** | Anticipation → Surprise | Quick response, unexpected insight |
| **First Insight** | "Wow, I didn't know that" | The aha moment, screenshot-worthy |
| **Data Upload** | Capable, supported | Clear feedback, graceful errors |
| **Decision Moment** | Confident, decisive | Clear guidance with reasoning |
| **Return Visit** | Welcomed back | Context remembered, ready to help |
| **Error State** | Supported, not blamed | Friendly recovery, clear next steps |

### Micro-Emotions

**Confidence over Confusion**
Every answer should feel understandable without financial expertise. Plain language, contextual explanations, no unexplained jargon.

**Trust over Skepticism**
Users are making real decisions based on bot responses. Build trust through transparency—always allow users to see the underlying calculation if they want.

**Empowered over Overwhelmed**
Present one clear answer, with the option to go deeper. Never dump all the data at once. Progressive disclosure of complexity.

**Smart over Inadequate**
The tone should make users feel like they're having a conversation with a helpful expert, not exposing their ignorance to a judgmental system.

**Efficient over Frustrated**
Speed matters. Every interaction should feel snappy. If something takes time, communicate progress. Never leave users wondering "is it working?"

### Design Implications

**To Create Confidence:**
- Provide direct answers, not hedged responses
- Include "here's why" reasoning without being asked
- Use language like "Yes, you can afford..." not "Based on our analysis..."

**To Build Trust:**
- "How did you calculate this?" always available
- Show data sources being used
- Acknowledge when data is incomplete rather than hiding it

**To Prevent Overwhelm:**
- Lead with the answer, details on request
- One insight at a time, with "want to know more?" pathways
- Clean, focused visual design—no dashboard clutter

**To Make Users Feel Smart:**
- Conversational, peer-to-peer tone (not teacher-to-student)
- Celebrate insights: "Good question—here's something interesting..."
- Never require financial vocabulary to ask questions

### Emotional Design Principles

**1. Clarity Creates Confidence**
Every interaction should leave users feeling more certain, not less. Ambiguity is the enemy.

**2. Speed Signals Competence**
Fast responses feel trustworthy. Slow responses create doubt. Optimize for perceived speed.

**3. Transparency Builds Trust**
Users trust what they can verify. Always make the math accessible (but not mandatory).

**4. Warmth Without Condescension**
Friendly and approachable, but never dumbed-down or patronizing. Users are smart—they just don't have CFO training.

**5. Celebrate the Win**
When users get an insight or make a decision, acknowledge it. Small moments of delight reinforce the value.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**Primary Inspiration: ChatGPT / AI Chat Interfaces**

The target experience should feel immediately familiar to anyone who has used ChatGPT or similar AI chat applications. This pattern has trained users to expect:

- **Single input, infinite possibilities** — Type anything, get a helpful response
- **Conversation memory** — Context carries forward naturally
- **Instant feedback** — Streaming responses that feel alive
- **Minimal interface chrome** — The conversation IS the product
- **Low barrier to start** — No lengthy setup, just begin
- **Rich formatted responses** — Tables, lists, structured content when appropriate

**Why This Pattern Works for bfi-cfo-bot:**
- Users are already trained on this interaction model
- Conversational interface matches "ask your CFO a question" mental model
- Reduces learning curve to zero
- Focuses attention on the value (answers) not the tool (interface)

### Transferable UX Patterns

**Navigation Patterns:**
- **Chat-first architecture** — The conversation thread is the primary (only) navigation
- **Scroll to explore** — History available by scrolling up, no separate "history" section
- **New conversation = fresh start** — Clear mental model for users

**Interaction Patterns:**
- **Single text input** — One input field, infinite question types
- **Streaming responses** — Text appears progressively, feels fast and alive
- **Follow-up questions** — System can ask for clarification naturally in conversation
- **Quick actions in responses** — "Show breakdown" / "Save as report" buttons inline

**Visual Patterns:**
- **Clean, focused layout** — Generous whitespace, conversation-centered
- **Alternating message bubbles** — Clear user/assistant distinction
- **Rich content blocks** — Tables, charts, formatted numbers within chat flow
- **Subtle branding** — Product identity present but not distracting

### Anti-Patterns to Avoid

**Dashboard-with-Chat-Sidebar**
Many fintech products treat chat as an add-on to a dashboard. For bfi-cfo-bot, the chat IS the product. Avoid relegating it to a sidebar or secondary feature.

**Complex Onboarding Wizards**
ChatGPT lets users just start. While we need some data, gather it conversationally rather than through multi-step wizards that delay first value.

**Form-Heavy Data Collection**
Don't require users to fill out extensive forms before they can ask questions. Ask for data when needed, in context, through the conversation.

**Formal/Robotic Tone**
ChatGPT feels like talking to a smart friend. The CFO bot should feel like a knowledgeable colleague, not enterprise software.

**Loading States Without Feedback**
Never show a static "Loading..." message. Use typing indicators, streaming text, or progress animations that feel alive.

**Feature Overload**
Resist adding buttons, tabs, and options. The magic is in the simplicity. One input, infinite possibilities.

### Design Inspiration Strategy

**Adopt Directly:**
- Single-input chat interface as the entire product surface
- Streaming/typing indicators for perceived speed
- Conversation threading with scroll-back history
- Minimal chrome, maximum conversation focus

**Adapt for bfi-cfo-bot:**
- **Persistent agency context** — Unlike ChatGPT, remember the user's agency, data sources, and previous conversations across sessions
- **Proactive intelligence seeds** — A CFO notices things; occasionally surface observations ("Your payroll ratio increased 3% this month") even when not directly asked
- **Rich formatted response components** — Design employee cost breakdowns, hiring analyses, and reports as structured visual cards within the chat, not just text walls
- **"Save as Report" actions** — Enable shareable artifacts Mike can screenshot or export
- **Data source transparency** — Show "Based on your QuickBooks data..." to build trust

**Explicitly Avoid:**
- Dashboard layouts with chat as secondary feature
- Multi-step wizards before first value
- Form-based data collection (use conversational collection instead)
- Complex navigation or menu structures
- Anything that makes users think "this is accounting software"
- Generic AI personality—this is a CFO with financial expertise, not a general assistant

## Design System Foundation

### Design System Choice

**Selected: Chakra UI**

Chakra UI provides a warm, approachable component library that aligns with the product's emotional goals. Its rounded corners, subtle shadows, and refined defaults feel friendlier than stark minimalist alternatives—important for a product helping users feel confident rather than intimidated.

### Rationale for Selection

1. **Aesthetic Fit** — Warmer, more approachable than flat/generic alternatives. Avoids the cold "developer tool" aesthetic that could undermine user confidence.

2. **Chat Interface Ready** — Flexible primitives (Box, Stack, Input) compose easily into conversational UI patterns. Cards and modals support rich response components.

3. **Solo Developer Friendly** — Well-documented, sensible defaults, minimal configuration. Spend time on features, not fighting the framework.

4. **Theming Flexibility** — Easy to customize colors, typography, and spacing to establish brand identity without building from scratch.

5. **Accessibility Built-In** — Keyboard navigation, focus management, and screen reader support handled automatically—critical for a professional business tool.

6. **AI-Assisted Development** — Chakra's component API is well-known to AI coding assistants, enabling fast iteration with BMAD workflow.

### Implementation Approach

**Setup:**
- Install Chakra UI with Next.js/React integration
- Configure custom theme with brand colors and typography
- Establish component patterns for chat interface elements

**Core Components Needed:**
- Message bubbles (user and assistant variants)
- Chat input with send action
- Rich response cards (cost breakdowns, hiring analysis)
- Loading/streaming indicators
- Data source badges ("Based on QuickBooks...")
- Quick action buttons within responses

### Customization Strategy

**Theme Customization:**
- Define custom color palette (professional but warm)
- Establish typography scale (readable, not corporate)
- Adjust border radii and shadows for desired warmth
- Create semantic color tokens for financial data (positive/negative/neutral)

**Component Strategy:**
- Build reusable chat-specific components on Chakra primitives
- Create response card variants for different insight types
- Design consistent button and action patterns
- Light mode primary, dark mode as future enhancement

## Defining Experience

### The Core Interaction

**Defining Experience:** "Ask a financial question in plain English, get a clear, confident answer in seconds."

This is the interaction that will define bfi-cfo-bot. If we nail this—the feeling of asking a question and receiving an instant, trustworthy, actionable answer—everything else follows. This is what users will describe to colleagues, what creates the "aha moment," and what drives retention.

### User Mental Model

**How Users Currently Solve This:**
- **Spreadsheets:** Tedious, requires expertise, always outdated
- **QuickBooks:** Data exists but can't extract answers from it
- **Accountant calls:** Quarterly, retrospective, not available when decisions need to be made
- **Gut feel:** Unreliable, stressful, leads to anxiety

**Mental Model Users Bring:**
- "I should be able to just ask and get an answer"
- "I don't want to learn accounting to run my business"
- "My accountant knows this stuff—why can't software?"
- Expectation of ChatGPT-like instant intelligence

**Key Insight:** Users don't want to become financially literate. They want financial literacy delivered to them in plain English, on demand.

### Success Criteria

| Criterion | Target | Rationale |
|-----------|--------|-----------|
| **Response Speed** | <3 seconds to first content | Speed builds trust; streaming makes it feel instant |
| **Comprehension** | Understood without financial training | Users are not accountants; answers must be plain English |
| **Trust Level** | User acts on the answer | If they don't trust it, they won't use it |
| **Actionability** | Answer leads to decision | "Yes you can hire" > "Your margin is X%" |
| **Insight Delivery** | User learns something new | The "aha moment" drives retention |

### Pattern Analysis

**Pattern Type:** Established with Targeted Innovation

The core interaction pattern (chat Q&A) is well-established through ChatGPT and similar products. Users already understand:
- Type question → get answer
- Conversation flows naturally
- Follow-up questions work

**Innovation Layer:**
- **Domain expertise:** CFO-grade financial intelligence, not generic AI
- **Data connectivity:** Connected to real business data (QuickBooks, documents)
- **Proactive insights:** Occasionally surfaces observations without being asked
- **Persistent context:** Remembers agency details across sessions
- **Actionable outputs:** Save as report, shareable artifacts

### Experience Mechanics

**1. Initiation**
- Chat interface loads with welcoming empty state
- Cursor auto-focused in input field (ready to type)
- 2-3 example questions visible to reduce blank-page anxiety
- Warm, inviting tone: "What would you like to know about your agency's finances?"

**2. Interaction**
- User types natural language question (no special syntax)
- Enter key or send button submits
- Input clears, user message appears in thread
- Typing indicator shows immediately (no perceived delay)

**3. Feedback**
- Response streams in progressively (word by word or chunk by chunk)
- Key numbers and insights visually emphasized
- Data source attribution: "Based on your QuickBooks data from Dec 2024..."
- Quick action buttons inline: "Show breakdown" / "How did you calculate this?"
- Relevant follow-up suggestions offered

**4. Completion**
- Complete answer visible with clear conclusion
- User can immediately ask follow-up or new question
- "Save as Report" option for important insights
- Conversation persists for reference
- Context maintained for follow-up questions

## Visual Design Foundation

### Color System

**Theme: Professional Warmth**

A palette anchored in trustworthy navy blues with warm gold accents. The combination conveys financial expertise while remaining approachable—not cold or intimidating.

**Primary Colors:**
- **Primary (Deep Navy):** `#1e3a5f` — Headers, primary actions, trust anchors
- **Primary Light (Soft Blue):** `#3d5a80` — Hover states, secondary elements
- **Accent (Warm Gold):** `#d4a574` — CTAs, highlights, success moments
- **Accent Alt (Soft Coral):** `#e07a5f` — Friendly attention-getters

**Neutral Colors:**
- **Background:** `#fafaf9` — Warm off-white, softer than pure white
- **Surface:** `#ffffff` — Cards, chat bubbles, elevated elements
- **Text Primary:** `#2d3748` — Charcoal for readability
- **Text Secondary:** `#718096` — Warm gray for secondary content
- **Border:** `#e2e8f0` — Subtle dividers and input borders

**Semantic Colors:**
- **Success:** `#48bb78` — Positive financial indicators, confirmations
- **Warning:** `#ed8936` — Attention needed, cautionary information
- **Error:** `#e53e3e` — Errors, negative financial indicators
- **Info:** `#4299e1` — Informational content, helpful tips

### Typography System

**Primary Typeface: Inter**

Inter provides excellent readability for both conversational text and financial data. Its clean, modern aesthetic feels professional without being cold, and its numeric characters are optimized for tabular data.

**Type Scale:**

| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| H1 | 28px | 600 | 1.2 | Page titles |
| H2 | 22px | 600 | 1.3 | Section headers |
| H3 | 18px | 600 | 1.4 | Card headers, insight titles |
| Body | 16px | 400 | 1.6 | Chat messages, primary content |
| Body Small | 14px | 400 | 1.5 | Secondary information, labels |
| Caption | 12px | 400 | 1.4 | Timestamps, metadata |

**Financial Numbers:** Displayed at 500 weight with tabular number formatting for alignment in breakdowns and reports.

### Spacing & Layout Foundation

**Base Unit:** 4px

**Spacing Tokens:**
- `xs`: 4px — Icon padding, tight gaps
- `sm`: 8px — Inline spacing, compact elements
- `md`: 16px — Standard component padding
- `lg`: 24px — Section spacing
- `xl`: 32px — Major section breaks
- `2xl`: 48px — Page-level spacing

**Layout Principles:**
- **Centered, focused layout** — Max-width ~800px for optimal chat readability
- **Generous whitespace** — Conversation should breathe; avoid cramped feeling
- **8px grid alignment** — Consistent visual rhythm across all elements
- **Desktop-first, mobile-aware** — Optimized for laptop/desktop with responsive fallbacks

**Chat-Specific Layout:**
- Message bubbles with 16px internal padding
- 12px gap between consecutive messages
- 24px gap between different speakers
- Input area fixed to bottom with comfortable padding

### Accessibility Considerations

**Color Contrast:**
- All text combinations meet WCAG AA standards (4.5:1 minimum for normal text)
- Interactive elements meet 3:1 contrast ratio requirement
- Never rely on color alone to convey meaning (icons, labels as backup)

**Typography Accessibility:**
- Minimum font size: 14px for any readable content
- Line heights optimized for readability (1.5-1.6 for body text)
- Sufficient letter-spacing for legibility

**Interactive Elements:**
- Visible focus states on all interactive elements
- Touch targets minimum 44x44px on mobile
- Clear hover and active states for all buttons and links

**Screen Reader Support:**
- Semantic HTML structure
- ARIA labels for icons and non-text elements
- Live regions for streaming chat responses

## Design Direction

### Design Directions Explored

Three primary layout directions were evaluated for the chat-first interface:

**Direction A: Pure Chat**
- Maximum simplicity, full-width conversation
- No sidebars or secondary panels
- Closest to ChatGPT's minimal approach

**Direction B: Chat + Visible Sidebar**
- Persistent sidebar showing data sources and quick actions
- Always-visible context for power users
- More information density

**Direction C: Chat + Collapsible Panel**
- Clean chat by default, panel available on-demand
- Best of both worlds: simplicity with accessible depth
- Scales well as features are added

### Chosen Direction

**Selected: Direction C — Chat with Collapsible Panel**

This approach maintains the ChatGPT-like simplicity users expect while providing access to power features when needed. The default state is a clean, focused chat interface. Users can toggle a side panel for data sources, saved reports, and quick actions.

### Design Rationale

1. **Simplicity by Default** — Mike (primary user) sees a clean, unintimidating interface focused entirely on the conversation. No visual noise competing for attention.

2. **Power When Needed** — Sarah (power user) can access data source status, saved reports, and quick actions without the interface feeling cluttered for casual use.

3. **Scalable Pattern** — As features are added post-MVP (more data sources, report history, settings), the panel can accommodate without redesigning the core chat experience.

4. **Familiar Interaction** — Collapsible panels are a well-understood pattern. Users intuitively know how to access and dismiss them.

5. **Focus Preservation** — The chat remains the hero. Even with the panel open, the conversation area retains visual primacy.

### Layout Specification

**Header (Fixed Top):**
- Logo/product name (left)
- Icon buttons (right): Panel toggle, settings, user menu
- Height: 56px
- Subtle bottom border

**Chat Area (Primary):**
- Centered container, max-width 800px (full-width when panel open shrinks to ~600px)
- Messages with comfortable padding (16px)
- User messages right-aligned, assistant messages left-aligned
- Rich response cards span full message width

**Input Area (Fixed Bottom):**
- Text input with placeholder "Ask your CFO anything..."
- Send button (icon or text)
- Subtle top border or shadow to separate from chat
- Comfortable padding (16px horizontal, 12px vertical)

**Collapsible Panel (Right Side):**
- Width: 280px when open
- Smooth slide animation (200ms)
- Sections: Data Sources, Saved Reports, Quick Actions
- Close button at top of panel
- Light background to differentiate from chat area

**Responsive Behavior:**
- Panel becomes full-screen overlay on mobile/tablet
- Chat input remains fixed on mobile
- Touch-friendly tap targets throughout

## User Journey Flows

### First-Time Setup Journey

**Goal:** Get new users from signup to their first valuable insight in under 5 minutes.

**Entry:** User completes signup/login
**Exit:** User sees first personalized financial insight and is ready to chat

**Flow:**
1. Welcome screen with warm greeting
2. Optional QuickBooks connection (can skip)
3. Quick intake questions (4-5 max):
   - Agency name
   - Annual revenue range
   - Number of employees
   - Biggest financial question
4. First insight generated automatically
5. "Aha moment" delivered before user asks anything
6. Chat interface ready for questions

**Design Principles:**
- Never require QuickBooks to start (progressive data model)
- Every question should feel worth answering
- First insight must be genuinely surprising/valuable
- Entire flow completable in <3 minutes

### Ask a Question Journey

**Goal:** User asks a financial question and receives a clear, trustworthy answer instantly.

**Entry:** User types in chat input
**Exit:** User has actionable insight and can continue conversation

**Flow:**
1. User types natural language question
2. Typing indicator appears immediately (<100ms)
3. Response streams progressively
4. Rich answer card displays with:
   - Clear answer/recommendation
   - Key numbers highlighted
   - Data source attribution
   - Quick action buttons
5. User can drill deeper or ask follow-up

**Handling Data Gaps:**
- Full data: Complete answer with confidence
- Partial data: Answer with noted limitations + offer to improve
- Missing critical data: Conversational request woven into helpful response

**Design Principles:**
- Streaming response for perceived speed
- Never block with "I need more data"
- "How did you calculate this?" always available
- Save as Report for shareable artifacts

### Document Upload Journey

**Goal:** User uploads a financial document and sees it integrated into their data.

**Entry:** User initiates upload via chat, panel, or drag-drop
**Exit:** Document processed, data integrated, user prompted to explore insights

**Flow:**
1. Multiple entry points (flexibility):
   - Chat: "Upload a document" button
   - Panel: Quick Actions → Upload
   - Drag-drop anywhere on interface
2. File picker or drop zone
3. Processing animation with progress
4. Parse result handling:
   - Clean: Show extracted summary
   - Unclear: Ask for clarification
   - Failed: Friendly error with suggestions
5. Data integration confirmation
6. Proactive insight offer

**Design Principles:**
- Multiple intuitive entry points
- Clear feedback during processing
- Graceful handling of messy documents
- Immediate value suggestion after upload

### QuickBooks Connection Journey

**Goal:** User connects QuickBooks for automatic data sync.

**Entry:** User clicks connect via onboarding, panel, or chat prompt
**Exit:** QuickBooks connected, initial sync complete, user ready to ask data-driven questions

**Flow:**
1. Entry point (onboarding, panel, or chat suggestion)
2. QuickBooks OAuth authorization screen
3. User grants permission
4. Return to app with syncing indicator
5. Initial sync completion
6. Data summary shown
7. Success confirmation with next-step prompt

**Design Principles:**
- Standard OAuth flow (familiar pattern)
- Clear progress during sync
- Immediate value message after connection
- Data source visible in panel

### Journey Patterns

**Common Navigation Patterns:**
- Chat-first entry for all features
- Panel as secondary access point
- Contextual suggestions within conversation

**Common Feedback Patterns:**
- Immediate visual response to all actions (<100ms)
- Streaming for longer operations
- Success states with next-step suggestions
- Friendly error messages with recovery paths

**Common Decision Patterns:**
- Default to most common choice
- Allow skip/later for optional steps
- Conversational clarification over form validation

### Flow Optimization Principles

1. **Minimize Steps to Value** — Every flow should reach a valuable outcome in minimum steps
2. **Progressive Disclosure** — Show essential info first, details on demand
3. **Graceful Degradation** — Partial data yields partial insights (never block)
4. **Clear Progress** — Users always know where they are and what's next
5. **Easy Recovery** — Errors are friendly and recoverable
6. **Contextual Help** — Guidance appears when needed, not before

## Component Strategy

### Design System Components (Chakra UI)

**Layout Components:**
- `Box`, `Flex`, `Stack`, `Grid` — Page structure and message layout
- `Container` — Centered content with max-width

**Typography:**
- `Text`, `Heading` — All text content with semantic hierarchy

**Form Components:**
- `Input`, `Textarea` — Chat input field
- `Button`, `IconButton` — Actions and controls

**Feedback Components:**
- `Spinner`, `Skeleton` — Loading states
- `Progress` — Upload and sync progress

**Overlay Components:**
- `Drawer` — Collapsible side panel
- `Modal` — Confirmations and focused tasks
- `Tooltip` — Contextual help

**Data Display:**
- `Card` — Base for custom response cards
- `Badge` — Status indicators and tags
- `Stat` — Key metrics display

### Custom Components

#### ChatMessage

**Purpose:** Display a single message in the conversation thread.

**Variants:**
- `user` — Right-aligned, accent background color, user's question
- `assistant` — Left-aligned, white background, CFO response

**Anatomy:**
- Avatar (optional, assistant only)
- Message content (text, markdown, or RichResponseCard)
- Timestamp (subtle, on hover or always visible)
- Actions (copy, for assistant messages)

**States:**
- Default — Complete message
- Streaming — Content appearing progressively (assistant only)

**Accessibility:**
- Role: `article` with `aria-label` for message type
- Live region for streaming updates

#### RichResponseCard

**Purpose:** Display structured financial insights within chat responses.

**Variants:**
- `cost-breakdown` — Table showing cost components (e.g., employee costs)
- `hiring-analysis` — Yes/no recommendation with supporting reasoning
- `metric-highlight` — Single important number with context
- `report-summary` — Preview of exportable report

**Anatomy:**
- Card header (title, icon)
- Key metric (large, emphasized number)
- Detail section (expandable rows or table)
- Action buttons (expand, save, share)
- Data source attribution

**States:**
- Default — Summary view
- Expanded — Full detail visible
- Saving — When save action in progress

**Accessibility:**
- Semantic table markup for tabular data
- Clear heading hierarchy within card

#### TypingIndicator

**Purpose:** Show the assistant is generating a response.

**Anatomy:**
- Three animated dots in a bubble
- Positioned like an assistant message

**Animation:**
- Sequential bounce animation (dot 1, dot 2, dot 3)
- Smooth, not jarring
- 1.2s total cycle

**Behavior:**
- Appears immediately when user sends message
- Disappears when first response content arrives
- Never visible for more than 30 seconds (timeout to error state)

#### DataSourceBadge

**Purpose:** Show what data source informed an answer.

**Variants:**
- `quickbooks` — QuickBooks data
- `document` — Uploaded document
- `manual` — User-provided information
- `calculated` — Derived from multiple sources

**Anatomy:**
- Small icon (source type)
- Label text ("Based on QuickBooks data")
- Optional date ("Dec 2024")

**Placement:**
- Below or within response cards
- Subtle but visible

#### QuickActionButton

**Purpose:** Enable inline actions within chat responses.

**Variants:**
- `primary` — Main action (e.g., "Save as Report")
- `secondary` — Supporting action (e.g., "Show breakdown")
- `ghost` — Tertiary action (e.g., "How did you calculate this?")

**Anatomy:**
- Icon (optional)
- Label text
- Hover state with subtle background

**Behavior:**
- Click triggers action
- May expand content inline or open panel
- Loading state while action processes

#### DocumentDropZone

**Purpose:** Allow drag-and-drop file upload.

**States:**
- Default — Subtle drop target with instructions
- Hover/Dragover — Highlighted, inviting
- Processing — Upload progress indicator
- Success — Confirmation with file info
- Error — Friendly error with retry option

**Anatomy:**
- Dashed border area
- Icon (upload cloud)
- Instructional text
- Supported formats note

#### OnboardingQuestion

**Purpose:** Display intake question during first-time setup.

**Anatomy:**
- Question text (friendly, conversational)
- Input field (text, select, or button group)
- Progress indicator (step X of Y)
- Skip option (where applicable)

**Behavior:**
- Enter or button advances to next
- Validates input before proceeding
- Answers persist for later use

### Component Implementation Strategy

**Approach:**
1. Use Chakra primitives as foundation for all custom components
2. Apply custom theme tokens for consistent styling
3. Build components as composable, reusable units
4. Follow Chakra patterns for props and variants
5. Ensure all components meet accessibility standards

**Styling Strategy:**
- Extend Chakra theme with custom component styles
- Use design tokens (colors, spacing, typography) consistently
- Avoid inline styles; use style props or theme extensions

**Testing Strategy:**
- Visual regression tests for component states
- Accessibility audits for all custom components
- Unit tests for interactive behavior

### Implementation Roadmap

**Phase 1 — Core Chat Components (MVP Critical):**
- ChatMessage (user + assistant variants)
- TypingIndicator
- RichResponseCard (basic variant)
- QuickActionButton
- DataSourceBadge

**Phase 2 — Data Input Components:**
- DocumentDropZone
- OnboardingQuestion
- ConnectionStatus (QuickBooks indicator)

**Phase 3 — Enhancement Components:**
- RichResponseCard (all variants)
- SavedReportItem
- Advanced filtering/search (if needed)

## UX Consistency Patterns

### Button Hierarchy

**Primary Actions:**
- Single primary action per context
- Filled button with accent color (warm gold)
- Used for: Send message, Save report, Connect QuickBooks
- Clear, action-oriented labels ("Save Report" not "Submit")

**Secondary Actions:**
- Outlined or ghost style
- Used for: Show breakdown, Cancel, Skip
- Lower visual weight than primary

**Inline Actions (in chat responses):**
- Ghost buttons with subtle hover
- Grouped horizontally below content
- Examples: "How did you calculate this?", "Show breakdown"

**Destructive Actions:**
- Red/coral accent, requires confirmation
- Used sparingly (disconnect data source, delete report)
- Never positioned as primary action

**Button States:**
- Default → Hover → Active → Disabled → Loading
- Loading state shows spinner, disables interaction
- Disabled explains why when hovered (tooltip)

### Feedback Patterns

**Success Feedback:**
- Subtle green indicator or checkmark
- Brief toast notification for actions (auto-dismiss 3s)
- Inline confirmation for important actions ("Report saved ✓")
- Never block user flow with success modals

**Error Feedback:**
- Friendly, conversational tone (never "Error 500")
- Clear explanation of what went wrong
- Actionable recovery path ("Try again" or "Contact support")
- Coral accent color, not aggressive red

**Warning Feedback:**
- Amber accent for attention-needed states
- Used for: Data limitations, incomplete information
- Always includes helpful context
- Example: "I'm working with limited data. Connect QuickBooks for more accurate insights."

**Info Feedback:**
- Blue accent for neutral information
- Used for: Tips, suggestions, data source notes
- Non-intrusive, dismissible if persistent

**Toast Notifications:**
- Bottom-right positioning (doesn't block chat)
- Auto-dismiss for success (3s)
- Persist until dismissed for errors
- Stack if multiple (max 3 visible)

### Loading & Streaming Patterns

**Chat Response Loading:**
- Typing indicator appears immediately (<100ms after send)
- Three-dot animation in assistant message position
- Never show generic "Loading..." text in chat

**Streaming Responses:**
- Text appears word-by-word or chunk-by-chunk
- Smooth animation, not jarring
- Scroll follows new content automatically
- User can scroll up during stream (stops auto-scroll)

**Data Fetching:**
- Skeleton loading for cards and structured content
- Spinner for quick operations (<2s expected)
- Progress bar for uploads and syncs

**Perceived Performance:**
- Optimistic UI updates where safe
- Immediate visual response to all clicks (<100ms)
- Background operations don't block interaction

### Error Handling Patterns

**Conversational Error Recovery:**
- Errors appear as assistant messages, not alerts
- Friendly tone: "I ran into a problem..." not "Error occurred"
- Always include what user can do next
- Offer to try again or suggest alternatives

**Input Validation:**
- Validate on blur, not on keystroke
- Inline hints below field, not blocking alerts
- Conversational tone: "Hmm, that doesn't look like a valid email"
- Auto-correct obvious typos when possible

**Network Errors:**
- Detect offline state, show persistent indicator
- Queue messages for retry when connection returns
- Never lose user's typed input on error

**Data Processing Errors:**
- Specific feedback: "I couldn't read the third page of your PDF"
- Partial success OK: "I got most of it, but need help with..."
- Clear retry mechanism

### Empty States

**First-Time User (No Data):**
- Warm welcome message
- Clear first action prompt
- Example questions to inspire
- Never feel empty or cold

**No Search Results:**
- Acknowledge the search attempt
- Suggest alternatives or rephrasing
- Maintain encouraging tone

**No Saved Reports:**
- Explain what saved reports are
- Show how to create one
- Subtle illustration, not blank space

**Disconnected Data Source:**
- Clear status indication
- Easy reconnect action
- Explain benefits of connecting

**Empty States Principles:**
- Always explain why it's empty
- Always provide a next action
- Use illustrations sparingly (warm, not childish)
- Maintain product personality

### Form & Input Patterns

**Conversational Data Collection:**
- Prefer chat-based questions over traditional forms
- One question at a time when in chat context
- Allow natural language responses where possible

**Traditional Forms (Settings, Profile):**
- Stack labels above inputs
- Group related fields
- Show required vs. optional clearly
- Save automatically where safe, confirm where not

**Input Validation:**
- Real-time feedback for format validation
- Helpful hints, not error messages
- Support common format variations (phone, currency)

**Multi-Step Processes:**
- Show progress indicator (Step 2 of 4)
- Allow back navigation
- Save progress automatically
- Allow skip where appropriate

### Navigation Patterns

**Primary Navigation:**
- Chat is always primary surface
- Side panel for secondary access
- No complex menu hierarchies

**Panel Navigation:**
- Sections within panel (Data Sources, Reports, Settings)
- Clear section headers
- Collapse/expand for organization

**Contextual Navigation:**
- Suggestions in chat responses
- Quick actions surface relevant next steps
- Deep links from notifications

**Back/Forward:**
- Browser back/forward works naturally
- Scroll position preserved on return
- Conversation context maintained

### Data Display Patterns

**Financial Numbers:**
- Right-align in tables for comparison
- Use tabular numerals (not proportional)
- Include units/currency symbols
- Color-code positive (green) / negative (coral)

**Tables in Chat:**
- Responsive: collapse to cards on small screens
- Sortable if >5 rows
- Horizontally scrollable if necessary
- Never truncate important data

**Charts & Visualizations:**
- Simple, clear, not decorative
- Always include data labels
- Accessible colors (not just color-coded)
- Interactive tooltips for detail

### Confirmation Patterns

**Low-Risk Actions:**
- No confirmation needed (send message, save report)
- Immediate action with undo option if reversible

**Medium-Risk Actions:**
- Inline confirmation ("Are you sure?")
- Single click to confirm
- Clear cancel option

**High-Risk Actions:**
- Modal confirmation
- Explain consequences clearly
- Require explicit action (type to confirm)
- Used for: Disconnect data source, delete account

### Accessibility Integration

**All Patterns Must:**
- Support keyboard navigation
- Work with screen readers
- Meet color contrast requirements
- Function without mouse
- Respect reduced motion preferences

## Responsive Design & Accessibility

### Responsive Strategy

**Desktop-First Approach**

bfi-cfo-bot is designed primarily for desktop/laptop use during business hours. The responsive strategy ensures the experience degrades gracefully to smaller screens while maintaining full functionality.

**Desktop (1024px+):**
- Full experience with collapsible side panel
- Chat area centered with ~800px max-width
- Side panel slides in from right (280px)
- Comfortable spacing and typography

**Tablet (768px - 1023px):**
- Panel becomes overlay instead of side-by-side
- Chat area uses full width
- Touch-optimized tap targets (48px minimum)
- Simplified header with icon buttons

**Mobile (320px - 767px):**
- Single-column, full-width chat
- Panel becomes full-screen modal
- Bottom-fixed input area
- Larger touch targets throughout
- Simplified rich response cards

### Breakpoint Strategy

**Breakpoints:**

| Breakpoint | Value | Layout Change |
|------------|-------|---------------|
| `sm` | 480px | Mobile compact adjustments |
| `md` | 768px | Tablet layout triggers |
| `lg` | 1024px | Desktop layout triggers |
| `xl` | 1280px | Wide desktop optimizations |

**Design Approach:**
- Mobile-first CSS (min-width media queries)
- Chakra UI responsive props for component-level adjustments
- Fluid typography scaling between breakpoints

**Key Responsive Behaviors:**

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Chat Area | Full width | Full width | Centered, max-width |
| Side Panel | Full-screen overlay | Full-screen overlay | Inline, collapsible |
| Rich Cards | Stacked, full width | Stacked, full width | Inline, expandable |
| Input Area | Fixed bottom | Fixed bottom | Fixed bottom |
| Header | Compact, icons only | Full with icons | Full with text + icons |

### Accessibility Strategy

**Compliance Target: WCAG 2.1 Level AA**

Level AA is the industry standard for professional business tools and ensures the product is accessible to users with common disabilities without requiring extreme accommodations.

**Color & Contrast:**
- All text meets 4.5:1 contrast ratio (normal text)
- Large text meets 3:1 contrast ratio
- UI components meet 3:1 against backgrounds
- Never rely on color alone to convey information
- Test with color blindness simulators

**Keyboard Navigation:**
- All interactive elements keyboard accessible
- Logical tab order following visual layout
- Visible focus indicators on all focusable elements
- Skip link to main content
- Escape key closes modals/panels

**Screen Reader Support:**
- Semantic HTML structure (nav, main, article, etc.)
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content (streaming responses)
- Meaningful alt text for any images
- Descriptive link text (not "click here")

**Motor Accessibility:**
- Touch targets minimum 44x44px
- Adequate spacing between interactive elements
- No time-limited interactions (or extendable)
- No interactions requiring precise pointer control

**Cognitive Accessibility:**
- Clear, consistent navigation patterns
- Plain language in all content
- Error messages explain how to fix issues
- No unexpected context changes
- Progress indicators for multi-step processes

### Chat-Specific Accessibility

**Message Stream:**
- New messages announced to screen readers via live region
- Clear distinction between user and assistant messages
- Timestamps accessible but not intrusive

**Streaming Responses:**
- Screen reader announces when response starts
- Final message announced when complete
- User can pause auto-scroll without losing content

**Rich Response Cards:**
- Tables use proper semantic markup
- Charts include text alternatives
- Expandable sections properly announced
- Action buttons clearly labeled

### Testing Strategy

**Automated Testing:**
- axe-core integration in development
- Lighthouse accessibility audits in CI
- ESLint accessibility plugins (jsx-a11y)

**Manual Testing:**
- Keyboard-only navigation testing
- Screen reader testing (VoiceOver on Mac, NVDA on Windows)
- Color contrast verification
- Zoom testing (up to 200%)

**Device Testing:**
- Real device testing on iOS Safari, Android Chrome
- Browser testing: Chrome, Firefox, Safari, Edge
- Test with actual assistive technology users when possible

**Testing Checklist:**
- [ ] All pages keyboard navigable
- [ ] Screen reader announces all content meaningfully
- [ ] Color contrast meets AA standards
- [ ] Touch targets adequate on mobile
- [ ] Forms announce errors clearly
- [ ] Focus management correct in modals/panels
- [ ] Streaming content accessible

### Implementation Guidelines

**Responsive Development:**
- Use Chakra UI responsive array syntax: `fontSize={['sm', 'md', 'lg']}`
- Avoid fixed pixel widths; use relative units
- Test every component at all breakpoints
- Ensure touch targets are adequate at smaller sizes

**Accessibility Development:**
- Start with semantic HTML; add ARIA only when needed
- Test keyboard navigation during development, not after
- Use Chakra's built-in accessibility features
- Document accessibility requirements in component specs

**Code Standards:**
- All images require alt text (or aria-hidden if decorative)
- All form inputs require labels
- All buttons require accessible names
- All modals manage focus correctly
- All dynamic content uses appropriate live regions

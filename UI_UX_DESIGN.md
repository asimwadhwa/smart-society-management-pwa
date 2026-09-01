# UI/UX Design Specification: Asim Wadhwa Society Management

A comprehensive design guide for building a clean, modern, and fully responsive society management application.

---

## Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Simplicity** | Clean interfaces with minimal clutter |
| **Accessibility** | Easy to use for all age groups (residents may be elderly) |
| **Mobile-First** | Designed for phones first, scales up to desktop |
| **Consistency** | Same patterns and components throughout |
| **Clarity** | Clear visual hierarchy and obvious actions |

---

## Brand Identity

### Logo / Branding

**Text-Based Logo:**
```
┌─────────────────────────────────┐
│  🏢 Asim Wadhwa           │
│     Society Management          │
└─────────────────────────────────┘
```

**Typography for Logo:**
- Primary Text: **"Asim Wadhwa"** - Font: Inter Bold, 24px
- Secondary Text: **"Society Management"** - Font: Inter Regular, 14px, muted color

**Favicon:** 🏢 or "RD" monogram in primary color

---

## Color Palette

### Primary Colors (Teal/Cyan Theme - Professional & Calming)

| Name | Hex Code | Usage |
|------|----------|-------|
| **Primary** | `#0D9488` | Buttons, links, active states, sidebar |
| **Primary Light** | `#14B8A6` | Hover states |
| **Primary Dark** | `#0F766E` | Pressed states |
| **Primary Subtle** | `#CCFBF1` | Light backgrounds, badges |

### Semantic Colors

| Name | Hex Code | Usage |
|------|----------|-------|
| **Success** | `#22C55E` | Paid status, resolved, success messages |
| **Success Light** | `#DCFCE7` | Success badge backgrounds |
| **Warning** | `#F59E0B` | Pending status, reminders |
| **Warning Light** | `#FEF3C7` | Warning badge backgrounds |
| **Danger** | `#EF4444` | Emergency button, overdue, errors |
| **Danger Light** | `#FEE2E2` | Error badge backgrounds |
| **Info** | `#3B82F6` | Information, in-progress |
| **Info Light** | `#DBEAFE` | Info badge backgrounds |

### Neutral Colors

| Name | Hex Code | Usage |
|------|----------|-------|
| **White** | `#FFFFFF` | Page backgrounds, cards |
| **Gray 50** | `#F9FAFB` | Alternate backgrounds |
| **Gray 100** | `#F3F4F6` | Input backgrounds, dividers |
| **Gray 200** | `#E5E7EB` | Borders |
| **Gray 300** | `#D1D5DB` | Disabled states |
| **Gray 500** | `#6B7280` | Secondary text, placeholders |
| **Gray 700** | `#374151` | Primary text |
| **Gray 900** | `#111827` | Headings |

---

## Typography

### Font Family

**Primary Font:** `Inter` (Google Fonts)
- Clean, modern, excellent readability
- Good support for numbers (important for payments)

**Fallback:** `system-ui, -apple-system, sans-serif`

### Type Scale

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **H1** | 30px / 1.875rem | 700 (Bold) | 1.2 | Page titles |
| **H2** | 24px / 1.5rem | 600 (Semibold) | 1.3 | Section headers |
| **H3** | 20px / 1.25rem | 600 (Semibold) | 1.4 | Card titles |
| **H4** | 16px / 1rem | 600 (Semibold) | 1.4 | Subsections |
| **Body** | 16px / 1rem | 400 (Regular) | 1.5 | Default text |
| **Body Small** | 14px / 0.875rem | 400 (Regular) | 1.5 | Secondary info |
| **Caption** | 12px / 0.75rem | 400 (Regular) | 1.4 | Hints, timestamps |
| **Button** | 14px / 0.875rem | 500 (Medium) | 1 | Button text |

### Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

---

## Spacing System

Using Tailwind's default 4px base unit:

| Name | Value | Usage |
|------|-------|-------|
| `space-1` | 4px | Tight spacing (icon gaps) |
| `space-2` | 8px | Compact spacing (badge padding) |
| `space-3` | 12px | Small gaps |
| `space-4` | 16px | Default spacing (card padding, form gaps) |
| `space-5` | 20px | Medium gaps |
| `space-6` | 24px | Section spacing |
| `space-8` | 32px | Large gaps |
| `space-10` | 40px | Page padding |
| `space-12` | 48px | Section separators |

---

## Border Radius

| Name | Value | Usage |
|------|-------|-------|
| `rounded-sm` | 4px | Small elements, badges |
| `rounded` | 6px | Inputs, small buttons |
| `rounded-md` | 8px | Cards, buttons |
| `rounded-lg` | 12px | Large cards, modals |
| `rounded-xl` | 16px | Feature cards |
| `rounded-full` | 9999px | Avatar, circular buttons |

---

## Shadows

| Name | Value | Usage |
|------|-------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `shadow` | `0 1px 3px rgba(0,0,0,0.1)` | Cards, dropdowns |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Floating elements |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals |

---

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| **Mobile** | < 640px | Single column, bottom nav |
| **Tablet** | 640px - 1024px | Collapsible sidebar |
| **Desktop** | > 1024px | Fixed sidebar + content |

---

## Layout Templates

### 1. Auth Pages (Login, Register, Forgot Password)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│           ┌─────────────────────┐              │
│           │  🏢 Asim Wadhwa     │              │
│           │   Society Management│              │
│           └─────────────────────┘              │
│                                                 │
│           ┌─────────────────────┐              │
│           │                     │              │
│           │   [Login Form]      │              │
│           │                     │              │
│           │   Email             │              │
│           │   ┌───────────────┐ │              │
│           │   │               │ │              │
│           │   └───────────────┘ │              │
│           │                     │              │
│           │   Password          │              │
│           │   ┌───────────────┐ │              │
│           │   │               │ │              │
│           │   └───────────────┘ │              │
│           │                     │              │
│           │   [  Login  ]       │              │
│           │                     │              │
│           │   Forgot Password?  │              │
│           │   Don't have account│              │
│           │                     │              │
│           └─────────────────────┘              │
│                                                 │
└─────────────────────────────────────────────────┘

- Centered card on subtle gray background (#F9FAFB)
- Card max-width: 400px
- Card has shadow-lg and rounded-xl
```

### 2. Dashboard Layout - Desktop

```
┌────────────────────────────────────────────────────────────────────┐
│  🏢 Asim Wadhwa          Welcome, Aayush (Flat 101)   [👤]   │
├──────────────┬─────────────────────────────────────────────────────┤
│              │                                                      │
│   🏠 Home    │   ┌──────────────────────────────────────────────┐ │
│              │   │  🚨 EMERGENCY: Someone stuck in lift!        │ │
│   💰 Pay     │   │  Flat 203 • 2 mins ago    [View Details]     │ │
│      Dues    │   └──────────────────────────────────────────────┘ │
│              │                                                      │
│   📋 My      │   Dashboard                                         │
│   Complaints │   ─────────────────────────────────────────────────│
│              │                                                      │
│   🚨 Emergency│   ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│              │   │ 💰 ₹1,000   │  │ 📋 2 Open   │  │ ✅ Assets │ │
│   ───────────│   │ Due Feb 18  │  │ Complaints  │  │ All OK    │ │
│   ADMIN      │   │ [Pay Now]   │  │ [View]      │  │           │ │
│   ───────────│   └─────────────┘  └─────────────┘  └───────────┘ │
│              │                                                      │
│   👥 Users   │   Recent Activity                                   │
│              │   ─────────────────────────────────────────────────│
│   📊 Payments│   • Payment received from Flat 305                  │
│              │   • New complaint filed by Flat 102                 │
│   📝 All     │   • Emergency resolved at 3:45 PM                   │
│   Complaints │                                                      │
│              │                                                      │
│   ⚙️ Assets  │                                                      │
│              │                                                      │
│   ───────────│                                                      │
│   [Logout]   │                                                      │
│              │                                                      │
└──────────────┴─────────────────────────────────────────────────────┘

- Sidebar: 256px width, primary-700 background, white text
- Content area: #F9FAFB background
- Cards: White background, shadow, rounded-lg
- Top navbar: White, shadow-sm, 64px height
```

### 3. Dashboard Layout - Mobile

```
┌─────────────────────────────┐
│  🏢 Asim Wadhwa   ☰   │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │ 🚨 EMERGENCY ALERT    │  │
│  │ Someone stuck in lift │  │
│  │ [View Details]        │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 💰 Maintenance Due    │  │
│  │ ₹1,000 • Due Feb 18   │  │
│  │ [Pay Now]             │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 📋 My Complaints      │  │
│  │ 2 Open                │  │
│  │ [View All]            │  │
│  └───────────────────────┘  │
│                             │
│                             │
├─────────────────────────────┤
│  🏠    💰    🚨    📋   👤  │
│ Home  Pay  Alert  Help  Me  │
└─────────────────────────────┘

- Full-width cards with 16px padding
- Bottom navigation: 64px height, fixed
- Top header: 56px height, hamburger menu
```

### 4. Watchman Portal - Mobile

```
┌─────────────────────────────┐
│  🏢 Watchman Portal    👤   │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │   🚨 EMERGENCY        │  │
│  │                       │  │
│  │   Press if someone    │  │
│  │   is stuck in lift    │  │
│  │                       │  │
│  │   [ BIG RED BUTTON ]  │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  📝 Log Visitor       │  │
│  │                       │  │
│  │  Name: ____________   │  │
│  │  Flat: [Dropdown]     │  │
│  │  Purpose: _________   │  │
│  │                       │  │
│  │  [ Add Entry ]        │  │
│  └───────────────────────┘  │
│                             │
│  Today's Visitors (12)      │
│  ┌───────────────────────┐  │
│  │ Ramesh Kumar → 203    │  │
│  │ 10:30 AM   [Mark Out] │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Delivery Boy → 101    │  │
│  │ 11:15 AM   ✓ Left     │  │
│  └───────────────────────┘  │
│                             │
└─────────────────────────────┘

- Large touch targets (min 48px height)
- Simple, no sidebar
- Emergency button prominently displayed
```

---

## Component Specifications

### 1. Buttons

#### Primary Button
```
┌─────────────────────┐
│      Pay Now        │
└─────────────────────┘

- Background: primary-600 (#0D9488)
- Text: White, 14px, medium weight
- Padding: 10px 16px
- Border-radius: 8px
- Hover: primary-500
- Active: primary-700
- Disabled: gray-300 background, gray-500 text
```

#### Secondary Button
```
┌─────────────────────┐
│      Cancel         │
└─────────────────────┘

- Background: White
- Border: 1px solid gray-300
- Text: gray-700, 14px, medium weight
- Hover: gray-50 background
```

#### Danger Button
```
┌─────────────────────┐
│  🚨 EMERGENCY       │
└─────────────────────┘

- Background: danger-500 (#EF4444)
- Text: White, 16px, bold
- Padding: 16px 24px (larger for emergency)
- Border-radius: 12px
- Box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4)
- Pulse animation when idle
```

### 2. Cards

#### Stats Card
```
┌─────────────────────────────┐
│  💰                         │
│  ₹1,000                     │  <- Large number
│  Maintenance Due            │  <- Label
│  Due: Feb 18, 2026          │  <- Secondary info
│                             │
│  [Pay Now]                  │  <- Action button
└─────────────────────────────┘

- Background: White
- Padding: 24px
- Border-radius: 12px
- Shadow: shadow
- Icon: 32px, primary color
- Amount: 28px, bold, gray-900
- Label: 14px, gray-500
```

#### Complaint Card
```
┌─────────────────────────────┐
│  Water leakage in bathroom  │
│  ┌─────────────────────┐    │
│  │    [Image Preview]   │    │
│  └─────────────────────┘    │
│                             │
│  Flat 101 • Jan 20, 2026    │
│                             │
│  [🟡 In Progress]           │  <- Status badge
└─────────────────────────────┘

- Same styling as Stats Card
- Image: rounded-md, max-height 200px
- Status badge: colored background
```

### 3. Status Badges

| Status | Background | Text | Border |
|--------|------------|------|--------|
| **Paid** | success-light (#DCFCE7) | success (#22C55E) | none |
| **Pending** | warning-light (#FEF3C7) | warning-700 (#B45309) | none |
| **Overdue** | danger-light (#FEE2E2) | danger (#EF4444) | none |
| **Open** | info-light (#DBEAFE) | info (#3B82F6) | none |
| **In Progress** | warning-light | warning-700 | none |
| **Resolved** | success-light | success | none |
| **Working** | success-light | success | none |
| **Under Maintenance** | warning-light | warning-700 | none |
| **Not Working** | danger-light | danger | none |

```
Badge styling:
- Padding: 4px 12px
- Border-radius: 9999px (full)
- Font: 12px, medium weight
- Inline-flex with icon optional
```

### 4. Form Inputs

#### Text Input
```
Label
┌─────────────────────────────┐
│ Placeholder text            │
└─────────────────────────────┘

- Height: 44px
- Background: white
- Border: 1px solid gray-300
- Border-radius: 8px
- Padding: 0 12px
- Focus: border primary-500, ring-2 ring-primary-100
- Error: border danger-500, ring-2 ring-danger-100
- Label: 14px, medium, gray-700, margin-bottom 6px
```

#### Select Dropdown
```
Flat Number
┌─────────────────────────────┐
│ Select flat...           ▼  │
└─────────────────────────────┘

- Same styling as text input
- Dropdown icon on right
- Options: 44px height each
```

#### Textarea
```
Description
┌─────────────────────────────┐
│                             │
│ Describe your complaint...  │
│                             │
│                             │
└─────────────────────────────┘

- Min-height: 120px
- Resize: vertical only
- Same border/focus styling
```

### 5. Navigation

#### Desktop Sidebar
```
┌──────────────────┐
│                  │
│  🏢 Asim         │  <- Logo area (padding 24px)
│     Wadhwa       │
│                  │
├──────────────────┤
│                  │
│  🏠 Home         │  <- Nav item (padding 12px 24px)
│                  │
│  💰 Maintenance  │
│                  │     Active: primary-500 bg, white text
│  📋 Complaints   │     Hover: primary-600 bg
│                  │     Icon: 20px
│  🚨 Emergency    │     Text: 14px
│                  │
├──────────────────┤
│  ADMIN           │  <- Section label (12px, uppercase)
├──────────────────┤
│                  │
│  👥 Users        │
│                  │
│  📊 Payments     │
│                  │
│  ⚙️ Assets       │
│                  │
├──────────────────┤
│                  │
│  🚪 Logout       │  <- Danger color
│                  │
└──────────────────┘

- Width: 256px
- Background: primary-700 (#0F766E)
- Text: white/primary-100
```

#### Mobile Bottom Navigation
```
┌─────────────────────────────────────────┐
│   🏠      💰       🚨       📋      👤   │
│  Home    Pay    Alert    Help     Me    │
└─────────────────────────────────────────┘

- Height: 64px + safe-area-bottom
- Background: white
- Border-top: 1px solid gray-200
- Shadow: shadow-lg (upward)
- Active icon: primary-600
- Inactive icon: gray-400
- Label: 10px
- Fixed to bottom
```

### 6. Tables

#### Desktop Table
```
┌─────────────────────────────────────────────────────────────┐
│  Month     │  Amount   │  Status    │  Paid On    │ Action  │
├─────────────────────────────────────────────────────────────┤
│  Jan 2026  │  ₹1,000   │  ✅ Paid   │  15 Jan     │  View   │
│  Feb 2026  │  ₹1,000   │  🟡 Pending│  -          │  Pay    │
└─────────────────────────────────────────────────────────────┘

- Header: gray-50 bg, gray-700 text, 12px uppercase
- Row: white bg, hover gray-50
- Border: gray-200
- Cell padding: 12px 16px
- Alternating rows optional
```

#### Mobile Card List (replaces table)
```
┌─────────────────────────────┐
│  January 2026               │
│  ₹1,000                     │
│  ✅ Paid • 15 Jan 2026      │
│                    [View]   │
└─────────────────────────────┘
┌─────────────────────────────┐
│  February 2026              │
│  ₹1,000                     │
│  🟡 Pending • Due Feb 18    │
│                    [Pay]    │
└─────────────────────────────┘
```

### 7. Emergency Banner

```
┌─────────────────────────────────────────────────────────────┐
│  🚨  LIFT EMERGENCY: Someone is stuck! (Flat 203, 2m ago)  │
│                                              [View Details] │
└─────────────────────────────────────────────────────────────┘

- Background: danger-500 (#EF4444)
- Text: white
- Padding: 12px 16px
- Position: sticky top (below navbar)
- Animation: subtle pulse or shake
- Icon: animated bell or warning
```

### 8. Toast Notifications

```
Success:
┌─────────────────────────────┐
│  ✅  Payment successful!    │
└─────────────────────────────┘

Error:
┌─────────────────────────────┐
│  ❌  Payment failed         │
└─────────────────────────────┘

- Position: top-right (desktop), top-center (mobile)
- Duration: 4 seconds
- Background: white
- Left border: 4px solid (semantic color)
- Shadow: shadow-lg
- Close button on right
```

### 9. Empty States

```
┌─────────────────────────────────────────┐
│                                         │
│              📋                         │
│                                         │
│       No complaints yet                 │
│                                         │
│   When you file a complaint, it will    │
│   appear here.                          │
│                                         │
│       [File a Complaint]                │
│                                         │
└─────────────────────────────────────────┘

- Centered content
- Icon: 64px, gray-300
- Title: 18px, gray-700
- Description: 14px, gray-500
- Action button optional
```

### 10. Loading States

#### Skeleton Loader
```
┌─────────────────────────────┐
│  ████████████               │
│  ██████████████████████     │
│  ████████                   │
└─────────────────────────────┘

- Background: gray-200
- Animation: shimmer (gradient moving left-to-right)
- Border-radius matches content shape
```

#### Spinner
```
     ◠
   ◜   ◝
  
- 24px size for inline
- 48px size for full-page
- Color: primary-600
- Animation: spin 1s linear infinite
```

---

## Page-Specific Designs

### 1. Login Page

**Elements:**
- Logo centered at top
- White card with shadow
- Email input
- Password input with show/hide toggle
- "Forgot Password?" link
- Primary "Login" button (full width)
- "Don't have account? Register" link
- "Manager Setup" link (small, at bottom)

**Validation:**
- Email: required, valid format
- Password: required, min 6 characters
- Show inline errors below inputs

### 2. Register Page

**Elements:**
- Logo
- Form card with fields:
  - Name
  - Email
  - Phone
  - Flat Number (dropdown with available flats)
  - Password
  - Confirm Password
- Terms checkbox (optional)
- "Register" button
- "Already have account? Login" link

### 3. Dashboard Page

**Resident View:**
- Welcome message with name and flat
- Emergency banner (if active)
- Stats cards row:
  - Maintenance due/paid
  - Open complaints count
  - Emergency status
- Quick actions (Pay Now, File Complaint, Emergency)
- Recent activity feed (optional)

**Admin View (additional):**
- Total collected this month
- Pending payments count
- Open complaints count
- Asset status overview

### 4. Maintenance Page

**Elements:**
- Current month status card (large)
  - Amount due
  - Due date
  - Status badge
  - Pay Now button (Razorpay)
- Payment history section
  - Table (desktop) / Cards (mobile)
  - Filter by year (optional)

### 5. Complaints Page

**Resident View:**
- "File New Complaint" button
- Filter by status tabs (All, Open, In Progress, Resolved)
- Complaint cards list
- Click to view details

**Admin View:**
- All complaints from all residents
- Filter by status
- Click to update status

### 6. Emergency Page

**Elements:**
- Large emergency button (centered)
- Current emergency status
- Emergency history log
- Instructions text

### 7. Watchman Portal

**Simplified Design:**
- No sidebar
- Simple header with logout
- Two main sections:
  1. Emergency (trigger + active alerts)
  2. Gate Log (form + today's list)
- Large touch targets
- High contrast

---

## Animations & Transitions

| Element | Animation | Duration |
|---------|-----------|----------|
| Page transitions | Fade in | 200ms |
| Button hover | Background color | 150ms |
| Card hover | Subtle lift (translateY -2px) | 200ms |
| Modal open | Fade + scale up | 200ms |
| Modal close | Fade + scale down | 150ms |
| Sidebar collapse | Width slide | 200ms |
| Toast enter | Slide in from right | 300ms |
| Toast exit | Fade out | 200ms |
| Emergency button | Pulse | 2s infinite |
| Skeleton shimmer | Gradient sweep | 1.5s infinite |
| Spinner | Rotate | 1s infinite |

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| **Color Contrast** | Minimum 4.5:1 for normal text, 3:1 for large text |
| **Focus States** | Visible ring-2 outline on all interactive elements |
| **Keyboard Navigation** | All actions accessible via Tab + Enter |
| **Touch Targets** | Minimum 44x44px for mobile |
| **Screen Reader** | Proper ARIA labels, semantic HTML |
| **Form Labels** | All inputs have associated labels |
| **Error Messages** | Associated with inputs via aria-describedby |
| **Loading States** | aria-busy and aria-live for dynamic content |

---

## Icon Set

**Using: Lucide Icons** (consistent with shadcn/ui)

| Icon | Usage |
|------|-------|
| `Home` | Dashboard/Home |
| `CreditCard` | Payments/Maintenance |
| `FileText` | Complaints |
| `AlertTriangle` | Emergency |
| `Users` | User management |
| `Settings` | Assets/Settings |
| `LogOut` | Logout |
| `ChevronDown` | Dropdowns |
| `Check` | Success/Completed |
| `X` | Close/Error |
| `Clock` | Pending/Time |
| `Bell` | Notifications |
| `Menu` | Mobile menu |
| `Plus` | Add new |
| `Edit` | Edit action |
| `Trash` | Delete action |
| `Eye` | View details |
| `Upload` | File upload |

---

## Image Guidelines

| Type | Specifications |
|------|----------------|
| **Complaint Images** | Max 5MB, JPG/PNG, compressed via ImageKit |
| **Image Preview** | Thumbnail 200x200, click for full view |
| **Aspect Ratio** | Preserve original, max-height constraint |
| **Fallback** | Gray placeholder with icon if load fails |

---

## Form Validation Messages

| Field | Validation | Message |
|-------|------------|---------|
| **Email** | Required | "Email is required" |
| **Email** | Invalid | "Please enter a valid email" |
| **Password** | Required | "Password is required" |
| **Password** | Min length | "Password must be at least 6 characters" |
| **Phone** | Invalid | "Please enter a valid 10-digit phone number" |
| **OTP** | Invalid | "Please enter a valid 6-digit OTP" |
| **Description** | Required | "Description is required" |
| **Flat** | Required | "Please select a flat" |

---

## Key User Flows

### Flow 1: Pay Maintenance
```
Dashboard → Click "Pay Now" → Razorpay Checkout Opens → 
Complete Payment → Webhook Confirms → Success Toast → 
Dashboard Updated (Status: Paid)
```

### Flow 2: Trigger Emergency
```
Dashboard → Click Emergency Button → Confirmation Dialog →
Confirm → API Call → Email Sent to All → 
Success Toast → Emergency Banner Appears for All Users
```

### Flow 3: File Complaint
```
Complaints → Click "New Complaint" → Fill Form → 
Upload Image (Optional) → Submit → Success Toast →
Redirect to Complaints List → New Complaint Appears
```

### Flow 4: Watchman Log Visitor
```
Watchman Portal → Fill Gate Log Form → Submit →
Entry Added to Today's List → 
Later: Click "Mark Out" → Out-time Recorded
```

---

## Performance Considerations

| Technique | Implementation |
|-----------|----------------|
| **Lazy Loading** | Load images below fold lazily |
| **Code Splitting** | Next.js automatic per-route splitting |
| **Skeleton Loaders** | Show immediately while fetching data |
| **Optimistic UI** | Update UI before server confirms (payments excluded) |
| **Debounce** | Debounce search inputs (300ms) |
| **Pagination** | 10-20 items per page for lists |

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |
| Mobile Safari | iOS 14+ |
| Chrome Android | Last 2 versions |

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Pages** | kebab-case folder, page.tsx | `forgot-password/page.tsx` |
| **Components** | PascalCase | `PaymentCard.tsx` |
| **Hooks** | camelCase with use prefix | `useAuth.ts` |
| **Utils** | camelCase | `formatDate.ts` |
| **Types** | PascalCase | `User.ts` |
| **Styles** | Component name + .module.css (if needed) | `Sidebar.module.css` |

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Set up Next.js 14 with App Router
- [ ] Configure Tailwind CSS with custom theme
- [ ] Install and configure shadcn/ui
- [ ] Create base layout components (Navbar, Sidebar, MobileNav)
- [ ] Implement responsive breakpoint handling

### Phase 2: Auth Pages
- [ ] Login page
- [ ] Register page
- [ ] Forgot password page
- [ ] Manager setup page
- [ ] Form validation

### Phase 3: Dashboard
- [ ] Dashboard layout with sidebar
- [ ] Stats cards component
- [ ] Emergency banner component
- [ ] Mobile bottom navigation

### Phase 4: Feature Pages
- [ ] Maintenance page with Razorpay
- [ ] Complaints page with image upload
- [ ] Emergency page
- [ ] Admin pages (Users, Payments, Assets)

### Phase 5: Watchman Portal
- [ ] Simplified watchman layout
- [ ] Emergency button
- [ ] Gate log form and list

### Phase 6: Polish
- [ ] Loading states (skeletons)
- [ ] Error states
- [ ] Empty states
- [ ] Toast notifications
- [ ] Final responsive testing

---

## Ready for Development! 🎨

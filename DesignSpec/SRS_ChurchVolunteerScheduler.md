# Software Requirements Specification
## Church Volunteer Scheduling Application
**Version:** 0.5 (Draft)
**Date:** June 2, 2026
**Status:** In Progress

---

## 1. Introduction

### 1.1 Purpose
This document defines the software requirements for a web-based volunteer scheduling application for a church organization. It replaces the existing manual process of collecting availability via Google Forms and compiling data into spreadsheets.

### 1.2 Scope
The application allows church volunteers to log in, view a monthly calendar, and self-assign to available time slots. An admin interface enables schedule management, slot creation, and schedule export. The system automates the monthly scheduling lifecycle — opening signups, closing them, and generating a finalized schedule.

### 1.3 Intended Audience
- Project developer(s)
- Church admin / schedule coordinator
- Church volunteers (end users)

### 1.4 Definitions & Abbreviations
| Term | Definition |
|------|------------|
| Slot | A specific date + time window available for volunteer sign-up |
| Schedule | The compiled set of slots and their assigned volunteers for a given month |
| Admin | A privileged user with access to slot management and schedule export |
| Volunteer | A standard user who can view and sign up for available slots |
| Signup Window | The period during which volunteers may register for a given month |

---

## 2. Overall Description

### 2.1 Product Perspective
A standalone full-stack web application built with **Next.js** (frontend + API routes) and **Supabase** (database, auth, and real-time updates). No separate backend service is required.

### 2.2 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (React) |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth + Magic Links) |
| Real-time | Supabase Realtime |
| Email | Resend (transactional + bulk magic link sends) |
| Scheduling | Supabase pg_cron + Edge Functions |
| Hosting | TBD (Vercel recommended for Next.js) |

### 2.3 User Classes
- **Volunteer** — Standard authenticated user. Can view calendar, sign up for slots, and manage their own signups.
- **Admin** — Elevated role. Can create/edit/delete slots, open/close signup windows, and export schedules.

### 2.4 Assumptions & Dependencies
- Users have a valid email or Google account for authentication.
- The admin defines time slots at the start of each monthly cycle.
- A stable internet connection is required; offline use is out of scope.

---

## 3. System Features

### 3.1 Authentication

#### 3.1.1 Description
Users must authenticate before accessing any part of the application.

#### 3.1.2 Requirements
- `AUTH-01` — Users can sign in via Google OAuth (one-click) or Magic Link (email-based, passwordless).
- `AUTH-02` — Unauthenticated users are redirected to the login page.
- `AUTH-03` — User roles (`volunteer`, `admin`) are stored in the database and enforced on both the client and server.
- `AUTH-04` — Sessions are persistent with a 1-year expiry; users on their own device sign in once and remain logged in.
- `AUTH-05` — Session tokens are automatically refreshed in the background via Supabase's `persistSession` client option.
- `AUTH-06` — Admin accounts may enforce stricter session policies independent of volunteer accounts.

---

### 3.2 Monthly Calendar View

#### 3.2.1 Description
The primary interface for volunteers. Displays the current (or upcoming) month with all available time slots.

#### 3.2.2 Requirements
- `CAL-01` — The calendar defaults to the current month; volunteers can view the next month once its signup window opens.
- `CAL-02` — Each day on the calendar shows available time slots for that day.
- `CAL-03` — Slots display their time range, location (if applicable), current signup count, and max capacity.
- `CAL-04` — Slots the user is already signed up for are visually distinguished.
- `CAL-05` — Full slots are displayed but marked as unavailable; they cannot be clicked.
- `CAL-06` — The calendar is read-only when the signup window is closed.

---

### 3.3 Volunteer Sign-Up

#### 3.3.1 Description
Volunteers self-select into available time slots.

#### 3.3.2 Requirements
- `SIGNUP-01` — A volunteer can sign up for a slot by clicking it and confirming.
- `SIGNUP-02` — A volunteer can cancel their own signup at any time before the schedule is finalized.
- `SIGNUP-03` — Signing up for a slot at capacity is not permitted.
- `SIGNUP-04` — A volunteer can sign up for multiple slots across different days.
- `SIGNUP-05` — Sign-up actions are reflected in real-time for all users currently viewing the calendar (via Supabase Realtime).
- `SIGNUP-06` — A volunteer can view a summary of all their upcoming signups.

---

### 3.4 Admin — Slot Management

#### 3.4.1 Description
Admins can create, edit, and delete time slots for any given month.

#### 3.4.2 Requirements
- `SLOT-01` — Admins can create a slot with: date, start time, end time, location (optional), and max volunteer count.
- `SLOT-02` — Admins can edit slot details before the schedule is finalized.
- `SLOT-03` — Admins can delete a slot; volunteers who had signed up receive a notification (email or in-app TBD).
- `SLOT-04` — Admins can bulk-create recurring slots (e.g., every Saturday at 9am for the month).

---

### 3.5 Admin — Signup Window Control

#### 3.5.1 Description
Admins control when volunteers can sign up for a given month.

#### 3.5.2 Requirements
- `WINDOW-01` — Each month has a configurable `opens_at` and `closes_at` datetime.
- `WINDOW-02` — Signups are automatically blocked outside the open window.
- `WINDOW-03` — Admins can manually open or close a window at any time.
- `WINDOW-04` — The application displays a countdown or status indicator to volunteers showing when signups open/close.

---

### 3.6 Automated Monthly Notifications

#### 3.6.1 Description
The system automatically sends magic link emails to all volunteers before each month's signup window opens, allowing one-tap access directly to the calendar.

#### 3.6.2 Requirements
- `NOTIFY-01` — A Supabase Edge Function runs on a configurable day each month (default: 25th) via pg_cron.
- `NOTIFY-02` — The Edge Function queries all active users and generates a unique magic link per user via `supabase.auth.admin.generateLink()`.
- `NOTIFY-03` — Emails are sent via Resend with a custom template that includes the user's name, the upcoming month, and their unique magic link.
- `NOTIFY-04` — Clicking the magic link logs the user in and redirects them directly to the calendar for the upcoming month.
- `NOTIFY-05` — The send day is configurable by the admin without requiring code changes (stored in `notification_config`).
- `NOTIFY-06` — The system logs each send attempt and its status (sent / failed) for admin visibility.
- `NOTIFY-07` — Admins can manually trigger a notification send outside the scheduled time if needed.

---

### 3.7 Schedule Finalization & Export

#### 3.7.1 Description
At the close of the signup window, the schedule is locked and can be exported.

#### 3.7.2 Requirements
- `EXPORT-01` — Admins can export the finalized monthly schedule as a CSV or spreadsheet.
- `EXPORT-02` — The export includes: date, time slot, location, and names of assigned volunteers.
- `EXPORT-03` — Once finalized, the schedule is viewable in read-only mode by all volunteers.
- `EXPORT-04` — Admins can re-open a finalized schedule for edits if needed.

---

## 4. Database Schema

### 4.1 `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key (from Supabase Auth) |
| `name` | text | Display name |
| `email` | text | Unique |
| `role` | enum | `volunteer` \| `admin` |
| `created_at` | timestamptz | |

### 4.2 `monthly_schedules`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `month` | int | 1–12 |
| `year` | int | |
| `is_open` | boolean | Controls signup availability |
| `opens_at` | timestamptz | |
| `closes_at` | timestamptz | |
| `is_finalized` | boolean | Locks the schedule |

### 4.3 `time_slots`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `schedule_id` | uuid | FK → `monthly_schedules` |
| `date` | date | |
| `start_time` | time | |
| `end_time` | time | |
| `location` | text | Optional |
| `max_volunteers` | int | |
| `created_at` | timestamptz | |

### 4.4 `signups`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `users` |
| `slot_id` | uuid | FK → `time_slots` |
| `signed_up_at` | timestamptz | |
| `status` | enum | `confirmed` \| `cancelled` |

### 4.5 `notification_config`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `send_day_of_month` | int | Day to trigger monthly send (default: 25) |
| `send_hour` | int | Hour of day to send (0–23, in local time) |
| `email_subject` | text | Configurable subject line template |
| `email_body` | text | Configurable body template (supports `{{name}}`, `{{month}}` variables) |
| `updated_at` | timestamptz | |
| `updated_by` | uuid | FK → `users` (admin who last edited) |

### 4.6 `notification_log`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `users` |
| `sent_at` | timestamptz | |
| `status` | enum | `sent` \| `failed` |
| `error` | text | Error message if failed |

---

## 5. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| `NFR-01` | Performance | Calendar page loads within 2 seconds on a standard connection |
| `NFR-02` | Real-time | Slot availability updates within 1 second of another user's action |
| `NFR-03` | Security | All API routes validate the user's session and role server-side |
| `NFR-04` | Accessibility | UI meets WCAG 2.1 AA standards |
| `NFR-05` | Responsiveness | Application is fully usable on mobile devices |
| `NFR-06` | Scalability | System handles up to 500 concurrent users without degradation |

---

## 6. UI / UX Design Requirements

### 6.1 Design Philosophy
The application must prioritize ease of use for a congregation that includes many older users on mobile devices. Interactions should be large, obvious, and forgiving. The mobile experience is considered the primary use case; desktop is secondary.

---

### 6.2 Visual Design Aesthetic

The application uses a **warm parchment aesthetic** — quiet, refined, and literary in character. The goal is to feel calm and trustworthy rather than clinical or corporate, appropriate for a faith community context.

#### 6.2.1 Color Palette
| Role | Token | Hex Value |
|------|-------|-----------|
| Page background | `--color-bg` | `#f4efe6` |
| Surface (cards, nav, sheets) | `--color-surface` | `#faf7f2` |
| Primary text | `--color-text` | `#1c1a17` |
| Secondary / muted text | `--color-text-muted` | `#7a6f63` |
| Tertiary text (labels, captions) | `--color-text-light` | `#5c4f40` |
| Accent (amber) | `--color-amber` | `#b8845a` |
| Amber @ 8% opacity | `--color-amber-wash` | `rgba(184,132,90,0.08)` |
| Amber @ 14% opacity | `--color-amber-tint` | `rgba(184,132,90,0.14)` |
| Border (default) | `--color-border` | `rgba(184,132,90,0.20)` |
| Border (subtle) | `--color-border-subtle` | `rgba(184,132,90,0.11)` |

The amber accent `#b8845a` is used exclusively for interactive elements (buttons, checkboxes), dot indicators, chip labels, hyperlinks, and the `&` in the logo. It is never used as a background fill for large surfaces.

#### 6.2.2 Typography
| Role | Typeface | Weight / Style | Size (mobile) |
|------|----------|----------------|---------------|
| Page titles, sheet titles, section headings | Cormorant Garamond | Light 300, italic | 24–30px |
| Logo wordmark | Cormorant Garamond | Light 300, italic | 20px |
| Month / sub-section headers | Cormorant Garamond | Regular 400, italic | 18–20px |
| Body text, slot details, labels | Lora | Regular 400 | 13–15px |
| Preset slot day names | Lora | Medium 500 | 13px |
| Captions, meta text, secondary labels | Lora | Regular 400 | 11–12px |
| Micro-labels (e.g. "YOUR SIGNUPS THIS MONTH") | Lora | Regular 400, uppercase, letter-spacing 0.07em | 11px |

Google Fonts import string: `family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Lora:wght@400;500`

Italic Cormorant Garamond is the primary typographic personality of the app and must appear on every page title, the logo, and all bottom sheet date headers.

#### 6.2.3 Surface & Border Treatment
- Cards, the preset section, and the bottom sheet all use `#faf7f2` against the `#f4efe6` page background — a gentle lift with no harsh contrast.
- Border radii: `8px` for buttons, checkboxes, chips; `10px` for cards and the preset panel; `14–16px` for the top corners of the bottom sheet only.
- All borders: `1px solid rgba(184,132,90,0.20)` — warm amber-tinted, never gray.
- Internal section dividers: `rgba(184,132,90,0.12)`.
- No drop shadows anywhere. Elevation is communicated through color difference and borders only.

#### 6.2.4 Background Grain Texture
A subtle SVG fractal noise grain is applied to the page background via a CSS `::before` pseudo-element at `opacity: 0.035`. Applied only to the outermost page background, not to surface cards.

```css
.page-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
  pointer-events: none;
}
```

#### 6.2.5 Interactive Element Specifications

**Primary Button (e.g. "Sign up")**
Background `#b8845a`, text white, border-radius `8px`, padding `6px 14px`, font Lora 13px. Hover: `#a87650`. No shadow, no separate border.

**Secondary / Ghost Button (e.g. "Cancel")**
Background transparent, border `1px solid #b8845a`, text `#b8845a`. Hover: `rgba(184,132,90,0.08)` background.

**Preset Checklist Row**
Full-width tap target minimum `48px` tall. Checkbox is `18×18px`, `border-radius: 4px`. Unchecked: white fill, `border: 1.5px solid rgba(184,132,90,0.45)`. Checked: fill `#b8845a`, white `✓` at 11px bold.

**Calendar Dot Indicator (preset signup)**
`6×6px` filled circle, `#b8845a`, centered below the day number.

**Slot Chip (one-off slot)**
Background `rgba(184,132,90,0.15)`, text `#b8845a`, `border-radius: 3px`, padding `1px 3px`, font 9px. Displays abbreviated time only (e.g. "5pm", "6:30").

**Summary Pills**
Background `rgba(184,132,90,0.12)`, border `1px solid rgba(184,132,90,0.25)`, border-radius `20px`, padding `4px 12px`, font Lora 12px, color `#5c4f40`.

**Month Navigation Buttons**
Background none, border `1px solid rgba(184,132,90,0.30)`, border-radius `8px`, padding `4px 10px`, color `#b8845a`.

#### 6.2.6 Navigation Bar
Background `#faf7f2`, `backdrop-filter: blur(4px)`, bottom border `1px solid rgba(184,132,90,0.18)`. Sticky on scroll. Logo uses italic Cormorant Garamond with the `&` in `#b8845a`. Right side shows user name and month in Lora 13px `#7a6f63`.

#### 6.2.7 Approved Reference Mockup

The approved visual reference for the mobile UI is the interactive HTML file . All implementation must match that design. It depicts: navigation bar, page header with signup window status, your-signups summary pills, month navigator, preset checklist with checked and unchecked states, the 7-column calendar grid with amber dot indicators and time chips, the dot/chip legend, and the bottom sheet day-detail view with both Sign up (primary) and Cancel (ghost) button states.

---

### 6.2 Mobile Layout (Primary)

#### 6.2.1 Overview
The mobile view uses a two-part layout inspired by the Apple Calendar mobile app: a preset slot checklist at the top followed by a full month calendar grid below. This preserves the familiar checkbox workflow volunteers already know from the existing Google Form while adding visual calendar confirmation.

#### 6.2.2 Part 1 — Preset Slot Checklist
- `MOB-01` — A collapsible checklist appears at the top of the mobile view listing all recurring time slots the admin has configured for the month (e.g. "Monday 6am–8am", "Saturday 6:30am–8:30am").
- `MOB-02` — Each checklist item is a large, full-width tappable row with a checkbox, day name, and time range — minimum 48px tap target.
- `MOB-03` — Checking a preset slot automatically signs the volunteer up for every occurrence of that slot across the entire month.
- `MOB-04` — Checking a preset visually animates the corresponding days onto the calendar below in real time, giving immediate confirmation.
- `MOB-05` — Unchecking a preset removes all associated signups from the calendar, unless any individual occurrences were manually modified (see `MOB-10`).
- `MOB-06` — Preset slots that are fully booked across all occurrences are shown as disabled in the checklist.

#### 6.2.3 Part 2 — Month Calendar Grid
- `MOB-07` — Below the checklist, a full month grid is displayed in the Apple Calendar style: day numbers in a 7-column grid, with colored dot indicators and small name/time chips on days that have signups.
- `MOB-08` — Days where the volunteer is signed up display a dot and a small truncated chip (e.g. "6am" or their first name) matching the style seen in the Apple Calendar reference.
- `MOB-09` — Tapping any day opens a bottom sheet showing the full list of slots for that day, each with a sign-up / cancel toggle.
- `MOB-10` — A volunteer can remove a single occurrence of a preset slot from the day's bottom sheet without affecting other occurrences of that preset.
- `MOB-11` — Days with signups added via preset are visually distinguished from days signed up manually (e.g. different dot color or chip style).
- `MOB-12` — Days with no available slots show no indicators and are not tappable.
- `MOB-13` — The calendar is read-only with no tappable slots when the signup window is closed.

---

### 6.3 Desktop Layout (Secondary)

- `DESK-01` — Desktop displays a traditional full month calendar grid with slots rendered as event chips inside each day cell, similar to Google Calendar's month view.
- `DESK-02` — Hovering a slot chip shows a tooltip with full details (time, location, volunteer count vs capacity).
- `DESK-03` — Clicking a slot chip signs up or cancels the volunteer with a confirmation prompt.
- `DESK-04` — The preset checklist is available on desktop as a collapsible sidebar panel or an expandable section above the calendar.
- `DESK-05` — The desktop view adapts gracefully down to tablet widths before switching to the mobile layout.

---

### 6.4 Responsive Breakpoints
| Breakpoint | Layout |
|------------|--------|
| < 768px | Mobile: checklist + dot-grid calendar |
| 768px–1024px | Tablet: desktop layout, condensed |
| > 1024px | Full desktop calendar grid |

---

### 6.5 General UX Guidelines
- `UX-01` — All interactive elements must meet a minimum tap target size of 48×48px on mobile.
- `UX-02` — Font sizes on mobile must be no smaller than 16px for body text and 14px for secondary labels.
- `UX-03` — Bottom sheets on mobile must be dismissible by tapping outside or swiping down.
- `UX-04` — Confirmation of a successful sign-up must be immediate and visible (e.g. dot appears on calendar, chip highlights) without requiring a page reload.
- `UX-05` — The application must support both light and dark mode, following the user's system preference.

---

## 7. Out of Scope (v1)

- Push / SMS notifications
- Waitlist management for full slots
- Volunteer hour tracking / reporting
- Multi-church / multi-organization support
- Offline mode

---

## 8. Open Questions

- [ ] Should volunteers receive email notifications when a slot they're signed up for is deleted or modified?
- [ ] Is there a need for a waitlist when slots reach capacity?
- [ ] Should the signup window open automatically on a schedule, or always require manual admin activation?
- [ ] What export format does the schedule coordinator prefer (CSV, Excel, Google Sheets)?
- [ ] Do volunteers need to specify any additional info when signing up (e.g., a role or task within the slot)?
- [ ] What should the magic link email template say? (subject line, tone, content)
- [ ] Should users who sign in via Google also receive the monthly magic link email, or just magic-link-only users?

### Resolved
- ~~What authentication method should be used?~~ → Google OAuth + Magic Links (passwordless)
- ~~How persistent should sessions be?~~ → 1-year session expiry with background token refresh
- ~~How should mobile UX be handled?~~ → Preset checklist + Apple Calendar-style dot grid; bottom sheet for day detail

---

*Document prepared based on initial product discussion. To be updated as requirements are clarified.*

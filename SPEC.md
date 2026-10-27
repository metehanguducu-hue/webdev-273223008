# Club Events – University Event Management System

## Project option
Club events

## Goals
- Allow students to discover and register for university club events with instant capacity tracking and confirmation.
- Allow club organizers to create, manage, and broadcast events to student members with attendance tracking.

## Non-goals
- Payment processing or ticket fee collection (all university club events are free).
- Real-time chat or direct messaging between event attendees.
- External public ticketing outside the university domain.

## Constraints
- All users must authenticate with a valid university email address.
- Event capacity is strictly enforced; overbooking is prohibited by transactional concurrency checks.

## The model feature
- Model: Google Gemini API (via `@google/genai`)
- Input: Student's past registered event categories, club memberships, and current date.
- Output: A JSON-formatted list of personalized event recommendations with short rationale text.
- When it fails: If the model provider times out (>3 seconds), returns a rate-limit error (429), or fails due to network issues, the system catches the exception, logs a warning, falls back to trending/upcoming events, and displays a friendly banner: "AI recommendations currently unavailable; showing popular events instead."

## Auth
- Local: Email and password authentication with secure password hashing (bcrypt).
- Provider: Google OAuth (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`).
- Linking: When a user signs in via Google OAuth, the system checks if an account with the same email already exists. If so, the Google identity is linked to the existing user account seamlessly.

## MCP tools
| Tool | What it does | Who may call it |
| --- | --- | --- |
| `list_club_events` | Returns a list of all upcoming university club events with current registration counts. | Any authenticated user or student |
| `register_event` | Registers the calling user for a specified event ID, checking capacity constraints. | Any student member |
| `recommend_events` | Generates AI-powered event recommendations based on user interests and attendance history. | Any authenticated student |

## UI
- Stack: Node.js, Express, SQLite, and vanilla HTML/CSS/JavaScript with responsive layout and clear states.
- Screens:
  1. **Events Dashboard:** Browse, search, and filter upcoming club events.
  2. **Event Details & Registration Screen:** View full event description, location, organizer, capacity status, and register/cancel attendance.
  3. **Organizer Management Console:** Create, update, and manage club events and view attendee lists.
  4. **Authentication Screen:** Sign in / sign up via local credentials or Google OAuth.

## Architecture
- Requests arrive via HTTP route handlers (or MCP tools) → Service Layer (contains all business rules, auth, capacity checks, and AI fallback logic) → Data Access Layer (SQL queries) → SQLite Database.
- Layering exception: MCP tools talk directly to the shared service layer, never to the database or SQL layer.

## Acceptance criteria
- [AC-1] A student who registers for an event with available free places sees a success message and a new registration row appears in the database.
- [AC-2] A student who attempts to register for an event with no free places sees "This event is full", and no new registration row appears in `registrations`.
- [AC-3] A club organizer can create a new event with title, description, date, location, and maximum capacity, which immediately appears on the events list.
- [AC-4] A student can sign up using email and password with secure password hashing.
- [AC-5] A student can sign in using Google OAuth, and if an account with the same email already exists locally, the accounts are successfully linked.
- [AC-6] An attendee can cancel their registration for an event up to 24 hours before the event start time, freeing up a spot in capacity.
- [AC-7] The AI event recommendation feature accepts student attendance history and interests, and outputs personalized event recommendations.
- [AC-8] When the AI model provider is slow (>3s), rate-limited, or down, the system catches the error, falls back to top upcoming events, and displays a non-blocking UI notification.

### Slice 1: sign-in and events dashboard

## Traceability
| Criterion | Test |
| --- | --- |
| AC-1 |  |
| AC-2 |  |
| AC-3 |  |
| AC-4 |  |
| AC-5 |  |
| AC-6 |  |
| AC-7 |  |
| AC-8 |  |

## Spec vs result
- (Will be updated after implementation slice delivery in Exercise 3.)

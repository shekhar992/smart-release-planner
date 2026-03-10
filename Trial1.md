1) Overview

Product: MeetingMate (web app)
Description: Captures meeting audio (or upload), generates transcript, summary, decisions, and action items, then shares/exports to common tools.
Target users: Knowledge workers in mid-to-large organizations who run frequent meetings.

2) Problem statement
Teams lose decisions and action items across chats, calendars, and personal notes, causing rework, missed follow-ups, and poor accountability.
3) Goals (MVP)

Reduce time spent writing/distributing notes by 50%
Increase action-item completion rate by 20%
Produce shareable, searchable meeting artifacts within 5 minutes of meeting end

4) Non-goals (MVP)

Real-time in-meeting coaching
Full project management replacement
Automatic joining of meetings as a bot (optional future)

5) Personas

Meeting Organizer (MO): runs meetings; needs fast distribution and accountability
Participant (P): wants clear decisions/actions without reading full transcript
Workspace Admin (WA): manages access, retention, and compliance

6) Key user journeys

MO connects calendar → selects meeting → records or uploads audio → gets notes → shares link.
P opens shared link → reads summary/actions → acknowledges assigned tasks.
WA configures retention + permissions → reviews audit log.

7) Functional requirements (MVP)

Authentication + workspace concept
Calendar event selection (basic integration or manual meeting creation)
Audio capture/upload
Transcription generation
AI-generated: summary, decisions, action items (with assignees + due dates)
Notes review/edit before sharing
Shareable link with permissions
Export to PDF and plain text
Notifications for assigned action items

8) Non-functional requirements

Security: encrypted in transit; role-based access; signed share links
Privacy: configurable retention; delete meeting artifacts on demand
Performance: summary ready within 5 minutes for 60-minute audio (P50)
Reliability: retries and user-visible job status for processing pipeline
Accessibility: WCAG-minded UI basics (keyboard nav, readable contrast)

9) Success metrics

Activation: % users creating first meeting note within 24 hours
Time-to-notes: median processing time end-to-ready
Share rate: % meetings shared with ≥1 participant
Action engagement: % action items acknowledged/completed
Quality: CSAT for “notes usefulness” (1–5)

10) Analytics & instrumentation
Track events:

signup_completed
calendar_connected
meeting_created
audio_uploaded
transcription_ready
summary_ready
notes_edited
notes_shared
action_assigned
action_acknowledged
export_clicked
processing_failed

11) Dependencies / assumptions

Uses a third-party transcription + LLM service (abstracted behind an internal API)
Email service for notifications
Basic calendar integration (or manual meeting creation for MVP fallback)

12) Release plan (MVP)

R1: Manual meeting + upload → transcript + summary → share + export
R2: Calendar connect + recording → action items + notifications
R3: Admin controls + retention + audit log


JIRA Backlog (11 stories)
Epic A — Core meeting artifact creation
1) [Story] Workspace signup + login

User story: As a user, I want to sign up and log in so I can access my meeting notes.
Acceptance criteria:

User can create an account and log in/out
Session persists across refresh; invalid session redirects to login
Errors are shown for invalid credentials


Priority: P0
Estimate: 5 pts
Dependencies: None

2) [Story] Create meeting (manual)

User story: As a meeting organizer, I want to create a meeting record so I can attach audio and generate notes.
Acceptance criteria:

Organizer can create meeting with title, date/time, participants (free-text emails)
Meeting appears in “My meetings” list
Organizer can open meeting details page


Priority: P0
Estimate: 3 pts
Dependencies: Story 1

3) [Story] Upload audio file to meeting

User story: As an organizer, I want to upload an audio file so it can be transcribed.
Acceptance criteria:

Supports at least one common format (e.g., MP3/WAV)
File size limit is enforced with a clear message
Upload progress and completion state are visible
Uploaded file is linked to the meeting record


Priority: P0
Estimate: 5 pts
Dependencies: Story 2

4) [Story] Processing pipeline job status

User story: As a user, I want to see processing status so I know when notes will be ready.
Acceptance criteria:

Meeting shows states: Queued, Processing, Ready, Failed
User can refresh and see updated status
“Failed” includes a user-friendly reason and retry option


Priority: P0
Estimate: 5 pts
Dependencies: Story 3

5) [Story] Generate and display transcript

User story: As a user, I want a transcript so I can reference exact wording.
Acceptance criteria:

Transcript renders on meeting page when ready
Timestamped paragraphs (at least coarse-grained, e.g., every 30–60s)
Basic search-in-transcript input filters matches


Priority: P1
Estimate: 8 pts
Dependencies: Story 4

6) [Story] Generate summary, decisions, and action items

User story: As a user, I want structured notes so I can quickly understand outcomes.
Acceptance criteria:

Meeting page shows sections: Summary, Decisions, Action Items
Each action item includes: text, assignee (optional), due date (optional)
Content is regenerated only when user explicitly requests “Regenerate”


Priority: P0
Estimate: 8 pts
Dependencies: Story 4

Epic B — Review, sharing, and export
7) [Story] Edit notes before sharing

User story: As an organizer, I want to edit generated notes so I can correct mistakes.
Acceptance criteria:

Organizer can edit summary/decisions/action items
Save creates a new “version” timestamp (simple version history list)
Non-organizers have read-only access


Priority: P0
Estimate: 5 pts
Dependencies: Story 6

8) [Story] Share meeting notes link with permissions

User story: As an organizer, I want to share notes securely so participants can access them.
Acceptance criteria:

Organizer can generate a share link
Link access modes: “Anyone with link” and “Only invited participants”
Organizer can revoke an existing link


Priority: P0
Estimate: 8 pts
Dependencies: Stories 2, 7

9) [Story] Export notes to PDF and TXT

User story: As a user, I want to export notes so I can store or send them outside the app.
Acceptance criteria:

Export includes title/date/participants + summary/decisions/actions
PDF downloads successfully; TXT downloads successfully
Export reflects latest saved edits


Priority: P1
Estimate: 3 pts
Dependencies: Story 7

Epic C — Action-item follow-through and admin controls
10) [Story] Email notifications for assigned action items

User story: As an assignee, I want an email notification so I don’t miss my tasks.
Acceptance criteria:

When an action item is assigned/updated, assignee receives an email
Email includes meeting title, action text, due date, and link
Notification failures are logged and visible to organizer as “sent/failed”


Priority: P1
Estimate: 5 pts
Dependencies: Stories 6, 8

11) [Story] Admin retention policy + delete meeting

User story: As a workspace admin, I want retention controls so we meet compliance needs.
Acceptance criteria:

Admin can set retention period (e.g., 30/90/180 days)
Admin/Organizer can delete a meeting; deleted meetings are no longer accessible
Audit record exists for delete events (who/when/what)


Priority: P1
Estimate: 8 pts
Dependencies: Stories 1, 2





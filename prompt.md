# CampusConnect --- Event Completion + AI Event Report

## Complete Implementation Task

You are working on the existing **CampusConnect** project.

Your task is to implement my complete responsibility for:

> **Stage 1 --- Event Completion**\
> **Stage 2 --- AI Event Report**

The final flow must be:

``` text
Existing Approved Event
        ↓
Event happens
        ↓
Event ends
        ↓
AWAITING_COMPLETION
        ↓
Organizer submits completion information
        ↓
Completion data saved
        ↓
Event becomes COMPLETED
        ↓
AI Event Report generation
        ↓
Gemini
        ↓
Structured Event Report
        ↓
Report stored
        ↓
Organizer/Admin can review report
```

------------------------------------------------------------------------

# ⚠️ FIRST: INSPECT THE EXISTING PROJECT

Before writing or changing code, thoroughly inspect the existing
CampusConnect architecture.

Do NOT immediately create new models, APIs, components, or services.

First identify:

### Backend

-   Existing Event model/entity
-   Event status implementation
-   Event creation APIs
-   Event approval APIs
-   Existing event controller
-   Existing event service
-   Existing database schema
-   Existing authentication
-   Existing authorization/role system
-   Existing file upload/storage system
-   Existing API conventions
-   Existing error handling
-   Existing validation system
-   Existing environment configuration

### Frontend

-   Existing event pages
-   Existing organizer dashboard
-   Existing event details page
-   Existing admin dashboard
-   Existing routing
-   Existing API service/hooks
-   Existing form components
-   Existing upload components
-   Existing notification/toast system

### AI

Check whether the project already has:

-   Gemini integration
-   Any AI service
-   AI utility
-   Gemini API configuration
-   Existing environment variables
-   Existing AI-related dependencies

------------------------------------------------------------------------

# IMPORTANT ARCHITECTURE RULE

After inspecting the project, **reuse the existing architecture wherever
possible**.

Do not create duplicate:

-   Authentication systems
-   User models
-   Event models
-   Upload systems
-   API utilities
-   Validation libraries
-   Database connections
-   UI component systems

Follow the existing project's naming conventions and folder structure.

Before implementation, briefly identify the relevant existing
files/modules and explain where each new feature should integrate.

Then implement the feature.

------------------------------------------------------------------------

# STAGE 1 --- EVENT COMPLETION

## 1. Event Lifecycle

Implement or verify this lifecycle:

``` text
UPCOMING
   ↓
ONGOING
   ↓
AWAITING_COMPLETION
   ↓
COMPLETED
```

### Meaning

### UPCOMING

Current time is before the event start.

### ONGOING

Current time is between the event start and end.

### AWAITING_COMPLETION

The event's scheduled end time has passed but completion information has
not yet been submitted.

### COMPLETED

The authorized organizer successfully submits the completion
information.

------------------------------------------------------------------------

# 2. Backend Must Be Source of Truth

Do not rely on frontend JavaScript to permanently determine event
status.

The backend must determine the effective event lifecycle using the
event's stored start/end date and time.

Do not allow users to manually submit:

``` text
status = COMPLETED
```

The completion API should transition the event to `COMPLETED` only after
valid completion data has been successfully persisted.

------------------------------------------------------------------------

# 3. Organizer Completion Form

Create an appropriate organizer-facing completion form.

The form should be available for events that are eligible for
completion.

Display the event's original information as read-only context.

Example:

``` text
EVENT COMPLETION

AI/ML Workshop

Date:
20 September 2026

Venue:
CSPIT Auditorium

Organizer:
CSI Student Chapter
```

Then ask for actual completion information.

------------------------------------------------------------------------

# 4. Completion Fields

Implement the following:

### Actual Attendance

Required.

Use a numeric field.

Validation:

-   Must be an integer.
-   Must not be negative.
-   Should have a reasonable upper bound according to the existing
    project/business rules.

This represents **actual attendance**, not planned attendance.

------------------------------------------------------------------------

### Key Highlights

Allow the organizer to describe what actually happened.

This can be a multiline text field.

Do not invent or modify the information automatically.

------------------------------------------------------------------------

### Winners / Achievements

Allow the organizer to provide:

-   Winners
-   Awards
-   Achievements
-   Competition results

This must also support events where there are no winners.

For example:

``` text
No winners / Not applicable
```

should be valid.

------------------------------------------------------------------------

### Special Guests

Support zero or multiple special guests.

Example:

``` text
Dr. ABC
Director, XYZ Technologies

Prof. XYZ
Head of Department
```

Do not require a guest for every event.

------------------------------------------------------------------------

### Event Outcomes

Allow the organizer to describe the actual outcomes of the event.

Example:

``` text
Students gained practical exposure to machine learning...
```

------------------------------------------------------------------------

### Event Photos

Allow uploading multiple event photos.

These are **completion photos**, not the original event poster.

Example:

``` text
completion photos
├── photo-1.jpg
├── photo-2.jpg
├── photo-3.jpg
└── photo-4.jpg
```

Reuse the existing project file-upload/storage architecture.

Do not store binary files directly inside the database unless the
existing architecture already does so.

------------------------------------------------------------------------

# 5. Keep Original Event Data Separate

Do NOT overwrite the original event information.

The system must distinguish:

``` text
ORIGINAL EVENT
"What was planned?"
```

from:

``` text
EVENT COMPLETION
"What actually happened?"
```

For example:

### Original Event

``` text
Expected Attendance: 200
Venue: Auditorium
Date: 20 Sept
```

### Completion

``` text
Actual Attendance: 184
Actual Highlights: ...
Actual Guests: ...
Actual Outcomes: ...
Photos: ...
```

The original event remains unchanged.

------------------------------------------------------------------------

# 6. EventCompletion Model

Prefer a separate model/entity:

``` text
Event
   │
   └── EventCompletion
```

Inspect the existing Event schema first and create relationships using
its existing ID conventions.

The completion entity should contain appropriate fields such as:

``` text
id
event_id
actual_attendance
key_highlights
winners_achievements
special_guests
event_outcomes
photos
submitted_by
submitted_at
updated_at
```

Adapt naming/types to the existing database conventions.

------------------------------------------------------------------------

# 7. Completion API

Create REST APIs following the project's existing API conventions.

At minimum, support:

### Get completion eligibility/details

``` text
GET /events/:eventId/completion
```

### Submit completion

``` text
POST /events/:eventId/completion
```

If the existing project uses different route conventions, follow those
instead.

------------------------------------------------------------------------

# 8. Authentication

Completion APIs must require authentication.

A guest/random user must not be able to submit completion information.

------------------------------------------------------------------------

# 9. Organizer Authorization

Only the appropriate organizer/authorized user should be allowed to
submit completion data.

Use the existing CampusConnect user/event ownership/role architecture.

For example, if the event belongs to:

``` text
created_by = User123
```

User123 should be authorized to submit completion.

Do not create a new authorization system if the project already has one.

Admins may also be allowed if the existing permission architecture
supports it.

------------------------------------------------------------------------

# 10. Duplicate Submission Protection

An event should not accidentally receive multiple completion records.

Prevent:

``` text
Event
 ├── Completion #1
 ├── Completion #2
 └── Completion #3
```

unless the existing business logic explicitly supports revisions.

The backend must enforce this.

Do not rely only on frontend button disabling.

------------------------------------------------------------------------

# 11. Completion Validation

Validate all incoming data on the backend.

At minimum:

### Attendance

``` text
integer
>= 0
```

### Text fields

Validate appropriate length limits.

### Photos

Validate:

-   File type
-   File size
-   Number of files
-   Upload result

Use the existing project's limits where available.

------------------------------------------------------------------------

# 12. Transaction / Data Integrity

The following operation should be reliable:

``` text
Save Completion
      ↓
Mark Event COMPLETED
```

Do not end up with:

``` text
Completion saved
Event still incorrectly marked AWAITING_COMPLETION
```

or:

``` text
Event COMPLETED
Completion record missing
```

Use the existing database transaction mechanism where appropriate.

------------------------------------------------------------------------

# STAGE 2 --- AI EVENT REPORT

Once Stage 1 is reliable, implement the AI reporting pipeline.

------------------------------------------------------------------------

# 13. AI Architecture

DO NOT call Gemini directly from the controller.

Required architecture:

``` text
Controller
     ↓
Event Report Service
     ↓
Gemini Service
     ↓
Gemini API
```

### Controller

Responsible for:

-   Authentication
-   Authorization
-   Request handling
-   Calling the service
-   Returning response

### Event Report Service

Responsible for:

-   Loading Event
-   Loading EventCompletion
-   Preparing verified data
-   Building the report-generation request
-   Saving the generated report
-   Handling report lifecycle

### Gemini Service

Responsible for:

-   Gemini API communication
-   Prompt/model configuration
-   Structured response handling
-   AI-specific error handling

Keep Gemini-specific code isolated from normal business logic.

------------------------------------------------------------------------

# 14. Gemini Configuration

Inspect the existing environment configuration.

If Gemini is not already configured, add the required environment
variable using the project's existing configuration pattern.

Never hard-code:

``` text
API keys
secrets
tokens
```

into source code.

Do not commit secrets.

------------------------------------------------------------------------

# 15. AI INPUT

Gemini must receive:

``` text
Original Event Data
+
Event Completion Data
```

For example:

``` text
ORIGINAL EVENT

Title:
AI/ML Workshop

Category:
Technical

Department:
CSPIT

Date:
20 September 2026

Venue:
Auditorium

Original Description:
...

ORGANIZER COMPLETION

Actual Attendance:
184

Key Highlights:
...

Winners/Achievements:
...

Special Guests:
...

Event Outcomes:
...
```

------------------------------------------------------------------------

# 16. CRITICAL AI RULE --- NO FABRICATION

Gemini must only use information provided by the verified
event/completion data.

The AI must NOT invent:

-   Attendance
-   Guests
-   Winners
-   Achievements
-   Outcomes
-   Event activities
-   Statistics
-   Dates
-   Locations
-   Organizations
-   Quotes
-   Any other event facts

If information is missing, the AI must explicitly handle the missing
information rather than making something up.

For example:

``` text
Special Guests:
Not provided
```

is acceptable.

The AI must NOT generate:

``` text
The event was attended by several industry experts...
```

unless such information actually exists in the supplied data.

------------------------------------------------------------------------

# 17. AI Prompt Design

Create a dedicated prompt/template inside the Event Report Service or
appropriate AI layer.

The prompt should clearly tell Gemini:

1.  It is generating a formal event report.
2.  The supplied event/completion information is the only source of
    truth.
3.  It must not invent facts.
4.  Missing information must not be fabricated.
5.  The response must follow the required JSON schema.
6.  The report should be professional and suitable for CampusConnect.

Do not put business logic directly inside the controller.

------------------------------------------------------------------------

# 18. Structured AI Response

Prefer structured JSON rather than raw generated text.

Expected conceptual structure:

``` json
{
  "eventOverview": "...",
  "participationSummary": "...",
  "keyHighlights": [
    "...",
    "..."
  ],
  "achievements": [
    "..."
  ],
  "eventOutcomes": [
    "..."
  ],
  "conclusion": "..."
}
```

Use the project's existing validation/schema system if available.

The backend must validate the AI response before storing it.

Do not blindly save arbitrary Gemini output.

------------------------------------------------------------------------

# 19. Required Report Sections

The generated report must contain:

### Event Overview

What the event was, based only on the original event information.

### Participation Summary

Actual participation/attendance based on completion data.

### Key Highlights

Based only on organizer-provided highlights.

### Achievements

Based only on organizer-provided winners/achievements.

### Event Outcomes

Based only on organizer-provided outcomes.

### Conclusion

A professional conclusion derived from the verified information.

------------------------------------------------------------------------

# 20. EventReport Model

Create a separate:

``` text
EventReport
```

Relationship:

``` text
Event
   ↓
EventCompletion
   ↓
EventReport
```

The report should be linked to the relevant event and completion record.

Conceptual fields:

``` text
id
event_id
completion_id
report_data
generation_status
generated_at
created_at
updated_at
```

Adapt this to the existing database conventions.

------------------------------------------------------------------------

# 21. AI Report Generation Status

Implement a reliable report-generation lifecycle.

For example:

``` text
NOT_GENERATED
     ↓
GENERATING
     ↓
GENERATED
```

If Gemini fails:

``` text
GENERATING
     ↓
FAILED
```

The exact enum names can follow the project's conventions.

------------------------------------------------------------------------

# 22. IMPORTANT --- Gemini Failure Must NOT Lose Completion

This is mandatory.

Suppose:

``` text
Organizer submits completion
        ↓
Completion saved successfully
        ↓
Event = COMPLETED
        ↓
Gemini API fails
```

The completion information must remain saved.

The event must remain:

``` text
COMPLETED
```

Only the report generation should be considered failed.

For example:

``` text
Event
COMPLETED

Completion
SAVED

AI Report
FAILED
```

------------------------------------------------------------------------

# 23. Retry AI Generation

AI report generation must be retryable.

If Gemini temporarily fails:

``` text
[Retry Report Generation]
```

should be possible through the appropriate backend/API flow.

Do not require the organizer to submit the completion form again.

The completion data already exists.

------------------------------------------------------------------------

# 24. Idempotency

Avoid generating duplicate reports accidentally.

For example, repeated clicks should not create:

``` text
Report #1
Report #2
Report #3
Report #4
```

for the same completion unless the system explicitly supports report
versions.

Use the existing report if one has already been successfully generated.

------------------------------------------------------------------------

# 25. Organizer Report View

After completion, the organizer should be able to see the report status.

Example:

``` text
AI EVENT REPORT

Status:
Generating...
```

Then:

``` text
AI EVENT REPORT

Status:
Generated ✓

Event Overview
...

Participation Summary
...

Key Highlights
...

Achievements
...

Event Outcomes
...

Conclusion
...
```

If generation fails:

``` text
AI EVENT REPORT

Status:
Generation Failed

[Retry Report Generation]
```

Do not expose raw Gemini errors/API keys/internal stack traces to the
user.

------------------------------------------------------------------------

# 26. Completion Page

After submitting completion:

``` text
Completion Submitted Successfully ✓

Event Status:
COMPLETED

AI Event Report:
Generating...
```

Then allow the organizer to view the generated report.

------------------------------------------------------------------------

# 27. API Error Handling

Handle:

-   Unauthorized user
-   Forbidden user
-   Event not found
-   Event not eligible for completion
-   Completion already exists
-   Invalid completion data
-   File upload failure
-   Gemini API timeout
-   Gemini API rate limit
-   Invalid Gemini response
-   Database failure

Return appropriate HTTP status codes and user-friendly error messages
following the existing project's conventions.

------------------------------------------------------------------------

# 28. Do Not Couple Completion to Gemini

The completion process must work independently of AI.

This is critical.

Correct:

``` text
POST completion
       ↓
Completion saved
       ↓
Event completed
       ↓
Generate report
```

Incorrect:

``` text
POST completion
       ↓
Call Gemini
       ↓
If Gemini succeeds → save completion
```

Never make the completion database operation dependent on Gemini
availability.

------------------------------------------------------------------------

# 29. UI Integration

Use the existing CampusConnect design system.

Do not create a completely different visual style.

Add:

### Organizer Event Dashboard

Show relevant events with statuses:

``` text
UPCOMING
ONGOING
AWAITING COMPLETION
COMPLETED
```

For an awaiting event:

``` text
[Complete Event]
```

For a completed event:

``` text
[View Completion]
[View AI Report]
```

------------------------------------------------------------------------

# 30. Event Details

The original event information should remain clearly separated from
completion information.

Example:

``` text
EVENT DETAILS

Original Event Information
──────────────────────────
Event Name
Date
Venue
Organizer
Description
Poster


EVENT COMPLETION
──────────────────────────
Actual Attendance
Key Highlights
Winners
Special Guests
Outcomes
Event Photos


AI EVENT REPORT
──────────────────────────
Generated Report
```

This separation should be obvious in the UI.

------------------------------------------------------------------------

# 31. Testing

Do not finish implementation without testing the complete workflow.

## Test 1 --- Normal Event

``` text
Create Event
      ↓
Approve Event
      ↓
Event reaches end time
      ↓
AWAITING_COMPLETION
      ↓
Organizer submits completion
      ↓
COMPLETED
      ↓
Gemini generates report
      ↓
Report stored
      ↓
Organizer views report
```

------------------------------------------------------------------------

## Test 2 --- Unauthorized User

Attempt completion using another user.

Expected:

``` text
403 Forbidden
```

------------------------------------------------------------------------

## Test 3 --- Duplicate Completion

Submit completion twice.

Expected:

``` text
Second submission rejected
```

No duplicate completion record.

------------------------------------------------------------------------

## Test 4 --- Gemini Failure

Simulate Gemini failure.

Expected:

``` text
Completion = SAVED
Event = COMPLETED
Report = FAILED
```

Then retry.

Expected:

``` text
Report = GENERATED
```

------------------------------------------------------------------------

## Test 5 --- Missing AI Information

Completion contains:

``` text
Special Guests = empty
Winners = empty
```

Gemini must not invent either.

------------------------------------------------------------------------

## Test 6 --- Multiple Photos

Upload several completion photos and verify:

-   Upload succeeds.
-   References are stored.
-   Photos can be viewed.
-   Completion remains associated with the event.

------------------------------------------------------------------------

# 32. Final Acceptance Criteria

The implementation is complete only when all of the following work:

### Event lifecycle

-   [ ] UPCOMING works.
-   [ ] ONGOING works.
-   [ ] AWAITING_COMPLETION works.
-   [ ] COMPLETED works.
-   [ ] Backend is the source of truth.

### Completion

-   [ ] Organizer can see eligible events.
-   [ ] Organizer can submit completion.
-   [ ] Attendance is stored.
-   [ ] Highlights are stored.
-   [ ] Winners/achievements are stored.
-   [ ] Guests are stored.
-   [ ] Outcomes are stored.
-   [ ] Photos are stored.
-   [ ] Duplicate submissions are prevented.
-   [ ] Authorization works.
-   [ ] Validation works.

### AI

-   [ ] Controller does not directly call Gemini.
-   [ ] Event Report Service exists.
-   [ ] Gemini Service exists.
-   [ ] Original Event + Completion data is supplied to Gemini.
-   [ ] AI is explicitly prevented from fabricating facts.
-   [ ] Structured JSON is generated.
-   [ ] AI response is validated.
-   [ ] EventReport is stored.
-   [ ] Report is linked to Event and Completion.
-   [ ] Gemini failures are handled.
-   [ ] Completion data survives AI failures.
-   [ ] AI generation can be retried.
-   [ ] Duplicate report generation is prevented.

### UI

-   [ ] Organizer can submit completion.
-   [ ] Organizer can see completion status.
-   [ ] Organizer can see AI report generation status.
-   [ ] Organizer can view the final report.
-   [ ] Existing CampusConnect UI/design is preserved.
-   [ ] No unrelated features are broken.

------------------------------------------------------------------------

# FINAL INSTRUCTION TO THE AGENT

Work in this order:

``` text
PHASE 0
Inspect existing architecture
        ↓
PHASE 1
Implement/verify Event lifecycle
        ↓
PHASE 2
Implement EventCompletion model
        ↓
PHASE 3
Implement Completion APIs
        ↓
PHASE 4
Implement Organizer Completion UI
        ↓
PHASE 5
Test complete completion pipeline
        ↓
PHASE 6
Implement EventReport model
        ↓
PHASE 7
Implement EventReport Service
        ↓
PHASE 8
Implement Gemini Service
        ↓
PHASE 9
Generate structured AI report
        ↓
PHASE 10
Store EventReport
        ↓
PHASE 11
Implement retry/error handling
        ↓
PHASE 12
Implement Organizer Report UI
        ↓
PHASE 13
Run end-to-end tests
```

**Do not rewrite working parts of CampusConnect. Do not introduce
unnecessary libraries or infrastructure. Reuse the existing architecture
wherever possible.**

At the end, provide a concise implementation report containing:

1.  Files created.
2.  Files modified.
3.  Database/model changes.
4.  New API endpoints.
5.  Frontend routes/components added.
6.  Gemini integration details.
7.  Tests performed and their results.
8.  Any assumptions or issues that still require manual attention.

The final result must be a **working end-to-end Event Completion →
Gemini → AI Event Report → Report Storage pipeline**, not merely a UI
prototype.

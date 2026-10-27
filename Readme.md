# n8n-nodes-inwendo-erp

An [n8n](https://n8n.io/) community node package for [vynst (inwendo ERP)](https://vynst.de/), the
management software for clubs, associations and organizations by [inwendo](https://www.inwendo.de/).
Read, create and update ERP data from n8n workflows, start workflows on ERP events (entity changes,
timed booking events, door openings, check-ins) and offer locks of a workflow to the ERP.

## Features

- **vynst (inwendo ERP)** action node with 23 resources: CRM, tickets (with SLA state), time, billing,
  bookings and events, inventory loans, shift plan, volunteer hours and helper shifts, membership
  pauses, general meetings, occupancy, usage counters, notifications (push to the vynst app,
  e-mail, SMS, …), smart locks, webhooks and a generic API request. Usable as a tool by AI agents.
- **vynst (inwendo ERP) Trigger**: starts a workflow when an entity is created, updated or deleted, and on
  **timed booking events** (lead time before a booking, start, end, lag time after it). The ERP
  webhook is registered and removed automatically.
- **vynst (inwendo ERP) Lock Trigger**: locks of a workflow (relay, Shelly, …) become ERP smart locks that
  members open with the ERP's access rules.
- [Workflow templates](#workflow-templates) to import: ticket from e-mail or form, new booking to
  Slack / Teams, overdue inventory loans, access outside a booking, monthly usage counter report,
  reminder before a booking.
- Functions that are switched off in the ERP fail with a message that names the ERP setting to
  enable.

## Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Credentials](#credentials)
- [API token scopes](#api-token-scopes)
- [ERP settings (feature switches)](#erp-settings-feature-switches)
- [Action node](#action-node)
- [Trigger](#trigger)
- [Lock Trigger](#lock-trigger)
- [Workflow templates](#workflow-templates)
- [Development and tests](#development-and-tests)
- [Releases](#releases)
- [API endpoints](#api-endpoints)

## Requirements

- n8n 1.85 or newer (for `NodeConnectionTypes`), including n8n 2.x; built against n8n-workflow 2.x
- An inwendo ERP with the `/api/n8n/*` endpoints (`N8nWebhookController`) for the trigger's
  auto-registration and the lock trigger. Older ERPs work with a manually created webhook
  ([Manual setup](#manual-setup-advanced)).
- Timed booking events and the occupancy need an ERP that ships them (see
  [ERP settings](#erp-settings-feature-switches)).

The package uses the `httpRequestWithAuthentication` helper (the `request`-based helpers are
deprecated and rejected by the community node linter) and is published with npm provenance, which
n8n requires for verified community nodes.

## Installation

### In n8n (community node)

1. Go to **Settings → Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-inwendo-erp`
4. Agree to the risks and click **Install**

The nodes appear as *vynst (inwendo ERP)*, *vynst (inwendo ERP) Trigger* and
*vynst (inwendo ERP) Lock Trigger*. Search for "vynst" or "inwendo" in the nodes panel.

### Self-hosted without the UI

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-inwendo-erp
# restart n8n
```

### Local development

```bash
git clone https://github.com/inwendo/n8n-nodes-inwendo-erp.git
cd n8n-nodes-inwendo-erp
npm ci
npm run build
npm link
cd /path/to/n8n
npm link n8n-nodes-inwendo-erp
```

## Credentials

Create a **Vynst (Inwendo ERP) API** credential:

- **ERP Host URL**: the base URL of your ERP instance (e.g. `https://demo.iw-erp.de`)
- **API Token (JWT)**: an API access token of the ERP

Create the token in the ERP under **Settings → API Access Tokens → Create**. n8n checks it with
`GET /api/base/api_access_token_test?mode=info` when you save the credential. The token is sent in
the `x-iw-jwt-token` header; every request also carries `X-IW-Trigger-Source: n8n`, so changes made
by a workflow do not fire the n8n webhooks again (no trigger loop).

| Token setting | Value | Why |
|---|---|---|
| **Scopes** | see [API token scopes](#api-token-scopes) | per resource |
| **Expiration** | long-lived | the node has no refresh flow; an expired token breaks the webhook registration at the next activation |
| **URL path restriction** *(optional)* | e.g. `/api/n8n/.*` | least privilege; a prefix ends with `.*`, `*` alone is no wildcard |

## API token scopes

Grant the scopes of the resources a workflow uses. *Read* is enough for Get / Get Many, the other
operations need *Write* (create) or *Edit* (change).

| Resource / node | Scopes |
|---|---|
| Company, Person | CRM |
| Project | CRM, CRM Project |
| Ticket | Ticket and Own Ticket; with the CRM Project scope a ticket needs a Project ID |
| Time Entry | Time |
| Invoice, Offer | Billing |
| Booking, Event, Event Sign-Up | Event, Event Booking |
| Inventory Loan | Event Booking (Read; Edit for hand over, return, extend) |
| Occupancy | Location (Read) |
| Usage Counter | Maintenance (Read; Edit for Update Value) |
| Shift Plan Entry | a token of a user: Get Own, Clock In / Out for the token's own shifts; Get Many, Get Coverage for shift planners (time rights or team lead) |
| Volunteer Hour Entry, Helper Shift | CRM |
| Membership Pause | CRM (Read; Edit for Decide) |
| General Meeting | CRM (Read; Edit for Check In) |
| Notification | Notification (Write) plus Read on the recipients (CRM for persons / companies, Event for sign-ups); Get Own Notifications needs a token of a user |
| News Article | Media |
| Webhook (action node) | Webhook and **Allow admin functions** |
| Smart Lock: Check Access, Unlock, Lock, Status; Lock Trigger | Event (Write) |
| Smart Lock: Get, Get Many, Get Log | Event and **Allow super admin functions** |
| inwendo ERP Trigger (auto-registration) | Webhook (Write) |

When the ERP rejects a request, the node error shows the ERP's error code and message
(`X-IW-ERROR-CODE` / `X-IW-ERROR-JSON`).

## ERP settings (feature switches)

Several functions are off until they are switched on in the ERP (**Settings**). While a setting is
off the ERP answers *feature disabled* (HTTP 400 with `X-IW-ERROR-CODE: 404` and
`X-IW-ERROR-JSON: ["feature disabled: <setting>"]`, older functions with their own code); the node
then fails with

> inwendo ERP: this function is switched off (ERP setting "&lt;setting&gt;")

| Function | ERP setting |
|---|---|
| Timed booking events (trigger) | `integration_booking_timed_events_enabled` |
| Occupancy | `integration_occupancy_api_enabled` |
| `webhook_data` summary of door openings and check-ins | `integration_ha_access_events_enabled` |
| Inventory Loan | `event_inventory_enabled` |
| Shift Plan Entry | `shift_planning_enabled`; Clock In / Out also `shift_clocking_enabled` |
| Volunteer Hour Entry, Helper Shift | `volunteer_hours_enabled` |
| General Meeting | `inwendo_crm_general_meeting_enabled` |
| Ticket SLA fields | `customer_panel_ticket_sla_enabled` (without it tickets have no `sla`) |

## Action node

| Resource | Operations |
|---|---|
| Booking | Get, Get Many, Create, Update |
| Company | Get, Get Many, Create, Update |
| Event | Get, Get Many, Create, Update |
| Event Sign-Up | Get, Get Many, Create, Update |
| General Meeting | Get, Get Many, Get Participants, Check In |
| Generic API Request | any method on any ERP endpoint |
| Helper Shift | Get, Get Many, Create, Assign Person, Get Assignments, Set Assignment Status |
| Inventory Loan | Get, Get Many, Hand Over, Return, Extend, Get Stock, Get Availability |
| Invoice | Get, Get Many, Create, Get PDF |
| Membership Pause | Get, Get Many, Decide |
| News Article | Get, Get Many, Create, Update |
| Notification | Send, Get Many Mass Notifications, Get Own Notifications |
| Occupancy | Get |
| Offer | Get, Get Many, Create, Get PDF |
| Person | Get, Get Many, Create, Update |
| Project | Get, Get Many, Create, Update |
| Shift Plan Entry | Get Own, Get Many, Get, Get Coverage, Clock In, Clock Out |
| Smart Lock | Check Access, Unlock, Lock, Status, Get, Get Many, Get Log |
| Ticket | Get, Get Many (with SLA filter), Create, Update |
| Time Entry | Get, Get Many, Create, Update |
| Usage Counter | Get, Get Many, Update Value |
| Volunteer Hour Entry | Get, Get Many, Create, Approve, Reject |
| Webhook | Get, Get Many, Create, Update |

General rules:

- **Get Many** has *Return All* (reads every page) or *Limit*.
- **Update** uses `PATCH`, so fields you do not set keep their value.
- Date fields take n8n dates or expressions; for ERP form fields the local time is used
  (`2026-10-11T18:00:00+02:00` → `2026-10-11 18:00:00`).
- Every operation returns one item per ERP object; *Continue On Fail* returns `{ "error": … }`.

### CRM, billing, bookings, events, news, webhooks

Classic CRUD on the ERP entities. Invoices and offers cannot be changed through the API once
created; creating one needs the IDs of an accounting type, a tax, a payment goal (and for invoices
a payment type) plus the buyer name. **Get PDF** returns the PDF as binary data (`data` property).

### Ticket

Create, update and read tickets. With the ERP's service levels (`customer_panel_ticket_sla_enabled`)
**Get** and **Get Many** add the SLA state of a ticket at the top level:

| Field | Meaning |
|---|---|
| `sla_first_response_status`, `sla_resolution_status` | `open`, `warning` (most of the time used), `breached`, `met`, `missed` |
| `sla_first_response_due`, `sla_resolution_due` | due date (ISO 8601) |
| `sla_first_response_done_at`, `sla_resolution_done_at` | when it was met, or `null` |

**SLA Status** on Get Many keeps only tickets whose first response or resolution has one of the
selected states (applied to the fetched tickets; use *Return All* to scan all of them).

### Inventory Loan

Lending of inventory items (Inventar-Ausleihe; setting `event_inventory_enabled`).

- **Get Many**: filters *State* (`LENT`, `RETURNED`, **`OVERDUE`** = lent and past the due date),
  item (bookable), booking, person, deposit state. Default order: most urgent due date first.
- **Hand Over**: creates the loan from a booking (item and borrower come from the booking); optional
  quantity, due date (default: end of the booking), deposit (default: deposit of the item × quantity),
  condition, note, *Ignore Stock Check*.
- **Return**: condition, retained part of the deposit, note, return time.
- **Extend**: new due date (*Ignore Stock Check* when the item is needed elsewhere).
- **Get Stock**: every item with stock, lent, overdue and free pieces right now.
- **Get Availability**: free pieces of one item between two dates (`{ bookable_id, quantity, used, available }`).

Loans carry `person_minimal`, `bookable_minimal`, `booking_minimal`, `bookable_name`, `due_at`, `state`, `overdue`.

### Shift Plan Entry

The shift plan of the time tracking (`shift_planning_enabled`).

- **Get Own**: the published shifts of the token's user (filter *Start From*), with the clocking state.
- **Get Many**: the planner's list incl. drafts (start date from / until, planning group, person, status).
- **Get Coverage**: required versus planned staff per day (from / until, at most 62 days; planning
  group or organization).
- **Clock In / Clock Out**: start or end the work time of an own shift of today with the real time
  (`shift_clocking_enabled`); returns the work time entry.

### Volunteer Hour Entry and Helper Shift

Volunteer hours of members (`volunteer_hours_enabled`).

- **Volunteer Hour Entry**: Get Many (person, status `pending` / `approved` / `rejected`, event),
  Get, **Create** (person, work date, minutes, description, event; approved at once), **Approve**,
  **Reject** (reason shown to the member).
- **Helper Shift** (Helferdienste): Get Many, Get, **Create** (name, start, end, required helpers,
  credited minutes, sign-up deadline, location, event), **Assign Person**, **Get Assignments**,
  **Set Assignment Status** (`attended` credits the shift, `no_show` / `cancelled` remove the credit).

### Membership Pause

Requested membership pauses: Get Many (status `REQUESTED`, `APPROVED`, `DECLINED`, `WITHDRAWN`,
person), Get, **Decide** (approve: the pause is written into the membership; decline; optional
comment for the member).

### General Meeting

General meetings (Mitgliederversammlung, `inwendo_crm_general_meeting_enabled`): Get Many (state),
Get (with statistics), **Get Participants** (attendance filter) and **Check In**: sets the
attendance of a member — *On Site*, *Online* or *Absent* (check out). The node finds the participant
of the meeting by the person ID, so a check-in desk or QR scanner workflow only needs both IDs.

### Occupancy

**Get** (`integration_occupancy_api_enabled`) returns one item per bookable (all, or the given IDs):

```json
{ "id": 7, "name": "Halle 1", "location_id": 2, "location_name": "Sportzentrum",
  "occupied": true, "pre_start_active": false, "post_end_active": false,
  "pre_start_minutes": 30, "post_end_minutes": 15,
  "current_booking": { "id": 123, "title": "Training U12", "start": "…", "end": "…", "participants": 14 },
  "next_booking": null,
  "opening_hours": { "open_now": true, "next_open": null, "next_close": "…" },
  "generated_at": "2026-10-11T17:59:30+02:00" }
```

Use it for heating, lights, door signs or to check a door opening against the bookings.

### Usage Counter

Meters of bookables (electricity, water, operating hours): Get Many (filter bookable), Get and
**Update Value** (the new reading, e.g. from a smart meter). Counters fed by real usage data are
calculated by the ERP.

### Notification

**Send** creates an ERP mass notification: one notification per recipient — person, company, event
sign-up or membership — with title, message (Twig placeholders such as `{{ person.firstName }}`
work), optional HTML text or ERP template, and the channels **Push (vynst app)**, E-Mail, SMS,
WhatsApp, Letter. Every notification also appears in the app's notification list. The ERP sends
them in the background. **Get Many Mass Notifications** lists the sent ones, **Get Own
Notifications** the notifications of the token's own user.

### Smart Lock

**Check Access** asks the ERP whether a credential a reader read (barcode, QR or RFID passed on by
the workflow) may open a smart lock: the QR code the app shows for the lock, the QR code of the
digital member card or the RFID / chip card number stored at the person. The ERP checks with the
rules of the app (super admin, self service rights, bookable, employment contract, booking ±1 h)
and writes the smart lock log (source `n8n`). The plain member number is not accepted, it can be
guessed. Answer:

```json
{ "granted": true, "reason": "granted", "credential_type": "card",
  "smart_lock": { "id": 12, "name": "Haupteingang" },
  "person": { "id": 345, "name": "Erika Mustermann" }, "opened": null }
```

`reason` for a denial: `unknown_credential`, `no_access`, `invalid_code`, `code_expired`. With
**Open When Granted** the ERP opens a lock of another provider (Nuki, LOQED, Home Assistant)
itself. **Unlock / Lock / Status** act with the rights of the token's user (like the app);
**Get, Get Many, Get Log** need a token with super admin functions.

### Generic API Request

Any method on any ERP endpoint, with query parameters and a JSON body, for everything the
resources do not cover yet.

## Trigger

Starts the workflow on ERP events. Pick an **Entity Type** and an **Action**:

| Entity type | ERP class |
|---|---|
| All, Booking, Company, Event, Event Sign-Up, Invoice, News Article, Offer, Person, Project, Ticket, Time Entry | the classic entities |
| Inventory Loan | `EventInventoryLoan` |
| Smart Lock Log (Access) | `SmartLockLog` — every door opening / denial |
| Check-In (Attendance List Entry) | `AttendanceListEntry` |
| Shift (Shift Plan Entry) | `ShiftPlanEntry` |
| Volunteer Hour Entry | `VolunteerHourEntry` |
| Helper Shift Assignment | `VolunteerShiftAssignment` |
| Membership Pause | `MembershipPauseRequest` |
| General Meeting Participant | `GeneralMeetingParticipant` (response, check-in) |
| Usage Counter | `BaseBookableUsageCounter` |

Actions: *All*, *Create*, *Update*, *Delete* and the timed booking events below.

### Timed booking events

| Action | When |
|---|---|
| Booking: Pre-Start (Lead Time) | the lead time before a booking starts |
| Booking: Start | a booking starts |
| Booking: End | a booking ends |
| Booking: Post-End | the lag time after a booking ended |
| Booking: All Timed Events | all four |

The trigger registers with `database_action` `booking_pre_start`, `booking_start`, `booking_end`,
`booking_post_end` or `booking_timed` and `reference_class_name` `BaseBooking`. Timed events need
the ERP setting `integration_booking_timed_events_enabled`; they are only sent to webhooks that ask
for them (a trigger on *All* actions does not get them). The ERP checks every minute, so an event
can arrive 1–2 minutes late, never twice; cancelled and deleted bookings are skipped. Lead and lag
time come from the bookable's addon data `automation_pre_start_minutes` /
`automation_post_end_minutes`, else from the settings
`integration_booking_timed_events_pre_start_minutes` (30) / `…_post_end_minutes` (15).
**Bookable IDs** limits the trigger to some bookables.

The fields of the timed event are at the top level of the item, the booking is in `data`:

```json
{ "type": "booking_start", "due_at": "2026-10-11T18:00:00+02:00",
  "booking_id": 123, "booking_title": "Training U12",
  "start": "2026-10-11T18:00:00+02:00", "end": "2026-10-11T19:30:00+02:00",
  "bookable_id": 7, "bookable_name": "Halle 1", "location_id": 2, "location_name": "Sportzentrum",
  "participants": 14, "pre_start_minutes": 30, "post_end_minutes": 15,
  "iw_action": "booking_start", "iw_entity_class": "Inwendo\\EventBundle\\Entity\\BaseBooking",
  "iw_entity_short_class": "booking", "iw_entity_id": 123, "iw_dt": 1760131200,
  "iw_timed_event": { … }, "data": { …booking… } }
```

### Door openings and check-ins

Webhooks of *Smart Lock Log* and *Check-In* carry a `webhook_data` summary (with
`integration_ha_access_events_enabled`); the trigger puts its fields at the top level too:

```json
{ "type": "access", "smart_lock_id": 4, "smart_lock_name": "Haupteingang", "action": "unlock",
  "success": true, "person_id": 55, "person_name": "Max Mustermann", "source": "app", "at": "…" }
{ "type": "check_in", "attendance_list_id": 9, "attendance_list_name": "Fitnessstudio",
  "person_id": 55, "person_name": "Max Mustermann", "checked_in": true, "at": "…" }
```

Smart lock log actions are `unlock`, `lock`, `access_code`, `access_denied`, `status`; delete
events carry no `webhook_data`.

### Webhook payload

Every other event:

```json
{
  "iw_entity_class": "Inwendo\\CRMBundle\\Entity\\CRMCompany",
  "iw_entity_short_class": "CRMCompany",
  "iw_entity_id": "123",
  "iw_action": "update",
  "iw_dt": 1709500000,
  "data": { … }
}
```

The trigger filters on the class name of `iw_entity_class` (without namespace) and on `iw_action`.
Envelope fields are never overwritten by the summaries.

### Auto-registration

With **Auto Register Webhook in ERP** (default) activating the workflow

- calls `POST /api/n8n/webhook` to register (or update) a `RegisteredWebhook` with
  `notificationClientId = 'n8n'`, n8n's production webhook URL, the entity type and the action;
- generates a random token (unless you set **Webhook Token**) and keeps it with the workflow;
  incoming requests are validated against the `X-IW-Webhook-Token` header.

Deactivating calls `DELETE /api/n8n/webhook` with the same URL. The registration is idempotent on
`(webhook_url, notificationClientId = 'n8n')`: changing entity type, action or token and
re-activating updates the row in place. Needs scope Webhook (Write). When timed events are switched
off the activation fails with a message naming `integration_booking_timed_events_enabled`; an ERP
that does not know timed events yet is reported as such.

### Manual setup (advanced)

For older ERPs, or when several workflows share one ERP webhook, switch **Auto Register Webhook in
ERP** off and create the `RegisteredWebhook` in the ERP yourself:

- `notificationType`: `HTTP_POST`
- `notificationUrl`: the **Production Webhook URL** of the trigger node
- `referenceClassName`: entity to watch (e.g. `CRMCompany`, `BaseBooking` for timed events)
- `databaseAction`: `create`, `update`, `delete` or a timed action (`booking_start`, …)
- optionally `notificationClientToken`, with the same value in the trigger's **Webhook Token**

## Lock Trigger

Locks of an n8n workflow become ERP smart locks, so the ERP can open them:

1. Add the trigger, list the locks (Lock ID, name in the ERP, *In the app*: open button or QR code)
   and activate the workflow. The trigger registers its locks with its **production webhook URL**
   at `/api/n8n/smart_lock/register` (instance id and secret are generated once and kept in the
   workflow).
2. In the ERP open the smart lock connection (provider n8n) and run **Sync devices**; grant access
   to the smart locks as usual.
3. When a user with access taps *open* in the app (or through the API / Home Assistant), the ERP
   posts a signed command; the workflow gets `command` (`open` / `lock`), `lock_id`, `lock_name`,
   `smart_lock_id` and switches the relay, Shelly, … .

Commands are signed with HMAC-SHA256 of the instance secret (`X-IW-Signature`), carry a timestamp
and a nonce and are rejected when they are older than 60 seconds (plus 30 seconds clock difference)
or replayed. *Result*: report success when the command arrives, or answer with the last node (first
item with `success: true / false`, optionally `state`). n8n must be reachable via **https** (the ERP
rejects private addresses); test webhook URLs are not registered. Deactivating the workflow removes
the locks from the ERP (the smart locks stay and come back with the next activation). In queue mode
with several webhook processes the replay protection is per process. Token scope: Event (Write).

## Workflow templates

Importable workflows in [`templates/`](templates) (also shipped in the npm package). In n8n:
**Workflows → Import from File** (or paste the JSON), then select the credentials, adapt the
channels / IDs named in the sticky note and activate.

| Template | What it does | Needs |
|---|---|---|
| [ticket-from-email-or-form.json](templates/ticket-from-email-or-form.json) | IMAP e-mails and an n8n form become ERP tickets | IMAP credential; scope Ticket |
| [new-booking-to-slack-or-teams.json](templates/new-booking-to-slack-or-teams.json) | message in Slack (or Teams) for every new booking | Slack / Teams credential; scope Webhook |
| [overdue-inventory-loan-reminder.json](templates/overdue-inventory-loan-reminder.json) | every morning a push + e-mail to borrowers of overdue loans | `event_inventory_enabled`; scopes Event Booking, Notification, CRM |
| [access-outside-booking-warning.json](templates/access-outside-booking-warning.json) | warns in Slack when a door is opened while no booking (nor lead / lag time) runs | `integration_occupancy_api_enabled`, `integration_ha_access_events_enabled`; scopes Webhook, Location |
| [monthly-usage-counter-report.json](templates/monthly-usage-counter-report.json) | CSV of all usage counters by e-mail on the first of the month | SMTP credential; scope Maintenance |
| [reminder-before-booking-start.json](templates/reminder-before-booking-start.json) | Slack message (and optional push to caretakers) the lead time before every booking | `integration_booking_timed_events_enabled`; scope Webhook (+ Notification) |

## Development and tests

```bash
npm ci
npm run lint        # n8n-node lint (the rules n8n checks for verified community nodes)
npm run build       # n8n-node build (tsc + icons)
npm run dev         # n8n-node dev: starts a local n8n with these nodes and rebuilds on change
npm test            # build + offline unit tests (test/unit)
npm run test:e2e    # build + end-to-end tests against a live ERP (test/e2e)
```

The **unit tests** run without an ERP: request helpers and pagination, error and *feature
disabled* messages, the requests of every resource, the trigger (registration, timed events,
filters, output), the lock trigger's registration and signatures, and the workflow templates.

The **end-to-end tests** run the compiled nodes against a real ERP (every CRUD resource, the
credential test, the trigger registration incl. every entity type and timed events, the read
operations of the new resources). Without the variables they are skipped:

```bash
IW_E2E_ERP_HOST=https://erp.example.com IW_E2E_ERP_TOKEN=<jwt> npm run test:e2e
```

The token needs the scopes above plus "Allow admin functions". Set `IW_E2E_PDF=1` if the instance
can render PDFs and `IW_E2E_SMART_LOCK_ID` to a smart lock for the access check. Functions whose ERP
setting is off pass when the node names the setting.

Layout: `nodes/InwendoErp/InwendoErp.node.ts` (action node, CRUD resources),
`ResourceActions.ts` (the action resources), `descriptions/` (parameters per resource),
`GenericFunctions.ts` (requests, pagination, errors), `InwendoErpTrigger.node.ts`,
`InwendoErpLockTrigger.node.ts` + `LockProtocol.ts`, `credentials/`, `templates/`, `test/`.

## Releases

Releases are published to npm only from GitHub Actions with an
[npm provenance](https://docs.npmjs.com/generating-provenance-statements) statement, as n8n requires
for verified community nodes. Run `npm run release` locally: it lints, builds, asks for the version,
updates the changelog, commits, tags and pushes. The tag starts `.github/workflows/publish.yml`,
which publishes the package (npm Trusted Publishing, or an `NPM_TOKEN` secret as fallback).

## API endpoints

| Resource | API path |
|---|---|
| Company | `/api/crm/crmcompanies` |
| Person | `/api/crm/crmpeople` |
| Project | `/api/crm/crmprojects` |
| Ticket | `/api/crm/tickets` |
| Time Entry | `/api/time/entries` |
| Invoice | `/api/invoice/invoices` |
| Offer | `/api/invoice/offers` |
| Booking | `/api/event/base_booking` |
| Event | `/api/event/base_event` |
| Event Sign-Up | `/api/event/base_event_signup` |
| News Article | `/api/media/news_article` |
| Webhook | `/api/dw/webhook` |
| Inventory Loan | `/api/event/inventory_loan` (+ `/{id}/return`, `/{id}/extend`), `/api/event/inventory_loan_stock`, `/api/event/inventory_loan_availability/{bookableId}` |
| Shift Plan Entry | `/api/time/shift_plan_entry` (+ `/own`, `/coverage`, `/{id}/clock_in`, `/{id}/clock_out`) |
| Volunteer Hour Entry | `/api/time/volunteer_hour_entry` (+ `/{id}/approve`, `/{id}/reject`) |
| Helper Shift | `/api/time/volunteer_shift`, `/api/time/volunteer_shift_assignment` |
| Membership Pause | `/api/crm/membership_pause_request` (+ `/{id}/decide`) |
| General Meeting | `/api/crm/general_meeting`, `/api/crm/general_meeting_participant` |
| Occupancy | `/api/event/bookable_occupancy` |
| Usage Counter | `/api/event/base_bookable_usage_counter` |
| Notification | `/api/notification/mass_notification`, `/api/notification/user_notification` |
| Smart Lock | `/api/event/smart_lock`, `/api/event/smart_lock_log`, `/api/n8n/smart_lock/check_access` |
| Trigger | `/api/n8n/webhook` (POST / DELETE) |
| Lock Trigger | `/api/n8n/smart_lock/register` (POST / DELETE) |

## License

MIT

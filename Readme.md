# n8n-nodes-inwendo-erp

This is an [n8n](https://n8n.io/) community node package for integrating with the [inwendo ERP](https://www.inwendo.de/) system.

It provides nodes to read, create, and update ERP data from n8n workflows, and a trigger node to receive webhook events from the ERP.

## Nodes

### inwendo ERP (Action Node)

Perform CRUD operations on the following ERP resources:

| Resource | Operations |
|----------|-----------|
| Company | Get, Get Many, Create, Update (PATCH) |
| Person | Get, Get Many, Create, Update (PATCH) |
| Invoice | Get, Get Many, Create, Get PDF (binary) |
| Offer | Get, Get Many, Create, Get PDF (binary) |
| Ticket | Get, Get Many, Create, Update (PATCH) |
| Project | Get, Get Many, Create, Update (PATCH) |
| Time Entry | Get, Get Many, Create, Update (PATCH) |
| Booking | Get, Get Many, Create, Update (PATCH) |
| Event | Get, Get Many, Create, Update (PATCH) |
| Event Sign-Up | Get, Get Many, Create, Update (PATCH) |
| News Article | Get, Get Many, Create, Update (PATCH) |
| Webhook | Get, Get Many, Create, Update (PATCH) |
| Smart Lock | Check Access, Unlock, Lock, Status, Get, Get Many, Get Log |
| Generic API Request | Custom HTTP request to any ERP endpoint |

Updates always use `PATCH`, so fields you do not set keep their value.
Invoices and offers cannot be changed through the API once created; creating
one needs the IDs of an accounting type, a tax, a payment goal (and for
invoices a payment type) plus the buyer name. **Get PDF** returns the PDF as
binary data (`data` property).

The action node can also be used as a tool by AI agents (`usableAsTool`).

**Smart Lock → Check Access** asks the ERP whether a credential a reader read
(barcode, QR or RFID passed on by the workflow) may open a smart lock:
the QR code the app shows for the lock, the QR code of the digital member card
or the RFID / chip card number stored at the person. The ERP checks with the
rules of the app (super admin, self service rights, bookable, employment
contract, booking ±1 h) and writes the smart lock log (source `n8n`). The plain
member number is not accepted, it can be guessed. Answer:

```json
{ "granted": true, "reason": "granted", "credential_type": "card",
  "smart_lock": { "id": 12, "name": "Haupteingang" },
  "person": { "id": 345, "name": "Erika Mustermann" }, "opened": null }
```

`reason` for a denial: `unknown_credential`, `no_access`, `invalid_code`,
`code_expired`. With **Open When Granted** the ERP opens a lock of another
provider (Nuki, LOQED, Home Assistant) itself. **Unlock / Lock / Status** act
with the rights of the token's user (like the app); **Get, Get Many, Get Log**
need a token with super admin functions.

### inwendo ERP Lock Trigger

Locks of an n8n workflow become ERP smart locks, so the ERP can open them:

1. Add the trigger, list the locks (Lock ID, name in the ERP, *In the app*:
   open button or QR code) and activate the workflow. The trigger registers its
   locks with its **production webhook URL** at `/api/n8n/smart_lock/register`
   (instance id and secret are generated once and kept in the workflow).
2. In the ERP open the smart lock connection (provider n8n) and run **Sync
   devices**; grant access to the smart locks as usual.
3. When a user with access taps *open* in the app (or through the API / Home
   Assistant), the ERP posts a signed command; the workflow gets
   `command` (`open` / `lock`), `lock_id`, `lock_name`, `smart_lock_id` and
   switches the relay, Shelly, … .

Commands are signed with HMAC-SHA256 of the instance secret
(`X-IW-Signature`), carry a timestamp and a nonce and are rejected when they
are older than 60 seconds (plus 30 seconds clock difference) or replayed.
*Result*: report success when the command arrives, or answer with the last
node (first item with `success: true / false`, optionally `state`). n8n must be
reachable via **https** (the ERP rejects private addresses); test webhook URLs
are not registered. Deactivating the workflow removes the locks from the ERP
(the smart locks stay and come back with the next activation). In queue mode
with several webhook processes the replay protection is per process.

### inwendo ERP Trigger

Receives webhook events from the ERP when entities are created, updated, or deleted. Supports filtering by entity type and action, and automatically registers/removes the matching webhook in the ERP when the workflow is activated/deactivated.

## Credentials

You need an inwendo ERP API token (JWT) to authenticate. Configure:

- **ERP Host URL**: The base URL of your ERP instance (e.g., `https://demo.iw-erp.de`)
- **API Token (JWT)**: Your API access token

The token can be validated via the `/api/base/api_access_token_test?mode=info` endpoint.

### JWT API Token Requirements

When creating the API access token in the ERP (**Settings → API Access Tokens
→ Create**), use these settings:

| Setting | Required value | Why |
|---|---|---|
| **Scope → Webhook** | **Write** | `POST` and `DELETE` on `/api/n8n/webhook` are annotated `userAccessType=Write`. |
| **Expiration** | Long-lived | The plugin has no refresh flow, so a short TTL will silently break webhook registration on the next activation. |
| **URL path restriction** *(optional hardening)* | `/api/n8n/webhook` | Least-privilege — auto-registration only calls this exact path (`POST` and `DELETE`). A prefix is written with a trailing `.*` (e.g. `/api/n8n/.*`); `*` alone is not a wildcard. |

> **ERP version:** auto-registration requires an ERP build that ships the
> dedicated `N8nWebhookController` (`/api/n8n/webhook`). Older installations
> still need to use the manual setup path below.

Those requirements apply only to the **auto-registration** feature of the
Trigger node. If the same credential is also used by the **action node** to
read or write data (e.g. `/api/crm/crmcompanies`, `/api/invoice/invoices`,
…), grant the corresponding per-resource scopes in addition to Webhook — that
is unrelated to webhook auto-registration:

| Resource | Scopes |
|---|---|
| Company, Person | CRM |
| Project | CRM, CRM Project |
| Ticket | Ticket and Own Ticket; with the CRM Project scope a ticket needs a Project ID |
| Time Entry | Time |
| Invoice, Offer | Billing |
| Booking, Event, Event Sign-Up | Event, Event Booking |
| News Article | Media |
| Webhook (action node) | Webhook and **Allow admin functions** |
| Smart Lock: Check Access, Lock Trigger | Event (Write) |
| Smart Lock: Get, Get Many, Get Log | Event and **Allow super admin functions** |

When the ERP rejects a request, the node error shows the ERP's error code and
message (`X-IW-ERROR-CODE` / `X-IW-ERROR-JSON`).

If your ERP build is too old (no `/api/n8n/webhook`) or you simply prefer to
manage the webhook yourself, switch **Auto Register Webhook in ERP** off on
the Trigger node and create the `RegisteredWebhook` in the ERP UI manually
(see [Manual setup](#manual-setup-advanced) below). In that mode the token
only needs the scopes for the resources the action node actually calls.

## Compatibility

Requires n8n 1.85 or newer (for `NodeConnectionTypes`), including n8n 2.x;
built against n8n-workflow 2.x. The package uses the
`httpRequestWithAuthentication` helper (the `request`-based helpers are
deprecated and rejected by the community node linter) and is published with
npm provenance, which n8n requires for verified community nodes.

## Installation

### In n8n (Community Node)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-inwendo-erp`
4. Agree to the risks and click **Install**

### Local Development

```bash
# Clone the repository
git clone https://github.com/inwendo/n8n-nodes-inwendo-erp.git
cd n8n-nodes-inwendo-erp

# Install dependencies
npm install

# Build
npm run build

# Link to your local n8n installation
npm link
cd /path/to/n8n
npm link n8n-nodes-inwendo-erp
```

## Setting Up Webhooks (ERP -> n8n)

To trigger n8n workflows from ERP events:

1. Add an **inwendo ERP Trigger** node to your workflow
2. Pick the **Entity Type** and **Action** you want to listen for
3. Select or create an **inwendo ERP API** credential on the trigger node
4. Activate the workflow

With **Auto Register Webhook in ERP** enabled (the default), activating the
workflow will:

- call `POST /api/n8n/webhook` on the ERP to register (or update) a
  `RegisteredWebhook` row scoped to `notificationClientId = 'n8n'`,
  pointing at n8n's production webhook URL and filtered by the selected
  entity type and action
- generate a random `notificationClientToken` (if you did not set one
  manually) and persist it with the workflow so that incoming requests are
  always validated against the `X-IW-Webhook-Token` header

Deactivating the workflow calls `DELETE /api/n8n/webhook` with the same
`webhook_url`, which soft-deletes every matching `n8n`-owned row so it no
longer fires.

The `POST /api/n8n/webhook` endpoint is **idempotent** on
`(webhook_url, notificationClientId = 'n8n')`: if you edit the trigger's
entity type, action, or webhook token and re-activate, the existing row is
updated in place instead of creating a duplicate.

> **ERP version:** this flow requires an ERP build that ships the
> dedicated `N8nWebhookController` (`/api/n8n/webhook`). Older installations
> do not support auto-registration and must use the manual setup below with
> **Auto Register Webhook in ERP** disabled on the trigger.

### Manual setup (advanced)

If you prefer to manage the webhook yourself (for example because multiple
workflows share a single ERP webhook), switch **Auto Register Webhook in
ERP** off on the trigger node. Then create a `RegisteredWebhook` in the ERP
manually, either via the API or the admin UI:

- `notificationType`: `HTTP_POST`
- `notificationUrl`: The **Production Webhook URL** shown on the trigger node
- `referenceClassName`: Entity to watch (e.g., `CRMCompany`)
- `databaseAction`: `create`, `update`, or `delete`
- Optionally set `notificationClientToken` and configure the same value in
  the trigger node's **Webhook Token** field

### Webhook Payload Format

The ERP sends the following JSON payload:

```json
{
  "iw_entity_class": "Inwendo\\CRMBundle\\Entity\\CRMCompany",
  "iw_entity_short_class": "CRMCompany",
  "iw_entity_id": "123",
  "iw_action": "update",
  "iw_dt": 1709500000,
  "data": { ... }
}
```

## Tests

End-to-end tests run the compiled nodes against a real ERP instance (every
operation of every resource, the credential test and the trigger's webhook
registration). Without the variables they are skipped.

```bash
IW_E2E_ERP_HOST=https://erp.example.com IW_E2E_ERP_TOKEN=<jwt> npm run test:e2e
```

The token needs the scopes listed above plus "Allow admin functions". Set
`IW_E2E_PDF=1` if the instance can render PDFs and `IW_E2E_SMART_LOCK_ID` to a
smart lock for the access check. `npm test` runs offline tests, among them the
lock trigger's registration and signature checks.

## API Endpoints

| Resource | API Path |
|----------|----------|
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
| Smart Lock | `/api/event/smart_lock`, `/api/event/smart_lock_log`, `/api/n8n/smart_lock/check_access` |
| Lock Trigger | `/api/n8n/smart_lock/register` (POST / DELETE) |

## License

MIT

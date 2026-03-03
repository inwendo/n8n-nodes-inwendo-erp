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
| Invoice | Get, Get Many, Create, Update, Get PDF |
| Offer | Get, Get Many, Create, Update, Get PDF |
| Ticket | Get, Get Many, Create, Update (PATCH) |
| Project | Get, Get Many, Create, Update (PATCH) |
| Time Entry | Get, Get Many, Create, Update (PATCH) |
| Booking | Get, Get Many, Create, Update (PATCH) |
| Event | Get, Get Many, Create, Update (PATCH) |
| Event Sign-Up | Get, Get Many, Create, Update (PATCH) |
| News Article | Get, Get Many, Create, Update (PATCH) |
| Webhook | Get, Get Many, Create, Update |
| Generic API Request | Custom HTTP request to any ERP endpoint |

### inwendo ERP Trigger

Receives webhook events from the ERP when entities are created, updated, or deleted. Supports filtering by entity type and action.

## Credentials

You need an inwendo ERP API token (JWT) to authenticate. Configure:

- **ERP Host URL**: The base URL of your ERP instance (e.g., `https://demo.iw-erp.de`)
- **API Token (JWT)**: Your API access token

The token can be validated via the `/api/base/api_access_token_test?mode=info` endpoint.

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
2. Activate the workflow and copy the **Production Webhook URL**
3. In the ERP, create a `RegisteredWebhook` via the API or admin UI:
   - `notificationType`: `HTTP_POST`
   - `notificationUrl`: Paste the n8n webhook URL
   - `referenceClassName`: Entity to watch (e.g., `CRMCompany`)
   - `databaseAction`: `create`, `update`, or `delete`
   - Optionally set `notificationClientToken` and configure the same token in the n8n trigger node

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

## License

MIT

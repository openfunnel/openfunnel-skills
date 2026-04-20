---
name: live-view-alert-webhooks
description: Consume OpenFunnel live view alert webhooks by running a public HTTPS listener, verifying signed webhook requests, parsing saved-view insight payloads, and processing alerts safely. Use when the user wants a bot to receive or act on live view alerts via webhook.
---

# Live View Alert Webhooks

Use this skill when working with OpenFunnel live view alerts delivered by webhook.

In the backend, these alerts are implemented as saved-view webhooks. A webhook fires when new timeline insights match a saved view that has webhook delivery enabled.

## What This Skill Should Do

When asked to use live view alerts, the bot should assume that OpenFunnel is the sender and the bot's system is the receiver.

The bot should help the user do these things:

1. Stand up an always-on server that can receive webhook POST requests.
2. Expose a public HTTPS endpoint reachable from the internet.
3. Verify the webhook signature on production deliveries.
4. Parse the webhook payload and process the alert data.
5. Acknowledge quickly with a `2xx` response after the event is durably accepted.
6. Avoid polling or expecting OpenFunnel to hold messages for later pickup.

## Required Setup

The receiving system must have:

- An always-on server. This cannot be a script that runs occasionally or a local dev process that is usually offline.
- A public HTTPS URL. OpenFunnel rejects non-HTTPS URLs and URLs pointing to localhost, loopback, or private/internal addresses.
- A stable webhook route such as `/webhooks/openfunnel/live-view-alerts`.
- A way to store the webhook signing secret securely.
- A queue, background worker, or async job system if processing is more than trivial.

Do not tell the user to use localhost as the final destination. Local tunnels can be used temporarily for testing, but production must be a real public HTTPS endpoint.

## Delivery Behavior

Assume the webhook is sent immediately when new insights match the saved view.

Production webhook behavior:

- Method: `POST`
- Content type: `application/json`
- Headers:
  - `X-OpenFunnel-Signature`
  - `X-OpenFunnel-Timestamp`
  - `User-Agent: OpenFunnel-Webhook/1.0`
- Timeout: about 10 seconds per attempt
- Redirects: not followed
- Retries: up to 3 attempts with exponential backoff (`1s`, `2s`, `4s`)
- Retries happen on:
  - connection errors
  - network errors
  - timeouts
  - `5xx` responses
- Retries do not happen on `4xx` responses

This means:

- Return `2xx` once the event has been safely accepted.
- Return `5xx` for temporary failures if you want OpenFunnel to retry.
- Avoid returning `4xx` for transient issues because that stops retries.

## Signature Verification

Production webhook requests are signed with HMAC-SHA256.

Verify the signature using:

- secret: the webhook secret generated when the webhook was configured
- timestamp: the `X-OpenFunnel-Timestamp` header
- raw body: the exact raw request bytes, not re-serialized JSON

The signature input is:

`{timestamp}.{raw_body}`

The expected signature format is:

`sha256=<hex_digest>`

The bot must verify against the raw request body exactly as received. Do not parse JSON and then stringify it again before verifying.

Pseudo-logic:

1. Read `X-OpenFunnel-Timestamp`
2. Read `X-OpenFunnel-Signature`
3. Read raw request body bytes
4. Compute HMAC-SHA256 over `timestamp + "." + raw_body`
5. Compare using constant-time comparison
6. Reject the request if the signature does not match

## Payload Shape

The webhook body is JSON with this structure:

```json
{
  "event_type": "insights.new",
  "event_timestamp": "2026-02-19T14:30:00.000Z",
  "view": {
    "id": "123",
    "name": "Enterprise Accounts"
  },
  "summary": {
    "total_insights": 3,
    "total_accounts": 2
  },
  "accounts": [
    {
      "account_id": 1,
      "account_name": "Acme Corp",
      "account_domain": "acme.com",
      "insights": [
        {
          "alert_text": "New VP of Engineering hired from competitor",
          "alert_type": "openfunnel",
          "alert_date": "2026-02-19",
          "sentiment": "positive",
          "discovered_signal_id": 1001
        }
      ]
    }
  ]
}
```

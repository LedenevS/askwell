# Integrations

## Slack
Connect Slack from Settings → Integrations. Once connected you can send alerts and weekly digests to any channel the Nimbus app is invited to. Use `/nimbus` in Slack to look up a metric, for example `/nimbus signups last 7 days`.

## Email digests
Every member can subscribe to a Monday-morning digest for any dashboard. Digests are sent at 8:00 in the workspace time zone and include the top movers of the week. Digests are available on Growth and Scale.

## Webhooks
Alerts can call a webhook with a JSON payload describing the metric, the current value, the threshold and a link to the chart. Webhooks retry up to five times with exponential backoff. Payloads are signed with an HMAC-SHA256 signature in the `X-Nimbus-Signature` header.

## Warehouse export (Scale)
Nimbus can sync raw events hourly to BigQuery, Snowflake or Amazon Redshift. Set it up from Settings → Integrations → Warehouse. The first sync backfills the full retention window.

## Segment and Rudderstack
Nimbus is a supported destination in both Segment and Rudderstack. Add Nimbus as a destination and paste your project write key; no code changes are needed.

## Google Tag Manager
Install the web snippet as a Custom HTML tag firing on All Pages.

## API
The REST API lets you query aggregated metrics, manage alerts and import historical events. Authenticate with an API key from Settings → API keys. Rate limit: 600 requests per minute per key. Full reference at docs.nimbus.example/api.

## Not currently supported
Nimbus does not have a native Zapier integration or a HubSpot integration yet. Webhooks cover most automation use cases in the meantime.

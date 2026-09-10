# Getting started with Nimbus

Nimbus is a product analytics tool that turns your event stream into dashboards, alerts and weekly digests without SQL.

## 1. Create a workspace
Sign up at app.nimbus.example with your work email. The first person from a company domain becomes the workspace owner. Everyone else who signs up with the same domain can request to join, and the owner approves them from Settings → Members.

## 2. Install the tracking snippet
Go to Settings → Data sources → Web and copy the snippet. Paste it before the closing `</head>` tag of every page you want to track. The snippet is about 4 KB, loads asynchronously and does not block rendering.

For single-page apps, call `nimbus.page()` on every route change so page views are recorded correctly.

We also ship official SDKs for iOS (Swift Package Manager), Android (Gradle), Node.js and Python. Server-side SDKs use a secret write key that you can rotate at any time from Settings → Data sources.

## 3. Send your first event
```js
nimbus.track("Signed Up", { plan: "trial", source: "landing" });
```
Events appear in the Live view within about five seconds. Event names are case-sensitive and limited to 64 characters. Properties can be strings, numbers, booleans or ISO-8601 dates.

## 4. Build a dashboard
Open Dashboards → New dashboard, then add charts by choosing an event, a breakdown property and a date range. Charts update automatically as new data arrives. You can pin a dashboard to the sidebar and share it with a public read-only link.

## 5. Set up your first alert
Alerts watch a metric and notify you when it crosses a threshold or changes unexpectedly. Choose Slack, email or a webhook as the destination. Most teams start with an alert on daily sign-ups and one on checkout errors.

## Common questions
**How long until data shows up?** Live events appear in about five seconds. Aggregated charts refresh every minute.

**Can I import historical data?** Yes. Use the Import API or upload a CSV under Settings → Data sources → Import. Imports of up to 50 million events are free; larger imports are handled by our support team.

**Does Nimbus work with Google Tag Manager?** Yes — add the snippet as a Custom HTML tag that fires on All Pages.

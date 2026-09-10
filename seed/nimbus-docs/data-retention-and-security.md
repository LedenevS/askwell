# Data retention, privacy and security

## Retention
How long Nimbus keeps your raw events depends on your plan:
- Free: 30 days
- Growth: 12 months
- Scale: 3 years

Aggregated dashboard data (daily totals) is kept for the life of the workspace on every plan. When raw events expire they are deleted permanently within 7 days and cannot be recovered.

You can shorten retention for a project under Settings → Privacy if you need to keep less data than your plan allows.

## Deleting data
- **Delete a single user's data**: Settings → Privacy → Delete user, enter the user ID or email. Deletion completes within 24 hours and is logged.
- **Delete a project**: Settings → Projects → Delete. This is irreversible after a 7-day grace period during which the owner can restore it.
- **Delete a workspace**: contact support from the owner's email address. All data is removed within 30 days.

## Where data is stored
Nimbus runs on Google Cloud. Customers choose a data region when they create a workspace: **United States (Iowa)** or **European Union (Belgium)**. Data never leaves the chosen region, including backups.

## Security
- All traffic is encrypted in transit with TLS 1.2 or higher and at rest with AES-256.
- Nimbus is SOC 2 Type II certified. The report is available under NDA from your account manager or by emailing security@nimbus.example.
- Two-factor authentication is available to every user and can be enforced workspace-wide by an owner.
- SSO (SAML 2.0) and SCIM provisioning are available on the Scale plan.
- We run automated backups every hour and retain them for 30 days.

## GDPR and DPA
Nimbus acts as a data processor. A Data Processing Agreement is available for every plan — download it from Settings → Legal, sign it electronically and it is countersigned automatically. We support data subject access requests through the Delete user and Export user tools.

## Cookies
The web snippet sets one first-party cookie, `_nb_id`, that expires after 12 months. You can switch to cookieless mode (session-only identifiers) under Settings → Privacy; this reduces retention accuracy across sessions but requires no consent banner in most jurisdictions.

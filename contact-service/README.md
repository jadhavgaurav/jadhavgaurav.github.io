# Contact email service

Deploy this directory as a separate Vercel project with Framework Preset **Other**, Node.js 24, and no build command. The portfolio remains on GitHub Pages. `api/contact.js` accepts Web Request objects through Vercel's documented fetch export. No npm dependencies are required.

## Activate

1. Verify `iamgaurav.online` and sender `hello@iamgaurav.online`, named **Gaurav Jadhav**, in Brevo. Transactional sending must be active.
   If Brevo IP security is enabled, authorize the backend's outbound addresses too. Authorizing a developer's local IP does not authorize a hosted endpoint. Vercel's default outbound addresses can change; use an appropriate fixed-egress setup or another host with a fixed IP rather than assuming one observed address is permanent. Do not disable IP security as part of deployment without an explicit decision by the account owner.
2. Set `BREVO_API_KEY`, `CONTACT_TO_EMAIL`, and `ALLOWED_ORIGINS` in the service's production environment. Never put credentials in `contact-config.js` or commit an environment file.
3. Before enabling email, configure a Vercel WAF rate-limit rule for POST requests to `/api/contact`: **5 requests per IP per 10 minutes**, deny when exceeded. This applies across server instances. CORS, honeypots, and minimum completion time are supplementary checks, not substitutes for rate limiting. Additional bot protection can be added if abuse appears.
4. Set `CONTACT_ENABLED=true` and deploy. Put the public production URL ending in `/api/contact` into the portfolio's `contact-config.js`.
5. Test one real submission with an inbox you control. Confirm the owner notification and visitor thank-you arrive, reply to the thank-you, then verify the deployed rate-limit rule. An API acceptance does not guarantee inbox delivery.

The endpoint validates and bounds inputs, escapes user content in the owner email, rejects unknown origins, keeps API errors and credentials out of browser responses, and sends both emails as a single Brevo batch. Automatic replies contain fixed content, not a copy of the visitor's message. The owner notification includes a mailto link for replying to the visitor; the thank-you replies to hello@iamgaurav.online. No marketing contact is created. Submission bodies are not logged or stored by this code, though Brevo and the host apply their own retention policies.

Brevo's batch idempotency key suppresses duplicate sends for 30 minutes. The browser reuses the submission ID for an unchanged retry; the backend binds it to the message content. The service returns success only after Brevo accepts both message versions or confirms the matching batch was already accepted. Delivery failures after API acceptance require Brevo logs/webhooks to diagnose.

`npm test` runs validation, email-content, failure, and retry checks with a fake transport. It sends no real email.

References: [Brevo batch sending](https://developers.brevo.com/docs/batch-send-transactional-emails), [Brevo idempotency](https://developers.brevo.com/docs/heterogenous-versions-batch-emails), [Vercel Web API functions](https://vercel.com/docs/functions/runtimes/node-js), [Vercel rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting).

The Brevo key can also be stored as the repository's GitHub Actions secret `BREVO_API_KEY`. That is suitable for an explicitly configured deployment workflow; GitHub Pages cannot read Actions secrets at runtime. Never inject it into the public JavaScript during a Pages build. `.vercelignore` excludes local environment files from backend source uploads.

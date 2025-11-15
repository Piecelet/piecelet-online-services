<svelte:head>
  <title>Privacy Policy - Piecelet Connect</title>
  <meta
    name="description"
    content="Privacy Policy for Piecelet Connect, describing how we collect, use, and protect your data when you connect NeoDB accounts."
  />
</svelte:head>

<div class="bg-[var(--bg)]">
  <div class="mx-auto w-full max-w-3xl px-6 py-12">
    <h1 class="mb-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--text)]">
      Privacy Policy – Piecelet Connect
    </h1>
    <p class="mb-8 text-xs text-[var(--muted)]">Effective date: 15 November 2025</p>

    <section class="space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <p>
        This Privacy Policy explains how Piecelet Connect (“we”, “us”, or “our”) collects, uses, stores, and protects
        information when you use the Piecelet Connect online service (the “Service”), including when you connect your
        NeoDB accounts.
      </p>
      <p>
        This Privacy Policy applies only to Piecelet Connect. The Piecelet apps you install on iOS, macOS, or other
        platforms are covered by the
        <a href="https://piecelet.app/privacy/" target="_blank" rel="noreferrer">Piecelet Privacy Policy</a>
        published on the main Piecelet website.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">1. Data controller</h2>
      <p>
        For Piecelet Connect, the data controller is the maintainer(s) of the Piecelet project operating the
        <code>piecelet-online-services</code> infrastructure. You can reach us using the contact information described
        in the “Contact us” section below.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">
        2. Relationship with Piecelet app and NeoDB instances
      </h2>
      <p>
        2.1 Piecelet Connect is an optional online service. You can use the Piecelet app without using Piecelet
        Connect, and you can use Piecelet Connect with other clients.
      </p>
      <p>
        2.2 This Privacy Policy does not apply to the Piecelet app itself or to any NeoDB instance you connect to.
        Each NeoDB instance is operated by its own provider, under its own terms and privacy policies. We do not
        control or operate NeoDB instances.
      </p>
      <p>
        2.3 When you authorize Piecelet Connect on a NeoDB instance, you create a direct authorization relationship
        between yourself and that instance. Piecelet Connect acts as a technical intermediary that uses the access
        tokens you grant to perform limited actions on your behalf.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">3. Information we collect</h2>
      <p>
        We collect and process the minimum information needed to operate Piecelet Connect securely and reliably.
        Depending on how you use the Service, this may include:
      </p>

      <h3 class="text-sm font-semibold text-[var(--text)]">3.1 Account and profile information</h3>
      <ul class="ml-5 list-disc space-y-2">
        <li>
          Identifiers: an internal user ID, the external account handle from NeoDB (for example
          <code>@username@instance</code>), and the account ID returned by the instance.
        </li>
        <li>
          Contact details: the email address provided by the NeoDB instance, where available, and your display name.
        </li>
        <li>
          Profile data: optional avatar URL and username, as provided by the NeoDB instance.
        </li>
      </ul>

      <h3 class="text-sm font-semibold text-[var(--text)]">3.2 Authentication and session data</h3>
      <ul class="ml-5 list-disc space-y-2">
        <li>
          Session records: session ID, session token, creation and expiration timestamps, and an internal user
          reference.
        </li>
        <li>
          Device and network metadata: IP address, user agent string (browser or client information), and limited
          geolocation metadata derived from Cloudflare’s edge network, such as timezone, city, country, region,
          region code, data center (colo), and approximate latitude/longitude based on network routing.
        </li>
        <li>
          Cookies: authentication cookies used to keep you signed in across requests and sub‑domains.
        </li>
      </ul>

      <h3 class="text-sm font-semibold text-[var(--text)]">3.3 NeoDB OAuth data</h3>
      <ul class="ml-5 list-disc space-y-2">
        <li>
          OAuth tokens: access tokens and, where provided by the instance, refresh tokens and token scopes. Tokens are
          associated with the NeoDB instance you chose and with your internal user record.
        </li>
        <li>
          OAuth client registration data: for each NeoDB instance, we may store the client ID, client secret, and
          redirect URI that Piecelet Connect uses to perform the OAuth flow.
        </li>
        <li>
          OAuth state: temporary state values and callback URLs created during the authorization flow to prevent
          forgery and link the callback to your original request.
        </li>
      </ul>

      <h3 class="text-sm font-semibold text-[var(--text)]">3.4 Logs and diagnostic information</h3>
      <ul class="ml-5 list-disc space-y-2">
        <li>
          Server logs: limited technical logs (such as timestamps, request paths, error messages, and anonymized
          identifiers) used for debugging, abuse detection, and monitoring.
        </li>
      </ul>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">4. How we use your information</h2>
      <p>We use the data described above for the following purposes:</p>
      <ul class="ml-5 list-disc space-y-2">
        <li>to authenticate you and maintain secure sessions for Piecelet Connect;</li>
        <li>to connect your NeoDB accounts to clients such as the Piecelet app;</li>
        <li>to perform requests to NeoDB instances on your behalf, within the scope you authorized;</li>
        <li>to protect the Service against abuse, spam, and malicious activity;</li>
        <li>to monitor performance, debug issues, and improve reliability;</li>
        <li>to comply with legal obligations and respond to lawful requests where required.</li>
      </ul>
      <p>
        We do not sell your personal data and do not use Piecelet Connect data for targeted advertising.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">5. Cookies and similar technologies</h2>
      <p>
        Piecelet Connect uses cookies and similar technologies only where necessary to provide the Service, including:
      </p>
      <ul class="ml-5 list-disc space-y-2">
        <li>session cookies that keep you signed in and associate your browser with your session; and</li>
        <li>cookies or equivalent mechanisms used to maintain security and prevent fraud.</li>
      </ul>
      <p>
        We do not use Piecelet Connect cookies for cross‑site advertising tracking. If you block or delete all
        cookies, the Service may not function correctly.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">
        6. Data retention and token redaction
      </h2>
      <p>
        6.1 We retain personal data only for as long as necessary to provide the Service, to meet legal obligations, or
        to protect our rights.
      </p>
      <p>
        6.2 NeoDB access tokens are central to how Piecelet Connect works. To reduce risk, the Service applies specific
        token revocation and redaction policies:
      </p>
      <ul class="ml-5 list-disc space-y-2">
        <li>
          When you sign out, we attempt to revoke your NeoDB access tokens on the corresponding instances and
          then replace the stored token values with an irreversible placeholder string (for example,
          <code>ACCESS_TOKEN_REDACTED_AT_...</code>).
        </li>
        <li>
          A scheduled background job regularly scans for NeoDB accounts whose tokens have not been updated for more
          than 24 hours. For those stale tokens, the Service attempts to revoke them at the instance level and then
          redacts them in our database in the same way.
        </li>
      </ul>
      <p>
        6.3 Account and session records (including geolocation metadata) may be retained for a reasonable period after
        tokens are revoked or redacted, for purposes such as security auditing, abuse prevention, and legal compliance.
      </p>
      <p>
        6.4 Where feasible and legally permissible, we may further anonymize or aggregate data for statistical and
        reliability‑improvement purposes. Once data is anonymized, it is no longer considered personal data.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">7. Legal bases for processing</h2>
      <p>
        Depending on your jurisdiction, we rely on one or more of the following legal bases to process your data:
      </p>
      <ul class="ml-5 list-disc space-y-2">
        <li>
          <span class="font-semibold text-[var(--text)]">Contract necessity:</span>
          processing that is necessary to provide the Service you request, including authentication and account
          linking.
        </li>
        <li>
          <span class="font-semibold text-[var(--text)]">Legitimate interests:</span>
          processing to secure the Service, prevent abuse, monitor performance, and improve reliability, where these
          interests are not overridden by your rights and freedoms.
        </li>
        <li>
          <span class="font-semibold text-[var(--text)]">Legal obligations:</span>
          processing required to comply with applicable laws or respond to lawful requests.
        </li>
        <li>
          <span class="font-semibold text-[var(--text)]">Consent:</span>
          where required by law, we may rely on your consent, which you can withdraw at any time (for example, by
          revoking access on a NeoDB instance or signing out).
        </li>
      </ul>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">8. How we share information</h2>
      <p>
        We do not sell your personal data. We share information only in the limited circumstances described below:
      </p>
      <ul class="ml-5 list-disc space-y-2">
        <li>
          <span class="font-semibold text-[var(--text)]">Infrastructure providers:</span>
          We use Cloudflare and other service providers to deliver networking, storage, and compute. These providers
          may process your data on our behalf under data‑processing terms.
        </li>
        <li>
          <span class="font-semibold text-[var(--text)]">NeoDB instances:</span>
          When you authorize Piecelet Connect, we exchange data with the NeoDB instance you selected, within the scope
          of the OAuth flow (for example, sending authorization codes and receiving tokens and basic profile data).
        </li>
        <li>
          <span class="font-semibold text-[var(--text)]">Legal and safety:</span>
          We may disclose information if required by law, court order, or governmental request, or when we believe in
          good faith that disclosure is reasonably necessary to protect our rights, your safety, or the safety of
          others.
        </li>
        <li>
          <span class="font-semibold text-[var(--text)]">Aggregated or anonymized data:</span>
          We may share aggregated statistics or anonymized information that does not identify you.
        </li>
      </ul>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">9. International data transfers</h2>
      <p>
        Piecelet Connect may be hosted on infrastructure located in multiple countries. By using the Service, you
        understand that your data may be transferred to and processed in countries that may have different data
        protection laws than your country of residence.
      </p>
      <p>
        Where required, we take reasonable steps to ensure that such transfers comply with applicable data protection
        laws, for example by using providers that implement appropriate safeguards.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">10. Your rights and choices</h2>
      <p>
        Depending on your location and applicable law, you may have some or all of the following rights regarding your
        personal data:
      </p>
      <ul class="ml-5 list-disc space-y-2">
        <li>the right to access the personal data we hold about you;</li>
        <li>the right to correct inaccurate or incomplete personal data;</li>
        <li>the right to request deletion of your personal data, subject to legal requirements;</li>
        <li>the right to object to or restrict certain types of processing;</li>
        <li>the right to withdraw consent where processing is based on consent; and</li>
        <li>the right to lodge a complaint with a supervisory authority in your jurisdiction.</li>
      </ul>
      <p>
        You can exercise many of these rights directly by revoking access on NeoDB instances, signing out of Piecelet
        Connect, or contacting us as described below. We may need to verify your identity before fulfilling certain
        requests.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">11. Children’s privacy</h2>
      <p>
        The Service is not directed to children and is intended for use by adults and older teenagers who are capable
        of entering into binding agreements under applicable law. If you believe that a child has provided us with
        personal data without appropriate consent, please contact us and we will take reasonable steps to delete such
        information where required.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">12. Changes to this Privacy Policy</h2>
      <p>
        We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal
        requirements. When we make changes, we will update the “Effective date” at the top of this page. If we believe
        changes are material, we will use reasonable efforts to provide additional notice.
      </p>
      <p>
        Your continued use of Piecelet Connect after an updated Privacy Policy becomes effective will constitute your
        acknowledgment of the changes and your agreement to the updated policy.
      </p>
    </section>

    <section class="mt-8 mb-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">13. Contact us</h2>
      <p>
        If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices for
        Piecelet Connect, please contact us using the contact details listed on the Piecelet website or by opening an
        issue in the GitHub repository
        <a href="https://github.com/Piecelet/piecelet-online-services" target="_blank" rel="noreferrer">
          Piecelet Connect (piecelet-online-services)
        </a>.
      </p>
    </section>
  </div>
</div>


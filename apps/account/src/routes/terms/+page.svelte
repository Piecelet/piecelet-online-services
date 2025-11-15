<svelte:head>
  <title>Terms of Service - Piecelet Connect</title>
  <meta
    name="description"
    content="Terms of Service for using Piecelet Connect, an online service for connecting your NeoDB accounts."
  />
</svelte:head>

<div class="bg-[var(--bg)]">
  <div class="mx-auto w-full max-w-3xl px-6 py-12">
    <h1 class="mb-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--text)]">
      Terms of Service – Piecelet Connect
    </h1>
    <p class="mb-8 text-xs text-[var(--muted)]">Effective date: 15 November 2025</p>

    <section class="space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <p>
        Welcome to Piecelet Connect (the “Service”). Piecelet Connect is an additional online service built for
        the Piecelet project that helps you connect your Piecelet app or other clients to NeoDB instances using a
        secure OAuth-based flow.
      </p>
      <p>
        By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by
        these Terms of Service (the “Terms”). If you do not agree to these Terms, please do not use the Service.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">
        1. Scope and relationship with Piecelet app
      </h2>
      <p>
        1.1 These Terms apply only to your use of Piecelet Connect, including any web interface or API that exposes
        authentication, account linking, and related functionality.
      </p>
      <p>
        1.2 Piecelet Connect is separate from the Piecelet app itself. Your use of the Piecelet iOS/macOS or other
        platform apps is governed by the
        <a href="https://piecelet.app/terms/" target="_blank" rel="noreferrer">Piecelet Terms of Use</a>
        and
        <a href="https://piecelet.app/privacy/" target="_blank" rel="noreferrer">Piecelet Privacy Policy</a>.
        Using Piecelet Connect does not modify those terms, and using the Piecelet app does not automatically grant
        you any additional rights under these Terms.
      </p>
      <p>
        1.3 Unless expressly stated otherwise, these Terms do not alter any agreement you have with Apple, NeoDB,
        individual NeoDB instance operators, your internet service provider, or any other third party.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">2. Description of the Service</h2>
      <p>
        2.1 The Service is designed to help you establish a secure connection between one or more NeoDB instances and
        the Piecelet Connect backend operated on your behalf. In particular, Piecelet Connect:
      </p>
      <ul class="ml-5 list-disc space-y-2">
        <li>lets you select or enter a NeoDB instance domain;</li>
        <li>initiates an OAuth / Mastodon-compatible authorization flow on that instance;</li>
        <li>
          receives and stores access tokens returned by the instance so that it can, where authorized, call that
          instance’s APIs on your behalf; and
        </li>
        <li>manages those tokens, including logout, revocation, and periodic cleanup of stale tokens.</li>
      </ul>
      <p>
        2.2 The Service does not host or operate any NeoDB instance and does not provide a social network by itself.
        Any NeoDB instance you connect to is operated by its own provider and is subject to that instance’s terms and
        privacy policy.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">3. Eligibility and accounts</h2>
      <p>
        3.1 You may use the Service only if you have the power to form a contract with us and are not barred from
        doing so under any applicable laws. If you are using the Service on behalf of an organization, you represent
        and warrant that you are authorized to bind that organization to these Terms.
      </p>
      <p>
        3.2 Using the Service generally requires that you hold a valid account on at least one NeoDB instance and that
        you authorize Piecelet Connect to access that account on your behalf. You are responsible for keeping your
        NeoDB account credentials, including any passwords and multi-factor authentication methods, secure.
      </p>
      <p>
        3.3 The Service creates an internal user record that maps to your NeoDB account and maintains your login
        state using session cookies. You are responsible for securing your devices and minimizing the risk that third
        parties can access your authenticated sessions.
      </p>
      <p>
        3.4 If you become aware of any unauthorized use of your account or any security breach, you should contact us
        promptly using the contact channels described below so we can take reasonable steps to assist you.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">
        4. Third‑party services and NeoDB instances
      </h2>
      <p>
        4.1 The Service relies on third‑party infrastructure and services, including but not limited to Cloudflare
        (for networking and edge compute) and the NeoDB instances you choose to connect to. Those services are
        operated independently and are outside our direct control.
      </p>
      <p>
        4.2 Your conduct on each NeoDB instance – including any content you create, publish, or interact with – is
        governed by that instance’s own rules, terms, and policies. We are not responsible for the availability,
        compliance, security, or content of any NeoDB instance.
      </p>
      <p>
        4.3 During the OAuth flow, Piecelet Connect registers a client application on the target NeoDB instance and,
        with your explicit authorization, receives tokens that allow it to call that instance’s APIs on your behalf.
        The authorization relationship is ultimately between you and the NeoDB instance; Piecelet Connect acts as a
        technical intermediary.
      </p>
      <p>
        4.4 You understand and agree that we are not liable for any limitations, outages, or policy changes on NeoDB
        instances or other third‑party services, even if those events affect your ability to use Piecelet Connect.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">5. License and acceptable use</h2>
      <p>
        5.1 Subject to your compliance with these Terms, we grant you a limited, non‑exclusive, non‑transferable,
        revocable license to access and use the Service for lawful purposes.
      </p>
      <p>5.2 You agree that you will not:</p>
      <ul class="ml-5 list-disc space-y-2">
        <li>resell, lease, sublicense, or otherwise provide the Service as a standalone paid product to third parties;</li>
        <li>reverse engineer, decompile, or disassemble the Service, except to the extent permitted by law;</li>
        <li>bypass or attempt to bypass any rate limits, access controls, or security measures;</li>
        <li>
          use the Service to engage in unlawful, infringing, abusive, harassing, or otherwise objectionable behavior; or
        </li>
        <li>use the Service in a way that could harm Piecelet, NeoDB instances, other users, or our infrastructure.</li>
      </ul>
      <p>
        5.3 The Service depends on open‑source software and third‑party components that are each governed by their own
        licenses. Where applicable, those licenses apply in addition to these Terms.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">6. Security and abuse</h2>
      <p>
        6.1 You agree not to use the Service to:
      </p>
      <ul class="ml-5 list-disc space-y-2">
        <li>access, interfere with, or disrupt any system, network, or data without authorization;</li>
        <li>probe, scan, or test the vulnerability of any system or network without consent;</li>
        <li>send spam, malware, or other harmful content;</li>
        <li>impersonate any person or entity, or misrepresent your affiliation with anyone; or</li>
        <li>interfere with or attempt to interfere with the normal functioning of the Service.</li>
      </ul>
      <p>
        6.2 To protect users and the Service, we may apply rate limits, anomaly detection, and other security controls.
        If we detect suspicious activity, we may temporarily or permanently restrict your access to the Service.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">7. Privacy and data processing</h2>
      <p>
        7.1 We take your privacy seriously. When you use the Service, we collect and process a limited amount of
        personal data in order to provide authentication, session management, security, and debugging.
      </p>
      <p>
        7.2 Our data practices for Piecelet Connect, including what data we collect, how we use and store it, and when
        we delete it, are described in the
        <a href="/privacy" rel="noreferrer">Piecelet Connect Privacy Policy</a>. These Terms and the Privacy Policy
        should be read together; if there is any inconsistency regarding privacy matters, the Privacy Policy will
        prevail.
      </p>
      <p>
        7.3 In particular, when you authorize via NeoDB, the Service stores the access token returned by the instance
        so that it can call that instance’s APIs on your behalf. When you sign out, or when an access token has not
        been updated for more than 24 hours and is classified as inactive by our scheduled job, we will:
      </p>
      <ul class="ml-5 list-disc space-y-2">
        <li>attempt to revoke the token on the corresponding NeoDB instance; and</li>
        <li>
          replace the stored token value in our database with an irreversible placeholder so that the original token
          can no longer be used.
        </li>
      </ul>
      <p>
        7.4 Where permitted by law, we may further anonymize or aggregate data for analytics and service improvement,
        after removing or obfuscating direct identifiers.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">
        8. Changes, suspension, and termination
      </h2>
      <p>
        8.1 We may modify, update, or discontinue all or part of the Service at any time. Where feasible, we will
        provide reasonable notice via the interface, documentation, or repository.
      </p>
      <p>
        8.2 Service interruptions may occur due to maintenance, infrastructure failures, legal or regulatory
        requirements, or other events beyond our control. We will make reasonable efforts to restore functionality but
        do not guarantee any specific level of availability or response time.
      </p>
      <p>
        8.3 If you materially violate these Terms or applicable law, we may, without prior notice, suspend or terminate
        your access to the Service and, where appropriate, revoke and/or redact tokens associated with your accounts.
      </p>
      <p>
        8.4 When you stop using the Service, voluntarily close your account, or when we terminate your access, some
        data may be retained for a reasonable period for security, logging, or legal compliance purposes, as described
        in the Privacy Policy.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">9. Disclaimer of warranties</h2>
      <p>
        9.1 To the maximum extent permitted by applicable law, the Service is provided on an “AS IS” and “AS
        AVAILABLE” basis, without warranties of any kind, whether express, implied, or statutory, including but not
        limited to implied warranties of merchantability, fitness for a particular purpose, non‑infringement, and
        continuous availability.
      </p>
      <p>
        9.2 We do not warrant that the Service will be uninterrupted, error‑free, or completely secure, or that any
        defects will be corrected. You are solely responsible for evaluating the suitability of the Service for your
        needs.
      </p>
      <p>
        9.3 We are not responsible for any acts or omissions of third‑party services, including NeoDB instances,
        hosting providers, or network operators.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">10. Limitation of liability</h2>
      <p>
        10.1 To the maximum extent permitted by law, in no event shall we be liable for any indirect, incidental,
        special, consequential, or punitive damages, or any loss of profits, revenue, data, or business opportunities,
        arising out of or in connection with your use of or inability to use the Service, even if we have been advised
        of the possibility of such damages.
      </p>
      <p>
        10.2 To the extent permitted by law, our aggregate liability arising out of or relating to the Service shall
        be limited to the lowest amount permitted by applicable law. If the law allows us to exclude monetary damages
        entirely, these Terms shall be interpreted as doing so.
      </p>
      <p>
        10.3 Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for
        certain types of damages. In such cases, the limitations in this section shall apply only to the extent
        permitted by applicable law.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">11. Intellectual property</h2>
      <p>
        11.1 Piecelet, Piecelet Connect, and associated names, logos, designs, and documentation (excluding portions
        that are explicitly open‑sourced or licensed separately) are protected by copyright, trademark, and other
        intellectual property laws.
      </p>
      <p>
        11.2 Except as expressly permitted by open‑source licenses or other written agreements, your use of the
        Service does not grant you any ownership interest in or license to our intellectual property, other than the
        limited right to use the Service as described in these Terms.
      </p>
      <p>
        11.3 For open‑source components used within the Service, please refer to the respective project repositories
        and license files for applicable terms.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">12. Governing law and jurisdiction</h2>
      <p>
        12.1 These Terms and any dispute arising out of or relating to the Service shall be governed by and construed
        in accordance with the laws of the State of Delaware, United States, and, where applicable, the federal laws
        of the United States, without regard to conflict-of-laws principles.
      </p>
      <p>
        12.2 References in these Terms and in the Piecelet Connect Privacy Policy to “applicable law”, “legal
        obligations”, or similar concepts are intended to refer primarily to the laws and binding orders of competent
        authorities in the United States (including the State of Delaware), Canada, and member states of the European
        Union, and not to the laws of other countries that do not have effective jurisdiction over the Service.
      </p>
      <p>
        12.3 Any legal action or proceeding arising under or relating to these Terms or the Service shall be brought
        exclusively in a court of competent jurisdiction located in Delaware, United States, and you consent to the
        personal jurisdiction and venue of such courts.
      </p>
    </section>

    <section class="mt-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">13. Changes to these Terms</h2>
      <p>
        13.1 We may update these Terms from time to time to reflect changes in the Service, technology, legal
        requirements, or our business. Updated Terms will be posted on this page with an updated effective date.
      </p>
      <p>
        13.2 If we make changes that we consider material, we will use reasonable efforts to provide additional notice,
        such as highlighting changes in the interface or repository. Your continued use of the Service after the
        updated Terms become effective constitutes your acceptance of those changes.
      </p>
    </section>

    <section class="mt-8 mb-8 space-y-4 text-[13px] leading-relaxed text-[var(--muted)]">
      <h2 class="text-lg font-semibold text-[var(--text)]">14. Contact</h2>
      <p>
        If you have any questions, concerns, or feedback about these Terms or the Service, you can contact us via the
        contact information listed on the Piecelet website or by opening an issue in the GitHub repository
        <a href="https://github.com/Piecelet/piecelet-online-services" target="_blank" rel="noreferrer">
          Piecelet Connect (piecelet-online-services)
        </a>. Because the Service is fully open source, you may also choose to review the source code, self-host your
        own instance of Piecelet Connect on infrastructure you control, or opt not to use Piecelet Connect if you are
        uncomfortable with these Terms.
      </p>
    </section>
  </div>
</div>

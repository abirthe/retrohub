import ShopHeader from '@/components/layout/ShopHeader';
import heroBg from '@/assets/hero-bg.jpg';

const sections = [
  {
    title: '1. Information We Collect',
    body: `When you create an account or place an order on RETROHUB, we may collect the following information:
• Email address (used for account authentication, order confirmations, and delivery codes)
• Full name (optionally provided during sign-up)
• Payment transaction reference IDs (we never store card numbers or banking credentials)
• Order history and purchase records
• Usage data such as pages visited, filters used, and session activity`,
  },
  {
    title: '2. How We Use Your Information',
    body: `We use the information we collect to:
• Create and manage your account securely
• Process and fulfill your digital product orders
• Send order confirmation and delivery emails
• Provide customer support
• Improve our platform and user experience
• Comply with legal obligations`,
  },
  {
    title: '3. Data Storage & Security',
    body: `Your data is stored securely using Supabase (PostgreSQL), protected by Row-Level Security (RLS) policies ensuring you can only access your own data. We use industry-standard HTTPS encryption for all data transmission. Passwords are never stored in plain text — authentication is handled via Supabase Auth with bcrypt hashing.`,
  },
  {
    title: '4. Third-Party Services',
    body: `RETROHUB integrates with the following third-party services:
• Supabase — database, authentication, and edge functions
• Google OAuth — optional sign-in via your Google account
• Resend — transactional email delivery
• Vercel — hosting and content delivery
• xAI (Grok) — AI-assisted order fulfillment email generation

Each service operates under its own privacy policy. We do not sell or share your personal data with advertisers.`,
  },
  {
    title: '5. Google OAuth',
    body: `If you choose to sign in with Google, we receive your Google account email address and display name only. We do not access your Google Drive, Gmail, contacts, or any other Google services. You can revoke access at any time via your Google Account settings at myaccount.google.com.`,
  },
  {
    title: '6. Cookies & Local Storage',
    body: `RETROHUB uses browser localStorage to maintain your authentication session and shopping cart state. No third-party tracking cookies are used. Session data is cleared when you sign out.`,
  },
  {
    title: '7. Your Rights',
    body: `You have the right to:
• Access the personal data we hold about you
• Request correction of inaccurate data
• Request deletion of your account and associated data
• Withdraw consent for data processing at any time

To exercise any of these rights, contact us at support@retrohub.tech.`,
  },
  {
    title: '8. Data Retention',
    body: `We retain your account data for as long as your account is active or as required for business operations. Order records are retained for a minimum of 12 months for legal and audit purposes. You may request account deletion at any time.`,
  },
  {
    title: '9. Children\'s Privacy',
    body: `RETROHUB is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify users of significant changes via email or a prominent notice on the site. Your continued use of RETROHUB after any changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '11. Contact Us',
    body: `If you have any questions about this Privacy Policy or how we handle your data, please contact us at:\n\nEmail: support@retrohub.tech\nWebsite: https://retrohub.tech`,
  },
];

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img src={heroBg} alt="" className="w-full h-full object-cover opacity-[0.04]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />
      </div>

      <div className="relative z-10">
        <ShopHeader />
      </div>

      <main className="relative z-10 flex-1 container max-w-3xl py-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header */}
        <div className="mb-12 space-y-3">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary">Legal</p>
          <h1 className="font-display text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">
            Last updated: <span className="text-foreground font-medium">September 2026</span>
          </p>
          <p className="text-muted-foreground leading-relaxed pt-2">
            RETROHUB ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we
            collect, use, store, and protect your personal information when you use our platform at{' '}
            <a href="https://retrohub.tech" className="text-primary hover:underline">
              retrohub.tech
            </a>
            .
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-white">{section.title}</h2>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center text-xs text-muted-foreground">
          © 2026 RETROHUB. Dev by{' '}
          <span className="text-primary font-semibold">ABIR HOSSAIN</span>
        </div>
      </main>
    </div>
  );
};

export default Privacy;

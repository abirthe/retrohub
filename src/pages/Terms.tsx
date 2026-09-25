import ShopHeader from '@/components/layout/ShopHeader';
import heroBg from '@/assets/hero-bg.jpg';

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using the RETROHUB platform at retrohub.tech, you confirm that you are at least 13 years of age and that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.`,
  },
  {
    title: '2. Description of Service',
    body: `RETROHUB is a digital goods marketplace providing:
• Game activation keys for PC and console platforms (Steam, Xbox, PlayStation, Epic Games, Nintendo, and more)
• In-game currency and top-up credits for supported titles
• Digital gift cards and vouchers
• Gaming account services and subscriptions
• Software licenses and digital services

All products are digital in nature and delivered electronically.`,
  },
  {
    title: '3. Account Registration',
    body: `To place orders you must create an account. You agree to:
• Provide accurate and up-to-date registration information
• Keep your password confidential and not share it with others
• Notify us immediately of any unauthorized use of your account
• Take responsibility for all activity that occurs under your account

RETROHUB reserves the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: '4. Orders & Payment',
    body: `All orders are subject to product availability and payment verification. We currently accept:
• bKash (Personal / Merchant) — a 1% service charge applies to bKash transactions
• Bank wire transfer (City Bank, DBBL, BRAC Bank)

Orders are fulfilled manually after payment verification. Estimated delivery times are displayed on each product listing. We reserve the right to cancel any order if payment cannot be verified.`,
  },
  {
    title: '5. Digital Product Delivery',
    body: `Upon successful payment verification, your product key or delivery code will be made available on your Orders page (/orders) and sent to your registered email address. Due to the digital nature of our products:

• All sales are final once a product key or code has been revealed or delivered
• We cannot issue refunds for keys that have been viewed or redeemed
• If you encounter a faulty or invalid key, contact us within 24 hours of delivery`,
  },
  {
    title: '6. Refund & Cancellation Policy',
    body: `Refunds may be issued at our sole discretion in the following circumstances:
• Payment was received but no code was delivered within 5 business days
• The delivered key is demonstrably invalid and a replacement cannot be provided
• Duplicate charges were made for the same order

Refunds are not provided for change of mind, region incompatibility (ensure you select the correct region before purchasing), or accounts that have been banned or restricted by the game publisher.`,
  },
  {
    title: '7. Intellectual Property',
    body: `All content on RETROHUB, including but not limited to text, graphics, logos, and software, is the property of RETROHUB or its content suppliers and is protected by applicable intellectual property laws. Game keys and product codes remain the intellectual property of their respective publishers.`,
  },
  {
    title: '8. Prohibited Conduct',
    body: `You agree not to:
• Use RETROHUB for any unlawful purpose or in violation of any applicable laws
• Attempt to purchase keys for resale or commercial redistribution without written permission
• Attempt to reverse-engineer, scrape, or exploit any part of the platform
• Submit fraudulent payment information or chargeback fraudulently
• Harass, abuse, or threaten our staff or other users

Violations may result in immediate account termination and may be reported to relevant authorities.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `RETROHUB is provided "as is" without warranties of any kind. To the maximum extent permitted by law, RETROHUB shall not be liable for:
• Indirect, incidental, or consequential damages
• Loss of profit, data, or business opportunities
• Service interruptions or downtime
• Actions of third-party game publishers (e.g. key revocations, bans)

Our total liability for any claim shall not exceed the amount paid for the specific order in dispute.`,
  },
  {
    title: '10. Third-Party Links & Services',
    body: `RETROHUB may contain links to third-party websites or integrate third-party services (e.g. Google OAuth, Supabase, Resend, xAI). We are not responsible for the content, privacy practices, or terms of any third-party services. Your use of third-party services is at your own risk.`,
  },
  {
    title: '11. Governing Law',
    body: `These Terms of Service shall be governed by and construed in accordance with the laws of Bangladesh. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Bangladesh.`,
  },
  {
    title: '12. Modifications to Terms',
    body: `RETROHUB reserves the right to modify these Terms of Service at any time. We will notify users of material changes via email or a prominent site notice. Your continued use of the platform after changes are posted constitutes acceptance of the revised terms.`,
  },
  {
    title: '13. Contact Information',
    body: `For questions, disputes, or support requests related to these Terms of Service, please contact us at:\n\nEmail: support@retrohub.tech\nWebsite: https://retrohub.tech`,
  },
];

const Terms = () => {
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
          <h1 className="font-display text-4xl font-bold text-white">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">
            Last updated: <span className="text-foreground font-medium">September 2026</span>
          </p>
          <p className="text-muted-foreground leading-relaxed pt-2">
            Please read these Terms of Service carefully before using the RETROHUB platform. These terms constitute
            a legally binding agreement between you and RETROHUB ("we", "us", "our") governing your use of{' '}
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

export default Terms;

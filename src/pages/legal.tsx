import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { siteConfig } from '@/lib/site-config'
import { SEO } from '@/components/seo'

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Feed
      </Link>
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      <div className="prose prose-sm text-text-secondary space-y-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mt-6 [&_h2]:mb-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  )
}

export function PrivacyPage() {
  const ideaLabel = siteConfig.mode === 'full' ? 'project ideas' : 'SaaS ideas'

  return (
    <LegalLayout title="Privacy Policy">
      <SEO title="Privacy Policy" description="Read OpenProjectIdea's privacy policy. Learn how we collect, use, and protect your data when using our AI-powered SaaS idea generator." url="/privacy" noindex />
      <p>Last updated: March 5, 2026</p>
      <p>This Privacy Policy describes how {siteConfig.name} ("{siteConfig.domain}") collects, uses, stores, and protects your personal information when you use our website, applications, and services (collectively, the "Service"). By using the Service, you consent to the practices described below.</p>

      <h2>1. Information We Collect</h2>
      <p><strong>Account Information:</strong> When you register, we collect your email address, display name, and authentication credentials. If you sign in via Google or GitHub, we receive your name, email, and profile picture from those providers.</p>
      <p><strong>Profile Information:</strong> During onboarding and on your profile page, you may voluntarily provide your skills, interests, preferred platforms, experience level, and CV/resume content. This information is used to personalize AI-generated ideas.</p>
      <p><strong>Usage Data:</strong> We automatically collect information about how you interact with the Service, including ideas you view, votes you cast, bookmarks you save, ideas you generate, and pages you visit. We also collect device type, browser type, IP address, and approximate location (country level).</p>
      <p><strong>Payment Information:</strong> If you purchase a subscription or credits, payment is processed by our third-party payment provider (DodoPayments). We do not store your full credit card number, CVV, or bank account details. We receive confirmation of payment status, plan type, and billing period.</p>
      <p><strong>API Usage:</strong> If you use the Developer API, we log API calls including timestamps, endpoints accessed, and API key identifiers for billing and security purposes.</p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li><strong>Idea Generation:</strong> Your skills, interests, voting history, and platform preferences are sent to AI models to generate personalized {ideaLabel}. No personally identifiable information (name, email) is sent to AI providers.</li>
        <li><strong>Account Management:</strong> To create and maintain your account, process payments, manage subscriptions, and provide customer support.</li>
        <li><strong>Service Improvement:</strong> To analyze aggregated, anonymized usage patterns and improve the quality of AI-generated ideas, platform features, and user experience.</li>
        <li><strong>Communication:</strong> To send you in-app notifications (new ideas, team invites) and essential service emails (password resets, subscription confirmations). We do not send marketing emails without your consent.</li>
        <li><strong>Security:</strong> To detect and prevent fraud, abuse, and unauthorized access to the Service.</li>
      </ul>

      <h2>3. Data Storage & Security</h2>
      <p>Your data is stored on Supabase infrastructure hosted on AWS in the United States. We implement industry-standard security measures including:</p>
      <ul>
        <li>Row-level security (RLS) policies ensuring users can only access their own private data</li>
        <li>Encrypted data transmission via TLS/HTTPS on all connections</li>
        <li>Encrypted passwords using bcrypt hashing</li>
        <li>Service role key separation between client-facing and server-side operations</li>
      </ul>
      <p>Private ideas are only accessible to you (and your team members if you are on a Team plan) unless you explicitly choose to make them public.</p>

      <h2>4. Third-Party Services</h2>
      <p>We use the following third-party services to operate the platform:</p>
      <ul>
        <li><strong>Supabase:</strong> Database, authentication, and real-time infrastructure</li>
        <li><strong>OpenRouter / AI Providers:</strong> AI model access for idea generation. Your skills and interests (not personal identity) are sent to generate personalized ideas</li>
        <li><strong>DodoPayments:</strong> Payment processing for subscriptions and credit purchases</li>
        <li><strong>Cloudflare:</strong> CDN, DDoS protection, and DNS management</li>
        <li><strong>SaasyTrends, Reddit, G2, TrustMRR, Twitter/X:</strong> Public market data fetched to inform AI idea generation (no user data is shared with these services)</li>
      </ul>
      <p>We do not sell, rent, or trade your personal information to any third party.</p>

      <h2>5. Cookies & Tracking</h2>
      <p>We use essential cookies and local storage for authentication (session tokens), user preferences (theme, settings), and generation state tracking. We do not use third-party advertising cookies or tracking pixels. No cross-site tracking is performed.</p>

      <h2>6. Data Retention</h2>
      <p>We retain your account data for as long as your account is active. Generated ideas are retained indefinitely unless you delete them. If you delete your account, all personal data and private ideas are permanently removed within 30 days. Public ideas that have been shared to the community feed may be retained in anonymized form.</p>

      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access:</strong> View all personal data we hold about you via your Profile and Settings pages</li>
        <li><strong>Rectification:</strong> Update or correct your profile information at any time</li>
        <li><strong>Deletion:</strong> Request permanent deletion of your account and all associated data by contacting support</li>
        <li><strong>Portability:</strong> Export your ideas as PDF (Pro and Team plans) or via the Developer API</li>
        <li><strong>Restriction:</strong> Control visibility of your ideas (public or private)</li>
        <li><strong>Objection:</strong> Opt out of personalized idea generation by clearing your profile preferences</li>
      </ul>
      <p>To exercise any of these rights, contact us at support@{siteConfig.domain}.</p>

      <h2>8. Children's Privacy</h2>
      <p>The Service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that a child under 18 has provided us with personal information, we will delete it promptly.</p>

      <h2>9. International Data Transfers</h2>
      <p>Your data may be processed in the United States where our infrastructure is hosted. By using the Service, you consent to the transfer of your data to the United States. We ensure appropriate safeguards are in place for international data transfers.</p>

      <h2>10. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting a notice on the Service or sending you an email. Your continued use of the Service after changes become effective constitutes acceptance of the updated policy.</p>

      <h2>11. Contact Us</h2>
      <p>For privacy-related questions, requests, or concerns, contact us at:</p>
      <ul>
        <li>Email: support@{siteConfig.domain}</li>
        <li>Website: {siteConfig.domain}</li>
      </ul>
    </LegalLayout>
  )
}

export function TermsPage() {
  const ideaLabel = siteConfig.mode === 'full' ? 'project ideas' : 'SaaS ideas'

  return (
    <LegalLayout title="Terms & Conditions">
      <SEO title="Terms & Conditions" description="Read the terms and conditions for using OpenProjectIdea, including acceptable use, intellectual property, and subscription terms." url="/terms" noindex />
      <p>Last updated: March 5, 2026</p>
      <p>These Terms & Conditions ("Terms") govern your access to and use of {siteConfig.name} ("{siteConfig.domain}"), including all related services, features, and content (collectively, the "Service"). By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>

      <h2>1. Definitions</h2>
      <ul>
        <li><strong>"We," "us," "our"</strong> refers to {siteConfig.name} and its operators.</li>
        <li><strong>"You," "your," "user"</strong> refers to any individual or entity accessing the Service.</li>
        <li><strong>"Content"</strong> refers to ideas, text, data, and other materials generated by or submitted to the Service.</li>
        <li><strong>"Generated Ideas"</strong> refers to {ideaLabel} produced by the AI on your behalf.</li>
      </ul>

      <h2>2. Eligibility</h2>
      <p>You must be at least 18 years old and capable of entering into a legally binding agreement to use the Service. By registering, you represent and warrant that you meet these requirements.</p>

      <h2>3. Account Registration & Security</h2>
      <ul>
        <li>You must provide accurate, complete, and current information when creating your account.</li>
        <li>You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</li>
        <li>You must notify us immediately at support@{siteConfig.domain} if you suspect unauthorized access to your account.</li>
        <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
      </ul>

      <h2>4. Service Description</h2>
      <p>{siteConfig.name} is an AI-powered platform that generates {ideaLabel} with detailed breakdowns including revenue estimates, tech stacks, marketing strategies, competitor analysis, and more. The Service includes:</p>
      <ul>
        <li>AI-powered idea generation personalized to your profile</li>
        <li>A public community feed for exploring and voting on shared ideas</li>
        <li>Team collaboration features</li>
        <li>PDF export and Deep Dive Reports</li>
        <li>Developer API access</li>
        <li>Real-time notifications</li>
      </ul>

      <h2>5. Subscriptions & Payments</h2>
      <p><strong>Free Tier:</strong> Access to basic features including 1 idea generation per day, public feed browsing, and voting.</p>
      <p><strong>Paid Plans (Pro, Team):</strong> Paid subscriptions provide additional features including higher generation limits, PDF export, priority AI models, and team workspaces. Pricing is displayed on the Pricing page.</p>
      <ul>
        <li>Subscriptions are billed monthly or yearly as selected at checkout.</li>
        <li>Payments are processed securely by DodoPayments. We do not store your payment card details.</li>
        <li>Subscriptions auto-renew unless cancelled before the end of the billing period.</li>
        <li>You may cancel your subscription at any time from your Settings page. Access continues until the end of the current billing period.</li>
        <li>We offer a 7-day money-back guarantee on new subscriptions. Contact support within 7 days of purchase for a full refund.</li>
      </ul>
      <p><strong>Credits:</strong> One-time credit purchases for Deep Dive Reports are non-refundable once the report has been generated.</p>

      <h2>6. Intellectual Property & Content Ownership</h2>
      <p><strong>Your Generated Ideas:</strong> You retain full rights to use, modify, distribute, and build upon any idea generated specifically for your account. We do not claim ownership over your Generated Ideas.</p>
      <p><strong>Public Ideas:</strong> When you choose to make an idea public, it becomes visible to all users of the platform. Other users may view, vote on, and bookmark public ideas. You retain ownership but grant us a non-exclusive, worldwide license to display the idea within the Service.</p>
      <p><strong>Platform Content:</strong> All other content on the platform — including the website design, branding, logos, AI models, algorithms, and documentation — is the intellectual property of {siteConfig.name} and may not be copied, modified, or distributed without our written permission.</p>
      <p><strong>API Output:</strong> Ideas retrieved or generated via the Developer API are subject to the same ownership terms as ideas generated through the website.</p>

      <h2>7. Acceptable Use Policy</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Manipulate vote counts, abuse the voting system, or engage in any form of platform manipulation</li>
        <li>Use automated tools, bots, or scripts to scrape, bulk-download, or mass-generate ideas outside of the provided API</li>
        <li>Impersonate another user or misrepresent your identity</li>
        <li>Use the Service to generate content that is illegal, harmful, threatening, abusive, defamatory, or violates the rights of others</li>
        <li>Attempt to reverse-engineer, decompile, or extract the source code of the platform</li>
        <li>Circumvent rate limits, subscription restrictions, or security measures</li>
        <li>Resell or redistribute access to the Service without our written authorization</li>
        <li>Share your API key with unauthorized parties or use it in a way that violates these Terms</li>
      </ul>
      <p>Violation of this policy may result in immediate account suspension or termination without refund.</p>

      <h2>8. AI-Generated Content Disclaimer</h2>
      <p><strong>No Guarantees:</strong> All ideas, revenue estimates, market analysis, competitor information, tech stack recommendations, and other AI-generated content are produced by artificial intelligence and are provided "as-is" for informational purposes only. They are starting points for your own research, not guaranteed business plans.</p>
      <p><strong>Accuracy:</strong> We do not guarantee the accuracy, completeness, or reliability of any AI-generated content. Revenue projections are estimates based on market data available at the time of generation and may not reflect actual market conditions.</p>
      <p><strong>Independent Verification:</strong> You are solely responsible for conducting your own due diligence, market research, and legal review before acting on any idea generated by the Service.</p>
      <p><strong>No Professional Advice:</strong> The Service does not constitute financial, legal, business, or investment advice. Consult qualified professionals before making business decisions.</p>

      <h2>9. Limitation of Liability</h2>
      <p>To the maximum extent permitted by law:</p>
      <ul>
        <li>The Service is provided "as is" and "as available" without warranties of any kind, express or implied.</li>
        <li>We are not liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</li>
        <li>We are not liable for any business decisions, investments, or actions taken based on AI-generated ideas.</li>
        <li>We are not liable for any loss of data, revenue, or profits resulting from service interruptions or technical issues.</li>
        <li>Our total aggregate liability shall not exceed the amount you paid us in the 12 months preceding the claim.</li>
      </ul>

      <h2>10. Indemnification</h2>
      <p>You agree to indemnify and hold harmless {siteConfig.name}, its operators, employees, and affiliates from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.</p>

      <h2>11. Termination</h2>
      <ul>
        <li><strong>By You:</strong> You may close your account at any time by contacting support. Active subscriptions will remain until the end of the current billing period.</li>
        <li><strong>By Us:</strong> We may suspend or terminate your account at any time for violation of these Terms, fraudulent activity, or at our sole discretion with reasonable notice.</li>
        <li>Upon termination, your access to the Service ceases. Private ideas and personal data will be deleted in accordance with our Privacy Policy.</li>
      </ul>

      <h2>12. Governing Law & Disputes</h2>
      <p>These Terms are governed by and construed in accordance with applicable international commerce laws. Any disputes arising from these Terms or the Service shall be resolved through good-faith negotiation first, and if unresolved, through binding arbitration in the jurisdiction of the Service operator.</p>

      <h2>13. Modifications to Terms</h2>
      <p>We reserve the right to modify these Terms at any time. Material changes will be communicated via email or an in-app notification at least 14 days before they take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated Terms.</p>

      <h2>14. Severability</h2>
      <p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</p>

      <h2>15. Entire Agreement</h2>
      <p>These Terms, together with our Privacy Policy and any other policies referenced herein, constitute the entire agreement between you and {siteConfig.name} regarding your use of the Service.</p>

      <h2>16. Contact Us</h2>
      <p>For questions about these Terms, contact us at:</p>
      <ul>
        <li>Email: support@{siteConfig.domain}</li>
        <li>Website: {siteConfig.domain}</li>
      </ul>
    </LegalLayout>
  )
}

export function AccessibilityPage() {
  return (
    <LegalLayout title="Accessibility">
      <SEO title="Accessibility" description="OpenProjectIdea's commitment to web accessibility and inclusive design." url="/accessibility" noindex />
      <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

      <h2>Our Commitment</h2>
      <p>{siteConfig.name} is committed to ensuring digital accessibility for all users. We strive to conform to WCAG 2.1 Level AA standards and continuously improve the user experience for everyone.</p>

      <h2>Accessibility Features</h2>
      <ul>
        <li>Full keyboard navigation support</li>
        <li>Light and dark theme modes for visual comfort</li>
        <li>Semantic HTML structure for screen reader compatibility</li>
        <li>Sufficient color contrast ratios across all UI elements</li>
        <li>Responsive design that works across all device sizes</li>
        <li>Clear focus indicators for interactive elements</li>
      </ul>

      <h2>Known Limitations</h2>
      <p>Some AI-generated content may not be optimally structured for screen readers. We are working to improve the formatting of generated idea breakdowns.</p>

      <h2>Feedback</h2>
      <p>If you experience any accessibility issues, please contact us at support@{siteConfig.domain}. We take all feedback seriously and will work to address issues promptly.</p>
    </LegalLayout>
  )
}

import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

type Section = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
  subsections?: Array<{
    title: string
    paragraphs?: string[]
    bullets?: string[]
  }>
}

const privacySections: Section[] = [
  {
    title: '1. About UniMart',
    paragraphs: [
      'UniMart is a campus marketplace and community platform designed primarily for university communities.',
      'Through UniMart, users can:',
    ],
    bullets: [
      'Buy and sell products',
      'Offer and discover services',
      'List and rent items',
      'Post and apply for gigs',
      'Create shops',
      'Follow shops',
      'Save listings',
      'Read Campus Magazine articles',
      'Submit articles for publication',
    ],
    subsections: [
      {
        title: 'Why we process data',
        paragraphs: ['To provide these services, we process certain personal information.'],
      },
    ],
  },
  {
    title: '2. Our Commitment to Your Privacy',
    paragraphs: ['We are committed to:'],
    bullets: [
      'Collecting only information that is reasonably necessary.',
      'Being transparent about how we use your information.',
      'Protecting your information with appropriate security measures.',
      'Giving you control over your personal information where possible.',
      'Complying with applicable data protection laws.',
    ],
    subsections: [
      {
        title: 'Compliance approach',
        paragraphs: [
          "Our privacy practices are designed to align with Uganda's Data Protection and Privacy Act, 2019, its accompanying Regulations, and oversight by the Personal Data Protection Office (PDPO).",
        ],
      },
    ],
  },
  {
    title: '3. Information We Collect',
    paragraphs: ['The information we collect depends on how you use UniMart.'],
    subsections: [
      {
        title: 'A. Information You Provide',
        paragraphs: ['When creating an account, you may provide:'],
        bullets: [
          'Full name',
          'Email address',
          'University',
          'Campus',
          'Profile photo',
          'Bio',
          'Phone number (optional)',
          'Other profile information you choose to add',
        ],
      },
      {
        title: 'Listing information',
        paragraphs: ['When creating listings, you may provide:'],
        bullets: [
          'Listing title',
          'Description',
          'Price',
          'Images',
          'Category',
          'Location',
          'Availability',
          'Rental terms',
          'Service details',
        ],
      },
      {
        title: 'Shop information',
        paragraphs: ['When creating a shop, you may provide:'],
        bullets: [
          'Shop name',
          'Shop logo',
          'Shop description',
          'Contact information',
          'Shop location',
          'Business information',
        ],
      },
      {
        title: 'Gig information',
        paragraphs: ['When posting gigs, you may provide:'],
        bullets: [
          'Gig description',
          'Budget',
          'Requirements',
          'Deadline',
          'Location',
        ],
      },
      {
        title: 'Gig applications',
        paragraphs: ['When applying for gigs, you may provide:'],
        bullets: [
          'Application message',
          'Portfolio links',
          'Relevant experience',
          'Other information you voluntarily include',
        ],
      },
      {
        title: 'Campus Magazine content',
        paragraphs: ['When contributing to the Campus Magazine, you may provide:'],
        bullets: [
          'Article title',
          'Cover image',
          'Article content',
          'Category',
          'Excerpt',
        ],
      },
      {
        title: 'Support and contact details',
        paragraphs: ['When contacting us, you may provide:'],
        bullets: [
          'Name',
          'Email',
          'Support requests',
          'Feedback',
          'Other communications',
        ],
      },
      {
        title: 'B. Information Collected Automatically',
        paragraphs: ['When you use UniMart, we may automatically collect technical information such as:'],
        bullets: [
          'Device type',
          'Browser type',
          'Operating system',
          'IP address',
          'Language preferences',
          'Date and time of access',
          'Pages visited',
          'Features used',
          'Session information',
          'Crash or performance information',
        ],
      },
      {
        title: 'Automatic collection purpose',
        paragraphs: ['This helps us improve performance, security, and reliability.'],
      },
      {
        title: 'C. Authentication Information',
        paragraphs: [
          'UniMart uses Firebase Authentication.',
          'Depending on how you sign in, Firebase may process information such as:',
        ],
        bullets: [
          'Email address',
          'Google account information',
          'Authentication identifiers',
          'Login timestamps',
        ],
      },
      {
        title: 'Password handling',
        paragraphs: ['We do not receive your password when you authenticate through Google Sign-In.'],
      },
      {
        title: 'D. Marketplace Activity',
        paragraphs: ['We may record information about how you use the marketplace, including:'],
        bullets: [
          'Listings you create',
          'Listings you save',
          'Shops you follow',
          'Gig applications',
          'Listings you view',
          'Notifications you receive',
          'Magazine submissions',
        ],
      },
      {
        title: 'Marketplace data use',
        paragraphs: ['This information helps provide Platform functionality.'],
      },
    ],
  },
  {
    title: '4. Information We Do Not Intentionally Collect',
    paragraphs: ['We do not intentionally collect:'],
    bullets: [
      'Payment card details through the MVP platform',
      'Government identification unless specifically required later',
      'Biometric information',
      'Sensitive personal information unless voluntarily submitted or legally required',
    ],
    subsections: [
      {
        title: 'Accidental submission',
        paragraphs: ['If sensitive information is accidentally submitted, we may remove it where appropriate.'],
      },
    ],
  },
  {
    title: '5. How We Use Your Information',
    paragraphs: ['We use your information to operate UniMart.', 'This includes:'],
    subsections: [
      {
        title: 'Account Management',
        bullets: [
          'Creating accounts',
          'Authenticating users',
          'Maintaining profiles',
          'Managing account settings',
        ],
      },
      {
        title: 'Marketplace Functionality',
        bullets: [
          'Publishing listings',
          'Displaying shops',
          'Processing gig applications',
          'Saving favorites',
          'Following shops',
          'Showing marketplace content',
        ],
      },
      {
        title: 'Communication',
        paragraphs: ['We use your information to send:'],
        bullets: [
          'Security alerts',
          'Login notifications',
          'Gig updates',
          'Listing activity',
          'Shop notifications',
          'Support responses',
          'Important platform announcements',
        ],
      },
      {
        title: 'Campus Magazine',
        paragraphs: ['We use submitted content to:'],
        bullets: [
          'Review articles',
          'Moderate submissions',
          'Publish approved articles',
          'Credit authors',
        ],
      },
      {
        title: 'Platform Improvement',
        paragraphs: ['We analyze usage information to:'],
        bullets: [
          'Improve search',
          'Improve recommendations',
          'Fix bugs',
          'Improve performance',
          'Develop new features',
        ],
      },
      {
        title: 'Safety and Security',
        paragraphs: ['We use information to:'],
        bullets: [
          'Detect fraud',
          'Prevent abuse',
          'Investigate reports',
          'Protect users',
          'Enforce our Terms of Service',
        ],
      },
    ],
  },
  {
    title: '6. Legal Basis for Processing',
    paragraphs: ['Where applicable under Ugandan law, we process personal information based on lawful grounds such as:'],
    bullets: [
      'Your consent',
      'Performance of our services',
      'Compliance with legal obligations',
      'Protection of legitimate interests',
      'Security and fraud prevention',
    ],
    subsections: [
      {
        title: 'Lawful processing principles',
        paragraphs: [
          "Uganda's data protection framework requires organizations processing personal data to follow principles of lawful, fair, and transparent processing.",
        ],
      },
    ],
  },
  {
    title: '7. How Your Information Appears Publicly',
    paragraphs: ['Some information is intentionally public because UniMart is a marketplace.', 'Public information may include:'],
    bullets: [
      'Display name',
      'Profile photo',
      'University',
      'Campus',
      'Shop name',
      'Shop logo',
      'Shop description',
      'Listings',
      'Public magazine articles',
      'Author name on published articles',
    ],
    subsections: [
      {
        title: 'Private information',
        paragraphs: ['Private information is not displayed publicly by default.', 'Private information includes:'],
        bullets: [
          'Email address',
          'Authentication information',
          'Internal account identifiers',
          'Administrative records',
          'Private support conversations',
        ],
      },
      {
        title: 'Phone number protection',
        paragraphs: ['Phone numbers are protected and are not exposed through unrestricted public database queries.'],
      },
    ],
  },
  {
    title: '8. Shops and Public Profiles',
    paragraphs: ['If you create a shop, your shop becomes publicly visible.', 'Your shop may display:'],
    bullets: [
      'Shop name',
      'Logo',
      'Description',
      'Listings',
      'Category',
      'Location',
      'Follower count',
    ],
    subsections: [
      {
        title: 'Follower visibility',
        paragraphs: [
          'Users may follow your shop.',
          'Follower identities are not publicly exposed to everyone.',
        ],
      },
    ],
  },
  {
    title: '9. Listings',
    paragraphs: [
      'When you publish a listing, information in that listing becomes visible to other users.',
      'This includes:',
    ],
    bullets: [
      'Images',
      'Description',
      'Price',
      'Category',
      'Campus',
      'Location (where applicable)',
      'Seller information that is intentionally public',
    ],
    subsections: [
      {
        title: 'Listing responsibility',
        paragraphs: ['You remain responsible for ensuring your listing does not contain unnecessary personal information.'],
      },
    ],
  },
  {
    title: '10. Campus Magazine Contributions',
    paragraphs: ['When an article is approved and published:'],
    bullets: [
      'Your author name may appear publicly.',
      'Your article becomes visible to readers.',
      'The cover image becomes publicly accessible.',
      'The publication date may appear publicly.',
    ],
    subsections: [
      {
        title: 'Pending submissions',
        paragraphs: ['Pending submissions remain private until moderated.'],
      },
    ],
  },
  {
    title: '11. Gig Applications',
    paragraphs: ['Gig applications are visible only to:'],
    bullets: [
      'The applicant',
      'The gig poster',
      'Authorized administrators where necessary',
    ],
    subsections: [
      {
        title: 'Application visibility',
        paragraphs: ['Applications are not publicly searchable.'],
      },
    ],
  },
  {
    title: '12. Cookies and Similar Technologies',
    paragraphs: [
      'UniMart uses cookies and similar technologies to improve your experience.',
      'We may use:',
    ],
    subsections: [
      {
        title: 'Essential Cookies',
        paragraphs: ['Required for:'],
        bullets: [
          'Login sessions',
          'Security',
          'Core functionality',
        ],
      },
      {
        title: 'Functional Cookies',
        paragraphs: ['Used for:'],
        bullets: [
          'Remembering preferences',
          'Theme settings',
          'User experience improvements',
        ],
      },
      {
        title: 'Analytics Technologies',
        paragraphs: ['We may use analytics tools to understand:'],
        bullets: [
          'Page visits',
          'Feature usage',
          'Performance',
          'Errors',
        ],
      },
      {
        title: 'Consent for non-essential technologies',
        paragraphs: ['Where required, we will obtain appropriate consent for non-essential technologies.'],
      },
    ],
  },
  {
    title: '13. Third-Party Services',
    paragraphs: ['We rely on trusted third-party providers.', 'These may include:'],
    subsections: [
      {
        title: 'Firebase',
        paragraphs: ['Used for authentication.'],
      },
      {
        title: 'Supabase',
        paragraphs: ['Used for:'],
        bullets: [
          'Database',
          'File storage',
          'Realtime features',
        ],
      },
      {
        title: 'Hosting Providers',
        paragraphs: [
          'Our application may be hosted through providers such as Vercel.',
          'These providers process information only as necessary to deliver our services.',
          'They remain subject to their own privacy and security obligations.',
        ],
      },
    ],
  },
  {
    title: '14. How We Share Information',
    paragraphs: [
      'We do not sell your personal information.',
      'We may share information only in limited circumstances.',
    ],
    subsections: [
      {
        title: 'With Other Users',
        paragraphs: ['When necessary for marketplace functionality.', 'Examples:'],
        bullets: [
          'Public listings',
          'Shop pages',
          'Magazine articles',
          'Gig interactions',
        ],
      },
      {
        title: 'With Service Providers',
        paragraphs: [
          'We share information with service providers who help us operate UniMart.',
          'Examples include:',
        ],
        bullets: [
          'Authentication providers',
          'Database providers',
          'Hosting providers',
          'Security providers',
        ],
      },
      {
        title: 'Provider expectations',
        paragraphs: ['These providers are expected to protect your information appropriately.'],
      },
      {
        title: 'Legal Requirements',
        paragraphs: ['We may disclose information where required by:'],
        bullets: [
          'Law',
          'Court order',
          'Lawful government request',
          'Regulatory obligation',
          'Protection of legal rights',
        ],
      },
      {
        title: 'Business Changes',
        paragraphs: ['If UniMart undergoes:'],
        bullets: [
          'Merger',
          'Acquisition',
          'Investment',
          'Business restructuring',
        ],
      },
      {
        title: 'Transfer during business changes',
        paragraphs: ['Relevant information may be transferred as part of that process, subject to applicable law.'],
      },
    ],
  },
  {
    title: '15. International Data Transfers',
    paragraphs: [
      'Some of our technology providers may process or store data outside Uganda.',
      "Where international transfers occur, we aim to ensure that appropriate safeguards are in place, consistent with Uganda's data protection framework governing cross-border transfers.",
    ],
  },
  {
    title: '16. Data Retention',
    paragraphs: ['We retain information only as long as reasonably necessary.'],
    subsections: [
      {
        title: 'Typical retention periods',
        bullets: [
          'Account information: While account is active',
          'Listings: Until deleted or removed',
          'Shop information: While shop exists',
          'Magazine articles: While published or archived',
          'Support requests: As reasonably necessary',
          'Security logs: According to operational needs',
          'Legal records: As required by law',
        ],
      },
      {
        title: 'Longer retention scenarios',
        paragraphs: ['Some information may be retained longer where necessary for:'],
        bullets: [
          'Fraud prevention',
          'Security',
          'Legal compliance',
          'Dispute resolution',
        ],
      },
    ],
  },
  {
    title: '17. Account Deletion',
    paragraphs: ['You may request deletion of your account.', 'When your account is deleted:'],
    bullets: [
      'Your account becomes inaccessible.',
      'Public listings may be removed.',
      'Shops may be removed.',
      'Saved listings may be removed.',
      'Certain records may be retained where legally required.',
    ],
    subsections: [
      {
        title: 'Published magazine content',
        paragraphs: ['Some published magazine content may remain where appropriate, with suitable treatment of author information where legally required.'],
      },
    ],
  },
  {
    title: '18. Your Privacy Rights',
    paragraphs: ['Depending on applicable law, you may have rights including:'],
    subsections: [
      {
        title: 'Access',
        paragraphs: ['Request access to your personal information.'],
      },
      {
        title: 'Correction',
        paragraphs: ['Request correction of inaccurate information.'],
      },
      {
        title: 'Deletion',
        paragraphs: ['Request deletion where appropriate.'],
      },
      {
        title: 'Withdrawal of Consent',
        paragraphs: ['Withdraw consent where processing depends on consent.'],
      },
      {
        title: 'Objection',
        paragraphs: ['Object to certain types of processing where applicable.'],
      },
      {
        title: 'Complaints',
        paragraphs: ['Raise concerns with UniMart or the relevant data protection authority.'],
      },
      {
        title: 'Rights under applicable law',
        paragraphs: [
          "Uganda's data protection law recognizes rights relating to access, correction, and lawful processing of personal data.",
        ],
      },
    ],
  },
  {
    title: "19. Children's Privacy",
    paragraphs: [
      'UniMart is designed primarily for university communities.',
      'We do not knowingly collect personal information from children in violation of applicable law.',
      'If we become aware that inappropriate information has been collected from a child, we may remove it.',
      'Parents or guardians may contact us regarding concerns.',
    ],
  },
  {
    title: '20. Security',
    paragraphs: ['We take security seriously.', 'Measures may include:'],
    bullets: [
      'Encrypted connections (HTTPS)',
      'Firebase Authentication',
      'Secure database permissions',
      'Row Level Security',
      'Access controls',
      'Monitoring',
      'Logging',
      'Secure cloud infrastructure',
      'Administrative access controls',
    ],
    subsections: [
      {
        title: 'Security limitations',
        paragraphs: ['No online system can guarantee absolute security, but we continuously work to protect user information.'],
      },
    ],
  },
  {
    title: '21. Marketplace Safety',
    paragraphs: ['While we work to make UniMart safer, users should exercise caution.', 'We recommend:'],
    bullets: [
      'Meeting in public places.',
      'Inspecting products before payment.',
      'Avoiding unnecessary sharing of personal information.',
      'Reporting suspicious activity.',
      'Verifying important information independently.',
    ],
  },
  {
    title: '22. Fraud Prevention',
    paragraphs: ['We use information to detect:'],
    bullets: [
      'Fake accounts',
      'Scam listings',
      'Suspicious activity',
      'Abuse',
      'Unauthorized access',
      'Security threats',
    ],
    subsections: [
      {
        title: 'Account restrictions during review',
        paragraphs: ['We may temporarily restrict accounts while investigating suspicious activity.'],
      },
    ],
  },
  {
    title: '23. Automated Features',
    paragraphs: ['Some platform features may rely on automated processes.', 'Examples include:'],
    bullets: [
      'Search results',
      'Listing recommendations',
      'Notification generation',
      'Spam detection',
      'Security monitoring',
    ],
    subsections: [
      {
        title: 'Purpose of automation',
        paragraphs: ['These systems help improve user experience and platform safety.'],
      },
    ],
  },
  {
    title: '24. Marketing Communications',
    paragraphs: ['We may send:'],
    bullets: [
      'Product updates',
      'Feature announcements',
      'Campus news',
      'Platform improvements',
    ],
    subsections: [
      {
        title: 'Opt-out',
        paragraphs: [
          'You can unsubscribe from UniMart email updates at /unsubscribe, from Settings, or with the link we include when we send those emails.',
          'Service-related messages may still be necessary.',
        ],
      },
    ],
  },
  {
    title: '25. Links to Other Websites',
    paragraphs: ['UniMart may contain links to external websites.', 'We are not responsible for:'],
    bullets: [
      'Their privacy practices',
      'Their content',
      'Their security',
    ],
    subsections: [
      {
        title: 'External privacy review',
        paragraphs: ['Please review their privacy policies separately.'],
      },
    ],
  },
  {
    title: '26. Changes to This Privacy Policy',
    paragraphs: ['We may update this Privacy Policy as UniMart evolves.', 'Updates may occur due to:'],
    bullets: [
      'New features',
      'Legal requirements',
      'Security improvements',
      'Operational changes',
    ],
    subsections: [
      {
        title: 'Version notice',
        paragraphs: [
          'The "Last Updated" date will reflect the latest version.',
          'Material changes may be communicated through the Platform.',
        ],
      },
    ],
  },
  {
    title: '27. Compliance with Ugandan Law',
    paragraphs: [
      "UniMart aims to process personal data in accordance with Uganda's data protection framework, including the Data Protection and Privacy Act, 2019 and the Data Protection and Privacy Regulations, 2021, under the oversight of the Personal Data Protection Office (PDPO).",
      'As the Platform grows, we will continue improving our privacy and security practices to align with applicable legal requirements and industry best practices.',
    ],
  },
  {
    title: '28. Contact Us',
    paragraphs: [
      'If you have questions about this Privacy Policy, your personal information, or your privacy rights, please contact UniMart through our official support channels available within the Platform.',
      'For privacy-related requests, please include enough information to help us identify your account and understand your request.',
    ],
  },
  {
    title: '29. Summary of Our Privacy Promise',
    paragraphs: ['In simple terms, UniMart promises to:'],
    bullets: [
      'Collect only the information we need.',
      'Never sell your personal information.',
      'Keep your account secure.',
      'Give you control over your profile where possible.',
      'Protect sensitive information.',
      'Moderate public content responsibly.',
      'Be transparent about how your information is used.',
      'Continue improving our privacy practices as UniMart grows.',
    ],
  },
]

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>

      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-[#8b9994]">Last updated: 18 August 2026</p>

      <div className="mt-8 space-y-6 text-base leading-7 text-[#5f746c]">
        <p>
          At <strong className="text-[#243e39]">UniMart</strong>, we believe
          privacy is fundamental to trust. Whether you&apos;re buying a phone,
          offering tutoring services, renting a camera, applying for a gig, or
          sharing a story through our Campus Magazine, we are committed to
          handling your personal information responsibly.
        </p>
        <p>
          This Privacy Policy explains how UniMart collects, uses, stores,
          shares, and protects your personal information when you use our
          website, mobile application, and related services (collectively, the
          &quot;Platform&quot;).
        </p>
        <p>
          By using UniMart, you acknowledge that you have read and understood
          this Privacy Policy.
        </p>

        {privacySections.map((section) => (
          <section key={section.title} className="space-y-4 border-t border-[#e4ece8] pt-6">
            <h2 className="font-display text-xl font-bold text-[#29463f]">
              {section.title}
            </h2>

            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            {section.bullets ? <BulletList items={section.bullets} /> : null}

            {section.subsections?.map((subsection) => (
              <div key={subsection.title} className="space-y-3 pt-2">
                <h3 className="font-display text-lg font-semibold text-[#29463f]">
                  {subsection.title}
                </h3>

                {subsection.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}

                {subsection.bullets ? (
                  <BulletList items={subsection.bullets} />
                ) : null}
              </div>
            ))}
          </section>
        ))}

        <section className="space-y-4 border-t border-[#e4ece8] pt-6">
          <p>
            <strong className="text-[#243e39]">
              Thank you for trusting UniMart, where campus communities Buy ·
              Sell · Hire · Connect.
            </strong>
          </p>
        </section>
      </div>
    </div>
  )
}

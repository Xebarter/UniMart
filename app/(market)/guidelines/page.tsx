import Link from 'next/link'
import {
  BookOpen,
  Flag,
  Handshake,
  HeartHandshake,
  Lock,
  Shield,
  Sparkles,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

type GuidelineSection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

const CORE_VALUES = [
  {
    title: 'Be Honest',
    body: 'Represent yourself, your products, services and opportunities truthfully.',
  },
  {
    title: 'Be Respectful',
    body: 'Treat other people with courtesy, even when you disagree.',
  },
  {
    title: 'Be Safe',
    body: 'Protect yourself and others from scams, harassment, dangerous activity and abuse.',
  },
  {
    title: 'Be Responsible',
    body: 'Take responsibility for what you post, sell, offer, share and communicate.',
  },
  {
    title: 'Build the Community',
    body: 'Use UniMart to create opportunities, support other students and contribute positively to campus life.',
  },
]

const GUIDELINES: GuidelineSection[] = [
  {
    title: '2. Treat People With Respect',
    paragraphs: [
      'UniMart welcomes people from different backgrounds, universities and communities.',
      'You can disagree with someone without being disrespectful.',
    ],
    bullets: [
      'Harass or bully other users',
      'Threaten or intimidate people',
      'Use abusive or degrading language to target someone',
      'Stalk or repeatedly contact someone who has asked you to stop',
      'Encourage violence against another person',
      'Deliberately humiliate or embarrass another user',
      'Target people with discriminatory or hateful content',
    ],
  },
  {
    title: '3. Be Honest in the Marketplace',
    paragraphs: [
      'Trust is essential when people buy, sell, rent or work together.',
      'Always:',
      'Do not create fake listings, fake shops, fake identities or misleading offers.',
      'Marketplace platforms depend heavily on authentic listings and honest participation to maintain trust.',
    ],
    bullets: [
      'Describe products accurately',
      'Use genuine photographs where possible',
      'State prices clearly',
      'Be honest about availability',
      'Disclose important defects or limitations',
      'Represent your skills and qualifications accurately',
      'Provide truthful information about gigs',
      'Communicate changes promptly',
    ],
  },
  {
    title: '4. Keep Transactions Safe',
    paragraphs: [
      'When dealing with another user:',
      'Remember that UniMart provides the platform but does not guarantee every transaction between users.',
    ],
    bullets: [
      'Verify important information before paying',
      'Inspect physical products where possible',
      'Agree on prices and terms clearly',
      'Keep records of important transactions',
      'Meet in appropriate public places',
      'Be cautious about advance payments',
      'Never share your PIN, password or verification code',
    ],
  },
  {
    title: '5. Respect Privacy',
    paragraphs: [
      "Do not publish or share another person's private information without permission.",
      'This includes:',
      'Information obtained through UniMart must not be used to harass, stalk, spam or exploit another person.',
    ],
    bullets: [
      'Phone numbers',
      'Private addresses',
      'Identification documents',
      'Passwords',
      'Financial information',
      'Private messages',
      'Personal photographs',
      'Academic information',
      'Other sensitive information',
    ],
  },
  {
    title: '6. Use Listings Responsibly',
    paragraphs: [
      'Every listing should have a legitimate purpose.',
      'Do not post:',
      'Do not deliberately manipulate listings to attract users through false information.',
    ],
    bullets: [
      'Fake products',
      'Stolen property',
      'Counterfeit goods',
      'Illegal products',
      'Misleading advertisements',
      'Spam listings',
      'Harmful materials',
      'Fraudulent opportunities',
      'Anything prohibited by UniMart policies or applicable law',
    ],
  },
  {
    title: '7. Services & Professional Offers',
    paragraphs: [
      'If you offer a service, be clear about:',
      'Do not claim qualifications, certifications or professional experience that you do not have.',
      'Where a service legally requires a license or professional qualification, you are responsible for complying with those requirements.',
    ],
    bullets: [
      'What you provide',
      'Your price',
      'Your availability',
      'Your location where relevant',
      'Your experience',
      'Any requirements',
    ],
  },
  {
    title: '8. Gigs & Opportunities',
    paragraphs: [
      'UniMart should be a place where people discover real opportunities.',
      'Gig posters should clearly explain:',
      'Gig applicants should honestly represent their:',
      'Do not use gigs to facilitate scams, illegal activities, exploitation or academic dishonesty.',
    ],
    bullets: [
      'What work needs to be done',
      'Expected compensation',
      'Requirements',
      'Location',
      'Deadline',
      'Important conditions',
      'Skills',
      'Experience',
      'Qualifications',
      'Availability',
    ],
  },
  {
    title: '9. No Academic Dishonesty',
    paragraphs: [
      'UniMart supports learning and legitimate academic assistance.',
      'Tutoring, editing, research assistance and study support are welcome.',
      'However, do not use UniMart to:',
    ],
    bullets: [
      'Take an examination for another student',
      'Complete graded work dishonestly',
      'Sell leaked examination papers',
      'Sell examination answers',
      'Impersonate students',
      'Facilitate plagiarism',
      'Circumvent legitimate academic assessment',
    ],
  },
  {
    title: '10. Contribute Positively to the Campus Magazine',
    paragraphs: [
      'The Campus Magazine belongs to the wider UniMart community.',
      'When contributing, aim to publish content that is:',
      'Do not submit:',
      'Submitted articles may be reviewed before publication.',
    ],
    bullets: [
      'Useful',
      'Interesting',
      'Original',
      'Accurate',
      'Respectful',
      'Relevant to the campus community',
      'Plagiarized work',
      'Fabricated stories presented as facts',
      'Defamatory accusations',
      'Hate speech',
      'Personal attacks',
      'Private information',
      'Copyright-infringing material',
      'Spam',
      'Misleading promotional content disguised as journalism',
    ],
  },
  {
    title: '11. Respect Intellectual Property',
    paragraphs: [
      'Only upload or publish content that you have the right to use.',
      'This includes:',
      "Do not copy another user's listing photos, shop branding, descriptions or Magazine articles and present them as your own.",
    ],
    bullets: [
      'Photographs',
      'Videos',
      'Articles',
      'Designs',
      'Logos',
      'Music',
      'Illustrations',
      'Other creative works',
    ],
  },
  {
    title: '12. No Spam',
    paragraphs: ['Keep UniMart useful by avoiding unwanted or repetitive content.', 'Do not:'],
    bullets: [
      'Post the same listing repeatedly',
      'Send mass unsolicited messages',
      'Submit irrelevant Magazine articles',
      'Create multiple accounts to promote the same content',
      'Flood the Platform with advertisements',
      'Use automated systems to generate spam',
    ],
  },
  {
    title: "13. Don't Manipulate the Community",
    paragraphs: [
      'UniMart activity should represent genuine interest.',
      'Do not artificially manipulate:',
      'Creating fake accounts or coordinating artificial activity to make something appear more popular is not allowed.',
    ],
    bullets: [
      'Listing views',
      'Favorites',
      'Followers',
      'Gig applications',
      'Ratings or reviews, where available',
      'Magazine engagement',
      'Other Platform metrics',
    ],
  },
  {
    title: '14. Protect Your Account',
    paragraphs: [
      'Your account represents you.',
      'Never:',
      'If you believe someone has accessed your account without permission, take immediate steps to secure it and contact UniMart.',
    ],
    bullets: [
      'Share your password',
      'Share authentication codes',
      'Give strangers access to your account',
      "Use someone else's account",
      'Buy or sell UniMart accounts',
      'Create accounts to evade restrictions',
    ],
  },
  {
    title: '15. No Hacking or Platform Abuse',
    paragraphs: [
      "Do not attempt to interfere with UniMart's technology.",
      'This includes:',
      'If you discover a security problem, report it responsibly instead of exploiting it.',
    ],
    bullets: [
      'Hacking',
      'Attempting to bypass security controls',
      'Unauthorized vulnerability exploitation',
      'Credential attacks',
      'Malware',
      'Automated abuse',
      'Unauthorized scraping',
      'Denial-of-service attacks',
      "Attempts to access another user's information",
    ],
  },
  {
    title: '16. No Fraud or Scams',
    paragraphs: [
      'Scams have no place on UniMart.',
      'Watch out for and report:',
      'If something feels wrong, stop and verify before proceeding.',
    ],
    bullets: [
      'Fake payment confirmations',
      'Fake jobs',
      'Fake shops',
      'Advance-payment scams',
      'Impersonation',
      'Phishing',
      'Counterfeit goods',
      'Fake investment opportunities',
      'Requests for passwords or PINs',
      'Offers that appear deliberately deceptive',
    ],
  },
  {
    title: '17. No Hate or Violence',
    paragraphs: [
      'UniMart does not permit content that promotes or encourages:',
      'Respectful discussion, disagreement and criticism are allowed.',
    ],
    bullets: [
      'Violence',
      'Serious threats',
      'Hatred',
      'Dehumanization',
      'Discrimination',
      'Extremist violence',
      'Harm against individuals or groups',
    ],
  },
  {
    title: '18. No Exploitation',
    paragraphs: [
      'UniMart must never be used to facilitate:',
      'Serious or illegal conduct may be reported to appropriate authorities where required or appropriate.',
    ],
    bullets: [
      'Human trafficking',
      'Sexual exploitation',
      'Exploitation of minors',
      'Non-consensual intimate content',
      'Sexual extortion',
      'Abuse',
      'Other exploitative activity',
    ],
  },
  {
    title: '19. Respect University Communities',
    paragraphs: [
      'UniMart operates around campus communities.',
      'Users should respect:',
      'Being a UniMart user does not exempt you from university or legal requirements.',
    ],
    bullets: [
      'University rules',
      'Campus regulations',
      'Residence policies',
      'Academic requirements',
      'Event rules',
      'Other applicable institutional policies',
    ],
  },
  {
    title: '20. Report Problems',
    paragraphs: [
      'If you see something that violates these Guidelines, help us keep UniMart safe.',
      'Report:',
      'When reporting, provide as much useful information as possible.',
      'Do not retaliate against another user.',
    ],
    bullets: [
      'Scams',
      'Fake listings',
      'Harassment',
      'Threats',
      'Prohibited goods',
      'Suspicious gigs',
      'Inappropriate Magazine content',
      'Privacy violations',
      'Other serious misconduct',
    ],
  },
  {
    title: "21. Don't Abuse the Reporting System",
    paragraphs: [
      'Reports should be made in good faith.',
      'Do not submit false reports simply to:',
      'Repeated abuse of reporting tools may result in restrictions on your account.',
    ],
    bullets: [
      'Harm a competitor',
      'Remove a legitimate listing',
      'Silence criticism',
      'Harass another user',
      'Manipulate moderation',
    ],
  },
  {
    title: '22. How UniMart Handles Violations',
    paragraphs: [
      'When we become aware of a potential violation, we may review the relevant content or activity.',
      'Depending on the circumstances, UniMart may:',
      'Serious violations may result in immediate action.',
      'Where legally required or appropriate, UniMart may also cooperate with relevant authorities.',
    ],
    bullets: [
      'Remove content',
      'Hide a listing',
      'Reject a Magazine submission',
      'Restrict a feature',
      'Issue a warning',
      'Suspend a listing or shop',
      'Temporarily suspend an account',
      'Permanently terminate an account',
    ],
  },
  {
    title: '23. Appeals',
    paragraphs: [
      'If UniMart takes action against your account or content and an appeal process is available, you may request a review.',
      'A useful appeal should explain:',
      'We may uphold, reverse or modify a decision after review.',
    ],
    bullets: [
      'What happened',
      'Why you believe the decision was incorrect',
      'Relevant evidence',
      'Any important context',
    ],
  },
  {
    title: '24. These Guidelines Can Evolve',
    paragraphs: [
      'UniMart will continue to grow and change.',
      'We may update these Guidelines when:',
      'We will update the Last Updated date whenever this page changes.',
    ],
    bullets: [
      'New features are introduced',
      'New risks emerge',
      'Laws change',
      'Community needs change',
      'We learn better ways to protect the community',
    ],
  },
]

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>

      <section className="mt-8 rounded-[30px] border border-[#dfe9e4] bg-[radial-gradient(circle_at_top_left,_rgba(110,164,142,0.16),_transparent_35%),linear-gradient(135deg,#fcfffd_0%,#f3f9f6_48%,#eef6f2_100%)] px-6 py-8 shadow-[0_18px_60px_rgba(36,62,57,0.08)] sm:px-10 sm:py-12">
        <div className="flex flex-wrap items-center gap-3 text-[#315e55]">
          <span className="inline-flex items-center rounded-full border border-[#d7e6df] bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
            Community Standards
          </span>
          <span className="text-xs font-semibold text-[#7a8c85]">
            Last updated: 18 August 2026
          </span>
        </div>

        <h1 className="mt-4 font-display text-[2.35rem] font-bold tracking-[-0.05em] text-[#1f3631] sm:text-[3rem]">
          Community Guidelines
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[#5f746c] sm:text-[17px]">
          UniMart is more than a marketplace. It is a community built around
          trust, opportunity, collaboration and campus life.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#748780] sm:text-base">
          These Community Guidelines explain how we expect everyone to behave
          when using UniMart, whether you are buying something, running a shop,
          offering a service, applying for a gig, following a seller, or
          contributing to the Campus Magazine.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[#748780] sm:text-base">
          These Guidelines work together with our Terms of Service, Acceptable
          Use Policy, Privacy Policy and Safety Tips.
        </p>
      </section>

      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#edf6f1] text-[#315e55]">
            <HeartHandshake size={20} />
          </span>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">
              1. Our Community Values
            </h2>
            <p className="mt-1 text-sm text-[#748780]">
              The standards that shape how UniMart should feel for everyone.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {CORE_VALUES.map((value, index) => (
            <article
              key={value.title}
              className="rounded-[24px] border border-[#e3ece8] bg-white p-5 shadow-[0_12px_36px_rgba(36,62,57,0.05)]"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8aa299]">
                Value {index + 1}
              </p>
              <h3 className="mt-3 font-display text-lg font-bold text-[#243e39]">
                {value.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#667b73]">
                {value.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-5 lg:grid-cols-2">
        {GUIDELINES.map((section) => (
          <article
            key={section.title}
            className="rounded-[26px] border border-[#e3ece8] bg-white p-6 shadow-[0_12px_36px_rgba(36,62,57,0.05)]"
          >
            <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-[#243e39]">
              {section.title}
            </h2>

            <div className="mt-4 space-y-3 text-sm leading-7 text-[#667b73]">
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            {section.bullets ? (
              <ul className="mt-5 space-y-2 border-t border-[#edf2ef] pt-5 text-sm leading-7 text-[#5f746c]">
                {section.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-2 size-1.5 rounded-full bg-[#6e8f84]" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </section>

      <section className="mt-12 rounded-[28px] border border-[#dfe9e4] bg-[#f7fbf9] px-6 py-8 shadow-[0_10px_30px_rgba(36,62,57,0.04)] sm:px-8">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#315e55] shadow-[0_8px_24px_rgba(36,62,57,0.06)]">
            <Sparkles size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">
              25. Our Promise to the UniMart Community
            </h2>
            <p className="mt-3 text-base leading-8 text-[#5f746c]">
              We want UniMart to be a place where a student can find a laptop,
              sell clothes, hire a designer, rent a camera, find a weekend gig,
              offer tutoring, discover a new campus business, follow a shop,
              share a story, and connect with their community.
            </p>
            <p className="mt-3 text-sm leading-7 text-[#748780]">
              That requires everyone to play their part.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { icon: Handshake, label: 'Be honest' },
                { icon: Shield, label: 'Be safe' },
                { icon: Lock, label: 'Be responsible' },
                { icon: Flag, label: 'Build the community' },
                { icon: BookOpen, label: 'Be respectful' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <span
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full border border-[#dbe7e1] bg-white px-4 py-2 text-sm font-semibold text-[#315e55]"
                  >
                    <Icon size={15} />
                    {item.label}
                  </span>
                )
              })}
            </div>
            <p className="mt-5 text-sm font-semibold text-[#315e55]">
              UniMart - Buy · Sell · Hire · Connect.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

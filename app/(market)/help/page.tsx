import Link from 'next/link'
import {
  Bell,
  BookOpen,
  Briefcase,
  CreditCard,
  HelpCircle,
  Lock,
  Newspaper,
  Shield,
  ShoppingBag,
  Store,
  UserCircle2,
  WalletCards,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

type FaqItem = {
  question: string
  answer: string[]
}

type FaqSection = {
  title: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  items: FaqItem[]
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'General',
    icon: HelpCircle,
    items: [
      {
        question: 'What is UniMart?',
        answer: [
          'UniMart is a campus marketplace where people can buy and sell products, offer and find services, rent items, post and apply for gigs, and discover opportunities within their campus community.',
          'UniMart also includes a Campus Magazine where users can read and contribute articles about student life, academics, events and the wider campus community.',
        ],
      },
      {
        question: 'Who can use UniMart?',
        answer: [
          "UniMart is primarily designed for university students and members of their campus communities.",
          "Students can use all major marketplace features, including creating shops, posting listings and applying for gigs.",
          "Community members can browse the marketplace, buy items, follow shops and post gigs, subject to UniMart's platform rules.",
        ],
      },
      {
        question: 'Do I need an account to use UniMart?',
        answer: [
          'You can browse public listings, shops and published Magazine articles without an account.',
          'You need an account to perform actions such as posting listings, creating a shop, saving listings, following shops, applying for gigs or contributing to the Magazine.',
        ],
      },
    ],
  },
  {
    title: 'Buying & Selling',
    icon: ShoppingBag,
    items: [
      {
        question: 'What can I sell on UniMart?',
        answer: [
          'You can list legitimate products that are permitted under UniMart’s policies and applicable laws.',
          'Products can include things such as electronics, fashion, food and groceries, academic supplies, beauty products, dorm and household items, sports equipment, and art and crafts.',
          'Prohibited or unlawful goods are not allowed.',
        ],
      },
      {
        question: 'How do I sell something?',
        answer: [
          'Create an account, select Post, choose Product, provide the required information, add photos, set your price and publish your listing.',
          'Make sure your description and photos accurately represent what you are selling.',
        ],
      },
      {
        question: 'Can I sell used items?',
        answer: [
          'Yes. Used items can be listed as long as they are legally yours to sell and their condition is described honestly.',
        ],
      },
      {
        question: 'Does UniMart handle payments between buyers and sellers?',
        answer: [
          'For the MVP, UniMart primarily connects buyers and sellers. Users should agree on a suitable payment and delivery or collection arrangement.',
          'Always verify that payment has actually been received before handing over an item.',
        ],
      },
      {
        question: 'Does UniMart deliver products?',
        answer: [
          'UniMart does not automatically provide delivery for every listing. Delivery arrangements should be agreed upon between the buyer and seller.',
        ],
      },
    ],
  },
  {
    title: 'Services',
    icon: Briefcase,
    items: [
      {
        question: 'What types of services can I offer?',
        answer: [
          'You can offer legitimate services such as tutoring, graphic design, photography, hair and beauty, catering, web development, tailoring, delivery and errands, event services, and tech support.',
        ],
      },
      {
        question: 'Can I hire someone through UniMart?',
        answer: [
          'Yes. You can discover service providers and contact them to discuss their service, price, availability and requirements.',
        ],
      },
      {
        question: 'Can I advertise my professional skills?',
        answer: [
          'Yes. You can create a service listing describing what you offer, your pricing, availability and relevant experience.',
          'Do not claim qualifications or certifications you do not have.',
        ],
      },
    ],
  },
  {
    title: 'Rentals',
    icon: WalletCards,
    items: [
      {
        question: 'Can I rent things on UniMart?',
        answer: [
          'Yes. UniMart allows users to list items available for rent and discover items offered by others.',
          'Examples include electronics, cameras, furniture, event equipment, sports equipment, costumes, academic equipment, and transport and rides.',
        ],
      },
      {
        question: 'What should I agree on before renting?',
        answer: [
          'Before handing over or receiving an item, clearly agree on price, rental period, deposit if any, condition of the item, return arrangements, and responsibility for damage or loss.',
        ],
      },
    ],
  },
  {
    title: 'Gigs',
    icon: Briefcase,
    items: [
      {
        question: 'What is a gig?',
        answer: [
          'A gig is a short-term job, task or opportunity that someone needs another person to complete.',
          'Examples include campus promotions, writing, research assistance, graphic design, event staffing, tech support, personal assistance, and fitness and sports work.',
        ],
      },
      {
        question: 'Who can post gigs?',
        answer: [
          "Eligible UniMart users can post legitimate gig opportunities in accordance with UniMart's rules.",
        ],
      },
      {
        question: 'Who can apply for gigs?',
        answer: ['Students can apply for gigs available on UniMart.'],
      },
      {
        question: 'How do I apply for a gig?',
        answer: [
          'Open a gig listing and follow the application process provided. Include relevant information about your skills, experience and ability to complete the work.',
        ],
      },
      {
        question: 'Can I post a fake or misleading gig?',
        answer: [
          'No. Gig posters must provide accurate information about the work, compensation, requirements and other important conditions.',
        ],
      },
    ],
  },
  {
    title: 'Shops',
    icon: Store,
    items: [
      {
        question: 'What is a UniMart shop?',
        answer: [
          'A shop is a student’s public storefront on UniMart where they can showcase their products or services in one place.',
        ],
      },
      {
        question: 'Who can create a shop?',
        answer: [
          'Students can create and manage a UniMart shop, subject to the applicable requirements.',
        ],
      },
      {
        question: 'Can I have multiple shops?',
        answer: ['UniMart is designed for one shop per student account.'],
      },
      {
        question: 'Can I follow a shop?',
        answer: [
          "Yes. You can follow shops you're interested in and keep up with their activity.",
        ],
      },
      {
        question: 'Can I see who follows a shop?',
        answer: [
          'Follower information is protected. UniMart may display an overall follower count without publicly exposing individual follower identities.',
        ],
      },
    ],
  },
  {
    title: 'Saving Listings',
    icon: ShoppingBag,
    items: [
      {
        question: 'Can I save a listing?',
        answer: ['Yes. Tap the heart/favorite option on a listing to save it for later.'],
      },
      {
        question: 'Where can I find my saved listings?',
        answer: ['Open Saved listings from the sidebar, your profile menu, or Profile → Saved. That is your collection.'],
      },
      {
        question: 'Does the seller know when I save their listing?',
        answer: ['UniMart may notify sellers when someone favorites their listing.'],
      },
    ],
  },
  {
    title: 'Campus Magazine',
    icon: Newspaper,
    items: [
      {
        question: 'What is the UniMart Campus Magazine?',
        answer: [
          'The Campus Magazine is a community publication featuring content such as student life, academics, events, research, campus news, community stories, and tips and advice.',
        ],
      },
      {
        question: 'Can I contribute an article?',
        answer: ['Yes. Signed-in users can submit articles for consideration.'],
      },
      {
        question: 'Is every submitted article published?',
        answer: [
          'No. Articles are reviewed before publication.',
          "Submissions may be approved, rejected or returned based on UniMart's content standards.",
        ],
      },
      {
        question: "Can I submit someone else's article?",
        answer: [
          'You should only submit content that you have the right to publish. Plagiarism and copyright infringement are not permitted.',
        ],
      },
      {
        question: 'Who decides what gets published?',
        answer: [
          "UniMart's authorized administrators moderate Magazine submissions and decide whether submitted content meets the Platform's publishing standards.",
        ],
      },
    ],
  },
  {
    title: 'Accounts & Profiles',
    icon: UserCircle2,
    items: [
      {
        question: 'How do I create an account?',
        answer: [
          'Choose Sign Up and provide the required information. UniMart may offer email/password and supported social sign-in options.',
        ],
      },
      {
        question: 'Can I change my profile information?',
        answer: ['Yes. You can manage the information available through your Profile settings.'],
      },
      {
        question: 'Can I change my profile picture?',
        answer: [
          'Yes. Where the feature is available, you can upload, replace or remove your profile picture.',
        ],
      },
      {
        question: 'Can I delete my account?',
        answer: [
          'You can request account deletion through the available account or support channels.',
          'Some information may need to be retained where required for legal, security or legitimate operational purposes.',
        ],
      },
    ],
  },
  {
    title: 'Notifications',
    icon: Bell,
    items: [
      {
        question: 'Why am I receiving notifications?',
        answer: [
          'UniMart can notify you about activity related to your account, including someone favoriting your listing, someone viewing your listing, activity related to your gigs, new Magazine publications, and other important Platform activity.',
        ],
      },
      {
        question: 'Can I see my notifications?',
        answer: ['Yes. Tap the notification bell to view your notification activity.'],
      },
    ],
  },
  {
    title: 'Safety',
    icon: Shield,
    items: [
      {
        question: 'Is UniMart responsible for every transaction?',
        answer: [
          'No. UniMart provides the marketplace platform but does not guarantee every transaction, product, service, rental or gig.',
          'Users should verify information and take reasonable precautions.',
        ],
      },
      {
        question: 'How can I stay safe?',
        answer: [
          'Always meet in safe public places, verify products before paying, be cautious of unusually cheap offers, never share passwords or mobile-money PINs, avoid unnecessary personal information sharing, and report suspicious activity.',
        ],
      },
      {
        question: 'What should I do if I think someone is scamming me?',
        answer: [
          'Stop the interaction and do not send additional money or information.',
          'Keep relevant evidence and report the account, listing or interaction to UniMart.',
        ],
      },
      {
        question: 'What if I feel threatened?',
        answer: [
          'Prioritize your safety and leave the situation if possible. If you are in immediate danger, contact the appropriate emergency authorities.',
        ],
      },
    ],
  },
  {
    title: 'Payments',
    icon: CreditCard,
    items: [
      {
        question: 'Does UniMart charge users to browse listings?',
        answer: ['No. Browsing the marketplace is free.'],
      },
      {
        question: 'Does UniMart charge sellers to create listings?',
        answer: [
          'The MVP is designed to allow users to list products, services, rentals and gigs without a listing fee, subject to any future changes communicated by UniMart.',
        ],
      },
      {
        question: 'Does UniMart currently have a Pro subscription?',
        answer: [
          'No. UniMart Pro is planned as a future feature and is not part of the current MVP.',
          'When Pro is introduced, its features, pricing and terms will be clearly communicated.',
        ],
      },
    ],
  },
  {
    title: 'Privacy & Security',
    icon: Lock,
    items: [
      {
        question: 'How does UniMart protect my information?',
        answer: [
          'UniMart uses security controls designed to protect user information, including secure authentication, database access controls and restricted access to sensitive information.',
          'However, no online platform can guarantee absolute security.',
        ],
      },
      {
        question: 'Does UniMart sell my personal information?',
        answer: ['No. UniMart does not sell your personal information.'],
      },
      {
        question: 'Can other users see my phone number?',
        answer: [
          'Your private contact information is not intended to be publicly exposed through ordinary marketplace browsing.',
          'Only information intentionally made public through your profile, shop or listing should be visible to other users.',
          'For more information, see our Privacy Policy.',
        ],
      },
    ],
  },
  {
    title: 'Content & Rules',
    icon: Shield,
    items: [
      {
        question: 'What content is prohibited on UniMart?',
        answer: [
          'UniMart prohibits content and activity involving things such as fraud and scams, stolen or counterfeit goods, illegal products, harassment and threats, hate or abusive content, academic cheating, malicious software, privacy violations, impersonation, spam, copyright infringement, and other unlawful or harmful activity.',
          'See the Acceptable Use Policy for the complete rules.',
        ],
      },
      {
        question: 'Can UniMart remove my listing?',
        answer: [
          'Yes. UniMart may remove or restrict listings that violate its policies, applicable law or the safety of the community.',
        ],
      },
      {
        question: 'Can my account be suspended?',
        answer: [
          "Yes. Accounts may be restricted or suspended for serious or repeated violations of UniMart's policies.",
        ],
      },
    ],
  },
  {
    title: 'Universities & Campuses',
    icon: Store,
    items: [
      {
        question: 'Is UniMart available at my university?',
        answer: [
          'UniMart is designed for university communities in Uganda and can support multiple universities and campuses.',
          'If your university or campus is not yet listed, UniMart may provide an option to identify or request it.',
        ],
      },
      {
        question: "Can I use UniMart if I'm not a university student?",
        answer: [
          'Community members may use certain UniMart features, subject to the role and permissions associated with their account.',
        ],
      },
    ],
  },
  {
    title: 'Getting Help',
    icon: BookOpen,
    items: [
      {
        question: 'How do I report a problem?',
        answer: [
          'Use the support/contact options available within UniMart to report technical problems, suspicious activity, inappropriate content or other concerns.',
        ],
      },
      {
        question: 'How do I report a listing?',
        answer: [
          'If a listing appears fraudulent, prohibited, misleading or unsafe, report it through the available reporting or support channels.',
        ],
      },
      {
        question: 'How do I contact UniMart?',
        answer: ['Use the official contact or support options provided on the UniMart Platform.'],
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>

      <section className="mt-8 rounded-[30px] border border-[#dfe9e4] bg-[radial-gradient(circle_at_top_left,_rgba(110,164,142,0.16),_transparent_35%),linear-gradient(135deg,#fcfffd_0%,#f3f9f6_48%,#eef6f2_100%)] px-6 py-8 shadow-[0_18px_60px_rgba(36,62,57,0.08)] sm:px-10 sm:py-12">
        <span className="inline-flex items-center rounded-full border border-[#d7e6df] bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#315e55]">
          Support
        </span>
        <h1 className="mt-4 font-display text-[2.35rem] font-bold tracking-[-0.05em] text-[#1f3631] sm:text-[3rem]">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[#5f746c] sm:text-[17px]">
          Find quick answers to common questions about buying, selling,
          services, rentals, gigs, shops and the Campus Magazine on UniMart.
        </p>
      </section>

      <div className="mt-12 space-y-6">
        {FAQ_SECTIONS.map((section) => {
          const Icon = section.icon

          return (
            <section
              key={section.title}
              className="rounded-[26px] border border-[#e3ece8] bg-white p-6 shadow-[0_12px_36px_rgba(36,62,57,0.05)] sm:p-7"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[#edf6f1] text-[#315e55]">
                  <Icon size={19} />
                </span>
                <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">
                  {section.title}
                </h2>
              </div>

              <div className="mt-6 space-y-4">
                {section.items.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-[20px] border border-[#e8efeb] bg-[#fbfdfc] px-5 py-4"
                  >
                    <summary className="cursor-pointer list-none font-display text-lg font-semibold text-[#29463f] marker:hidden">
                      <span className="flex items-center justify-between gap-4">
                        <span>{item.question}</span>
                        <span className="text-[#7a8c85] transition-transform duration-200 group-open:rotate-45">
                          +
                        </span>
                      </span>
                    </summary>

                    <div className="mt-4 space-y-3 border-t border-[#edf2ef] pt-4 text-sm leading-7 text-[#667b73]">
                      {item.answer.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <section className="mt-12 rounded-[26px] border border-[#dfe9e4] bg-[#f7fbf9] px-6 py-8 text-center shadow-[0_10px_30px_rgba(36,62,57,0.04)] sm:px-8">
        <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">
          Still Have Questions?
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#748780]">
          We&apos;re building UniMart to make campus commerce and collaboration
          simple, useful and safe. If you can&apos;t find the answer you&apos;re
          looking for, contact the UniMart support team.
        </p>
        <p className="mt-4 text-sm font-semibold text-[#315e55]">
          UniMart - Buy · Sell · Hire · Connect.
        </p>
      </section>
    </div>
  )
}

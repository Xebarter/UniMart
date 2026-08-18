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

const termsSections: Section[] = [
  {
    title: '1. About UniMart',
    paragraphs: [
      'UniMart provides an online platform that connects members of university and campus communities.',
      'The Platform may allow users to:',
    ],
    bullets: [
      'Buy and sell products;',
      'Offer and find services;',
      'List and discover items available for rent;',
      'Post and apply for gigs or short-term work opportunities;',
      'Create and operate shops;',
      'Follow shops;',
      'Save or favorite listings;',
      'Discover opportunities within their university or campus community;',
      'Submit, read and interact with campus magazine content; and',
      'Access other features that UniMart may introduce from time to time.',
    ],
    subsections: [
      {
        title: '1.1 UniMart is a platform, not a seller',
        paragraphs: [
          'Unless expressly stated otherwise, UniMart does not own, manufacture, sell, supply, rent or provide the products, services or opportunities listed by users.',
          'UniMart primarily provides the technology and marketplace through which users can discover and interact with one another.',
          'The person or business that creates a listing is generally responsible for that listing, including its description, price, availability, quality, legality and fulfillment.',
        ],
      },
      {
        title: '1.2 Independent users',
        paragraphs: [
          'Users who list products, services, rentals or gigs are independent users of the Platform.',
          'Their activities do not automatically constitute activities of UniMart.',
          'The appearance of a listing, shop, service provider or gig on UniMart does not mean that UniMart has endorsed, verified, guaranteed or recommended that user, product, service or opportunity unless UniMart expressly states otherwise.',
        ],
      },
    ],
  },
  {
    title: '2. Eligibility',
    paragraphs: [
      'You must meet the applicable legal requirements to use UniMart.',
      'By using the Platform, you represent that:',
    ],
    bullets: [
      'You are legally capable of entering into an agreement;',
      'The information you provide is accurate and truthful;',
      'You will comply with these Terms;',
      'You will comply with applicable laws and regulations;',
      'You will not use UniMart for unlawful purposes; and',
      "You will not use another person's identity or account without authorization.",
    ],
    subsections: [
      {
        title: 'Eligibility details',
        paragraphs: [
          'UniMart is designed primarily for university and campus communities. Certain features may be restricted based on user type, university, campus or other eligibility requirements.',
          'If you are below the applicable age of legal capacity in your jurisdiction, you should only use the Platform with the involvement and consent of a parent, guardian or other person legally authorized to permit your use.',
          'UniMart may restrict or terminate access where it reasonably believes a user does not meet the applicable eligibility requirements.',
        ],
      },
    ],
  },
  {
    title: '3. Acceptance of These Terms',
    paragraphs: [
      'By registering for an account or using UniMart, you confirm that you have read, understood and agreed to these Terms.',
      'If you use UniMart on behalf of an organization, business, student group or other entity, you represent that you have authority to bind that entity to these Terms.',
      'UniMart may update these Terms from time to time. When material changes are made, UniMart may provide notice through the Platform, email or other reasonable means.',
      'Your continued use of the Platform after updated Terms become effective constitutes acceptance of the revised Terms.',
      'If you do not agree with an updated version of the Terms, you should stop using UniMart and may request closure of your account where applicable.',
    ],
  },
  {
    title: '4. User Accounts',
    paragraphs: [
      'Certain features require you to create an account.',
      'When creating an account, you agree to provide accurate, current and complete information.',
      'You are responsible for:',
    ],
    bullets: [
      'Maintaining the accuracy of your information;',
      'Keeping your login credentials secure;',
      'Preventing unauthorized access to your account;',
      'Immediately notifying UniMart if you believe your account has been compromised; and',
      'All activity occurring through your account, except where caused by circumstances outside your reasonable control.',
    ],
    subsections: [
      {
        title: 'Account restrictions',
        paragraphs: ['You must not:'],
        bullets: [
          'Create an account using false information;',
          'Impersonate another person;',
          'Create an account for another person without authorization;',
          "Use another user's account;",
          'Create accounts for fraudulent purposes; or',
          'Attempt to circumvent account restrictions or suspensions.',
        ],
      },
      {
        title: 'Verification',
        paragraphs: [
          'UniMart may require users to verify certain information where reasonably necessary for security, fraud prevention, moderation or compliance.',
        ],
      },
    ],
  },
  {
    title: '5. User Profiles',
    paragraphs: [
      'Users may create profiles containing information such as:',
    ],
    bullets: [
      'Name;',
      'Profile photo;',
      'University;',
      'Campus;',
      'Biography;',
      'Shop information;',
      'Listings;',
      'Services;',
      'Other information voluntarily provided by the user.',
    ],
    subsections: [
      {
        title: 'Profile responsibility',
        paragraphs: [
          "You are responsible for ensuring that information displayed on your profile is accurate and does not violate another person's rights.",
          "Do not publish another person's personal information without an appropriate legal basis or permission.",
        ],
      },
    ],
  },
  {
    title: '6. Marketplace Listings',
    paragraphs: [
      'UniMart allows users to create listings for products, services, rentals and gigs.',
      'Users are solely responsible for the content and accuracy of their listings.',
      'A listing should accurately describe:',
    ],
    bullets: [
      'What is being offered;',
      'The condition of the item where relevant;',
      'The price or expected compensation;',
      'Availability;',
      'Location where relevant;',
      'Applicable terms or requirements;',
      'Relevant limitations or restrictions; and',
      'Any other material information that a reasonable user would need to make an informed decision.',
    ],
    subsections: [
      {
        title: 'Listing accuracy',
        paragraphs: [
          'Users must not deliberately provide misleading or deceptive listing information.',
          'UniMart may remove or restrict listings that violate these Terms, applicable law, community standards or the interests of users.',
        ],
      },
    ],
  },
  {
    title: '7. Buying and Selling Products',
    paragraphs: ['UniMart may allow users to advertise products for sale.'],
    subsections: [
      {
        title: 'Seller responsibilities',
        paragraphs: ['Sellers are responsible for:'],
        bullets: [
          'Having the legal right to sell the product;',
          'Accurately describing the product;',
          'Providing truthful photographs and information;',
          'Honoring representations made in their listing;',
          'Communicating honestly with potential buyers;',
          'Complying with applicable laws; and',
          'Completing agreed transactions in good faith.',
        ],
      },
      {
        title: 'Buyer responsibilities',
        paragraphs: ['Buyers are responsible for:'],
        bullets: [
          'Reviewing listings carefully;',
          'Asking appropriate questions before committing to a transaction;',
          'Confirming the condition, authenticity and suitability of products;',
          'Confirming price and other terms;',
          'Exercising reasonable care when meeting sellers; and',
          'Complying with applicable laws.',
        ],
      },
      {
        title: 'No automatic product guarantees',
        paragraphs: ['UniMart does not automatically guarantee that a product:'],
        bullets: [
          'Exists;',
          'Is authentic;',
          'Is safe;',
          'Is of satisfactory quality;',
          'Is fit for a particular purpose;',
          'Belongs to the person listing it;',
          'Is available as described; or',
          "Will meet a buyer's expectations.",
        ],
      },
      {
        title: 'Buyer caution',
        paragraphs: ['Users should exercise appropriate caution before completing transactions.'],
      },
    ],
  },
  {
    title: '8. Services',
    paragraphs: ['Users may list services they provide.'],
    subsections: [
      {
        title: 'Service provider responsibilities',
        paragraphs: ['Service providers are responsible for:'],
        bullets: [
          'Accurately describing their services;',
          'Clearly communicating prices and conditions;',
          'Having the necessary skills, qualifications, permissions or licenses where required;',
          'Performing services professionally and lawfully;',
          'Honoring agreed terms; and',
          'Complying with applicable laws and professional requirements.',
        ],
      },
      {
        title: 'Provider verification',
        paragraphs: [
          'UniMart does not guarantee the qualifications, competence, reliability or availability of any service provider unless UniMart expressly states that a particular provider has undergone a specific verification process.',
          'Users should independently verify qualifications where the nature of a service makes such verification important.',
        ],
      },
    ],
  },
  {
    title: '9. Rentals',
    paragraphs: ['Users may list items or other assets available for rental.'],
    subsections: [
      {
        title: 'Rental provider responsibilities',
        paragraphs: ['Rental providers are responsible for clearly stating:'],
        bullets: [
          'What is being rented;',
          'Rental price;',
          'Rental period;',
          'Availability;',
          'Location;',
          'Deposit requirements, if any;',
          'Conditions of use;',
          'Responsibility for damage or loss; and',
          'Any restrictions applicable to the rental.',
        ],
      },
      {
        title: 'Renter responsibilities',
        paragraphs: ['Renters are responsible for:'],
        bullets: [
          'Using rented property appropriately;',
          'Complying with agreed rental terms;',
          'Returning property as agreed;',
          'Taking reasonable care of rented property; and',
          'Paying any agreed lawful charges.',
        ],
      },
      {
        title: 'Rental agreements',
        paragraphs: [
          'UniMart does not automatically become a party to rental agreements between users.',
          'Users should clearly establish rental terms before handing over property.',
        ],
      },
    ],
  },
  {
    title: '10. Accommodation and Transport Listings',
    paragraphs: [
      'Certain rental or service listings may involve accommodation, transport or other activities that are subject to additional laws or licensing requirements.',
      'Users offering such services are responsible for obtaining and maintaining any permits, licenses, registrations, insurance or approvals required by applicable law.',
      'UniMart does not guarantee that accommodation or transport listings comply with all legal or safety requirements.',
      'Users should independently verify important details before making arrangements.',
    ],
  },
  {
    title: '11. Gigs and Jobs',
    paragraphs: ['UniMart may allow users to post short-term gigs, tasks and work opportunities.'],
    subsections: [
      {
        title: 'Gig poster responsibilities',
        paragraphs: ['Gig posters are responsible for providing accurate information about:'],
        bullets: [
          'The work required;',
          'Compensation or budget;',
          'Deadline;',
          'Location;',
          'Requirements;',
          'Expected deliverables; and',
          'Any other material conditions.',
        ],
      },
      {
        title: 'Applicant responsibility',
        paragraphs: ['Applicants are responsible for providing truthful information about their skills, experience and qualifications.'],
      },
      {
        title: 'No gig guarantees',
        paragraphs: ['UniMart does not guarantee:'],
        bullets: [
          'That a gig is genuine;',
          'That a gig poster will pay;',
          'That an applicant will perform the work;',
          'That an applicant will be selected;',
          'That the compensation is appropriate; or',
          'That any employment or contractual relationship will result.',
        ],
      },
      {
        title: 'Legal compliance for gigs',
        paragraphs: [
          'Users are responsible for complying with applicable employment, tax, labor and contractual laws.',
          'A gig listing on UniMart should not automatically be interpreted as an offer of formal employment.',
        ],
      },
    ],
  },
  {
    title: '12. Gig Applications',
    paragraphs: [
      'When applying for a gig, you agree to provide accurate information.',
      'Do not:',
    ],
    bullets: [
      'Submit fraudulent qualifications;',
      'Impersonate another person;',
      'Submit plagiarized work;',
      'Misrepresent your experience;',
      'Spam gig posters with repeated applications; or',
      'Use applications to distribute unrelated advertising or malicious content.',
    ],
    subsections: [
      {
        title: 'Gig poster conduct',
        paragraphs: [
          'Gig posters must not use UniMart to discriminate unlawfully, exploit applicants, request illegal activities or engage in abusive conduct.',
        ],
      },
    ],
  },
  {
    title: '13. Shops',
    paragraphs: ['Eligible users may create a shop on UniMart.', 'A shop may contain:'],
    bullets: [
      'Shop name;',
      'Logo;',
      'Description;',
      'Products;',
      'Services;',
      'Rentals;',
      'Contact information;',
      'University or campus;',
      'Location; and',
      'Other information permitted by the Platform.',
    ],
    subsections: [
      {
        title: 'Shop responsibility',
        paragraphs: ['Shop owners are responsible for ensuring that their shop information and listings are accurate.'],
      },
      {
        title: 'Shop enforcement',
        paragraphs: ['UniMart may suspend, restrict or remove a shop that:'],
        bullets: [
          'Violates these Terms;',
          'Contains prohibited goods or services;',
          'Engages in fraud;',
          'Receives credible reports of harmful conduct;',
          'Misuses the Platform; or',
          'Creates a risk to users or the Platform.',
        ],
      },
      {
        title: 'Following does not imply endorsement',
        paragraphs: ['Following a shop does not constitute endorsement by UniMart.'],
      },
    ],
  },
  {
    title: '14. Saved Listings and Favorites',
    paragraphs: ['Registered users may save listings for later reference.', 'Saving a listing does not:'],
    bullets: [
      'Reserve the item;',
      'Guarantee availability;',
      'Guarantee the listed price;',
      'Create a contract; or',
      'Give the user priority over other buyers.',
    ],
    subsections: [
      {
        title: 'Saved listing availability',
        paragraphs: ['A listing may be sold, removed, edited or become unavailable after being saved.'],
      },
    ],
  },
  {
    title: '15. Following Shops',
    paragraphs: [
      'Users may follow shops.',
      'Following a shop does not create a contractual relationship between the follower and the shop owner.',
      'Shop owners may receive notifications or aggregated information about followers as supported by the Platform.',
      'UniMart may modify how following works as the Platform develops.',
    ],
  },
  {
    title: '16. Transactions Between Users',
    paragraphs: [
      'Unless UniMart expressly provides a transaction or payment service for a particular feature, transactions are conducted directly between users.',
      'Users are responsible for agreeing on:',
    ],
    bullets: [
      'Price;',
      'Payment method;',
      'Delivery or collection;',
      'Timing;',
      'Condition;',
      'Returns or refunds;',
      'Rental terms;',
      'Service terms; and',
      'Other relevant conditions.',
    ],
    subsections: [
      {
        title: 'Direct agreements',
        paragraphs: [
          'UniMart is generally not a party to agreements formed between users.',
          'Users should retain relevant records of important transactions and communications.',
        ],
      },
    ],
  },
  {
    title: '17. Payments',
    paragraphs: [
      'Unless a particular UniMart feature expressly states otherwise, UniMart does not process or hold payments between buyers and sellers.',
      'Users should use lawful and reasonably secure payment methods.',
      'Do not send money merely because a listing appears on UniMart.',
      'UniMart may introduce payment functionality in the future. Any payment functionality introduced by UniMart may be governed by additional terms.',
    ],
  },
  {
    title: '18. Prohibited Goods, Services and Activities',
    paragraphs: [
      'Users must not list, promote, sell, rent, request or facilitate goods, services or activities that are illegal or prohibited by UniMart.',
      'Prohibited content may include, without limitation:',
    ],
    bullets: [
      'Illegal drugs or controlled substances;',
      'Weapons or prohibited weapon-related items;',
      'Explosives;',
      'Stolen property;',
      'Counterfeit goods;',
      'Fraudulent documents;',
      'Hacked or unlawfully obtained accounts;',
      'Malware or malicious software;',
      'Pornographic or sexually exploitative material;',
      'Exploitative sexual services;',
      'Human trafficking or exploitation;',
      'Gambling activities where prohibited;',
      'Items or services that violate applicable law;',
      'Dangerous goods that cannot lawfully be offered;',
      'Goods or services requiring licenses that the user does not possess;',
      'Content promoting criminal activity;',
      'Fraudulent investment schemes;',
      'Pyramid or unlawful schemes;',
      'Unauthorized academic cheating services;',
      'Sale of examination papers or leaked assessments;',
      'Services intended to facilitate academic dishonesty;',
      'Content that exploits minors;',
      'Personal information offered for sale; and',
      'Any other goods, services or activities prohibited by applicable law or UniMart policy.',
    ],
    subsections: [
      {
        title: 'Risk-based removal',
        paragraphs: ['UniMart may remove content that it reasonably believes presents legal, safety, fraud or reputational risks.'],
      },
    ],
  },
  {
    title: '19. Academic Integrity',
    paragraphs: ['UniMart supports legitimate academic services such as:'],
    bullets: [
      'Tutoring;',
      'Editing;',
      'Proofreading;',
      'Research assistance;',
      'Study support;',
      'Design and technical assistance.',
    ],
    subsections: [
      {
        title: 'Prohibited academic misconduct',
        paragraphs: ['Users must not use UniMart to facilitate academic fraud or dishonesty.', 'Prohibited activities include, where applicable:'],
        bullets: [
          'Completing examinations for another person;',
          'Completing graded assignments dishonestly on behalf of another student;',
          'Selling examination papers;',
          'Selling leaked examination answers;',
          'Impersonating students in assessments;',
          "Submitting another person's work as one's own; or",
          'Other activities intended to undermine legitimate academic assessment.',
        ],
      },
      {
        title: 'Academic listing moderation',
        paragraphs: ['UniMart may remove listings that facilitate academic misconduct.'],
      },
    ],
  },
  {
    title: '20. User Content',
    paragraphs: ['Users may upload or submit:', 'Collectively, this is referred to as "User Content."'],
    bullets: [
      'Listing information;',
      'Photos;',
      'Shop information;',
      'Profile information;',
      'Gig descriptions;',
      'Applications;',
      'Magazine articles;',
      'Comments or other permitted content.',
    ],
    subsections: [
      {
        title: 'Ownership and license',
        paragraphs: [
          'You retain ownership of original intellectual property rights that you own in your User Content.',
          'However, by submitting User Content to UniMart, you grant UniMart a non-exclusive, worldwide, royalty-free license to host, store, reproduce, display, format, distribute and otherwise use that content as reasonably necessary to operate, promote and improve the Platform.',
          'For example, UniMart may display a product photograph on a listing page or display an approved magazine article to other users.',
          'This license continues for as long as reasonably necessary to provide the relevant service, subject to applicable law and our Privacy Policy.',
          'You represent that you have the necessary rights and permissions to submit the content.',
        ],
      },
    ],
  },
  {
    title: '21. Magazine Contributions',
    paragraphs: [
      "UniMart's Campus Magazine allows users to submit articles and other editorial content.",
      'Submitting an article does not guarantee publication.',
      'UniMart may:',
    ],
    bullets: [
      'Review submissions;',
      'Edit submissions for grammar, clarity, formatting or length;',
      'Request changes;',
      'Approve submissions;',
      'Reject submissions;',
      'Unpublish previously published material; or',
      'Remove content that violates these Terms or editorial standards.',
    ],
    subsections: [
      {
        title: 'Contributor responsibility',
        paragraphs: ['Contributors remain responsible for ensuring that their submissions are original or appropriately licensed.', 'Do not submit:'],
        bullets: [
          'Plagiarized work;',
          'Defamatory material;',
          'False accusations;',
          'Confidential information;',
          'Private personal information without authorization;',
          'Copyright-infringing material;',
          'Hate speech;',
          'Threats;',
          'Fraudulent information; or',
          'Other unlawful content.',
        ],
      },
      {
        title: 'Publication and endorsement',
        paragraphs: ['Publication of an article does not necessarily mean that UniMart agrees with or endorses every opinion expressed by the author.'],
      },
    ],
  },
  {
    title: '22. Editorial Independence and User Opinions',
    paragraphs: [
      'Magazine articles, opinions, interviews, stories and other user-submitted editorial content may represent the views of their authors.',
      'Unless expressly stated otherwise, the opinions expressed in user-generated magazine content belong to the authors and do not necessarily represent the views of UniMart.',
      'UniMart reserves the right to moderate editorial content in accordance with its policies and applicable law.',
    ],
  },
  {
    title: '23. Intellectual Property',
    paragraphs: [
      "The UniMart name, logo, branding, design, software, interface, original graphics, trademarks and other proprietary elements of the Platform are owned by or licensed to UniMart unless otherwise stated.",
      'You may not:',
    ],
    bullets: [
      "Copy UniMart's software;",
      "Reproduce the Platform's proprietary design for commercial purposes;",
      "Use UniMart's trademarks without permission;",
      'Reverse engineer the Platform except where permitted by law;',
      'Scrape the Platform in a manner that violates these Terms or applicable law;',
      'Repackage UniMart content as your own product; or',
      "Use UniMart's intellectual property to create a competing service without authorization.",
    ],
    subsections: [
      {
        title: 'User content rights',
        paragraphs: ['User-generated content remains subject to the rights described in these Terms.'],
      },
    ],
  },
  {
    title: '24. Copyright Complaints',
    paragraphs: [
      'If you believe content on UniMart infringes your copyright or other intellectual property rights, you should contact UniMart with sufficient information to identify:',
    ],
    bullets: [
      'The protected work;',
      'The allegedly infringing material;',
      'Where the material appears on the Platform;',
      'Your contact details;',
      'Evidence that you own or are authorized to enforce the relevant rights; and',
      'Any other information reasonably necessary to investigate the complaint.',
    ],
    subsections: [
      {
        title: 'Complaint handling',
        paragraphs: [
          'UniMart may remove or restrict allegedly infringing content while investigating a complaint.',
          'Knowingly submitting false infringement claims may result in account action.',
        ],
      },
    ],
  },
  {
    title: '25. Prohibited User Conduct',
    paragraphs: ['You must not use UniMart to:'],
    bullets: [
      'Commit fraud;',
      'Scam other users;',
      'Harass or threaten users;',
      'Stalk users;',
      'Impersonate another person;',
      'Create fake identities for deceptive purposes;',
      'Manipulate listings;',
      'Manipulate engagement metrics;',
      'Spam users;',
      'Send unsolicited advertising;',
      'Attempt unauthorized access;',
      'Circumvent security measures;',
      'Introduce malware;',
      'Interfere with Platform operations;',
      'Scrape data abusively;',
      'Reverse engineer prohibited parts of the Platform;',
      'Collect personal information unlawfully;',
      'Publish private information without authorization;',
      'Discriminate unlawfully;',
      'Promote violence;',
      'Facilitate criminal activity;',
      'Upload malicious files;',
      'Manipulate reviews or ratings if such features are introduced;',
      'Circumvent suspensions or bans; or',
      'Use UniMart for any unlawful or abusive purpose.',
    ],
  },
  {
    title: '26. Fraud and Scams',
    paragraphs: ['UniMart takes fraudulent activity seriously.', 'Examples of potentially fraudulent conduct include:'],
    bullets: [
      'Advertising products that do not exist;',
      'Requesting payment for nonexistent products;',
      'Using stolen identities;',
      'Selling counterfeit products as genuine;',
      'Misrepresenting ownership;',
      'Creating fake shops;',
      'Posting fake gigs;',
      'Pretending to represent UniMart;',
      'Manipulating users into sending money;',
      'Using fake screenshots or payment confirmations; or',
      'Repeatedly failing to honor transactions in a deceptive manner.',
    ],
    subsections: [
      {
        title: 'Fraud enforcement',
        paragraphs: [
          'UniMart may suspend accounts, remove listings and cooperate with lawful investigations where appropriate.',
          'Users should report suspected scams through the Platform.',
        ],
      },
    ],
  },
  {
    title: '27. Safety',
    paragraphs: ['Users should exercise reasonable caution when interacting with other users.', 'When meeting someone in person, consider:'],
    bullets: [
      'Meeting in a public place;',
      'Meeting during daylight where practical;',
      'Informing someone you trust about the meeting;',
      'Avoiding unnecessary disclosure of personal information;',
      'Inspecting products before payment where appropriate; and',
      'Using secure payment methods.',
    ],
    subsections: [
      {
        title: 'Personal safety',
        paragraphs: [
          'Do not put yourself in danger to complete a transaction.',
          'If a user makes you feel unsafe, discontinue the interaction and report the matter to UniMart and the appropriate authorities where necessary.',
          'UniMart cannot guarantee the safety of every interaction between users.',
        ],
      },
    ],
  },
  {
    title: '28. User Reports',
    paragraphs: ['Users may report suspected:'],
    bullets: [
      'Fraud;',
      'Scams;',
      'Harassment;',
      'Prohibited listings;',
      'Inappropriate content;',
      'Fake accounts;',
      'Copyright violations;',
      'Dangerous activities; or',
      'Other violations.',
    ],
    subsections: [
      {
        title: 'Report handling',
        paragraphs: [
          'Submitting a report does not guarantee that UniMart will take a particular action.',
          'UniMart may investigate reports and take action it considers appropriate.',
        ],
      },
    ],
  },
  {
    title: '29. Content Moderation',
    paragraphs: [
      'UniMart reserves the right, but does not assume an obligation, to review, restrict, remove or disable access to content that:',
    ],
    bullets: [
      'Violates these Terms;',
      'Violates applicable law;',
      'Is reported by users;',
      'Is harmful or unsafe;',
      'Is fraudulent;',
      'Infringes intellectual property rights;',
      'Contains prohibited material; or',
      'Presents a risk to the Platform or its users.',
    ],
    subsections: [
      {
        title: 'Moderation actions',
        paragraphs: ['Moderation decisions may include:'],
        bullets: [
          'Removing a listing;',
          'Hiding content;',
          'Suspending a shop;',
          'Suspending an account;',
          'Rejecting an article;',
          'Unpublishing an article;',
          'Restricting specific features; or',
          'Terminating an account.',
        ],
      },
      {
        title: 'Appeals',
        paragraphs: ['Where appropriate, UniMart may provide an explanation or appeal mechanism.'],
      },
    ],
  },
  {
    title: '30. Account Suspension and Termination',
    paragraphs: ['UniMart may suspend or terminate an account where it reasonably believes that:'],
    bullets: [
      'The user violated these Terms;',
      'The user violated applicable law;',
      'The account is involved in fraud;',
      'The account creates a safety risk;',
      'The account compromises Platform security;',
      'The user repeatedly violates community standards; or',
      'Continued access is otherwise inappropriate.',
    ],
    subsections: [
      {
        title: 'Notice and immediate action',
        paragraphs: [
          'Where reasonably practical, UniMart may provide notice of suspension or termination.',
          'However, immediate action may be taken where necessary to protect users, the Platform or comply with legal requirements.',
          'Users may stop using UniMart at any time.',
        ],
      },
    ],
  },
  {
    title: '31. Effects of Termination',
    paragraphs: ['When an account is terminated:'],
    bullets: [
      'Access to account features may be disabled;',
      'Listings may be removed or hidden;',
      'Shops may be disabled;',
      'Saved items may no longer be accessible;',
      'Gig applications may no longer be accessible;',
      'Magazine submissions may be affected; and',
      'Other account-associated features may become unavailable.',
    ],
    subsections: [
      {
        title: 'Retention after termination',
        paragraphs: ['Certain information may be retained where required for:'],
        bullets: [
          'Legal compliance;',
          'Fraud prevention;',
          'Security;',
          'Dispute resolution;',
          'Accounting;',
          'Enforcement of these Terms; or',
          'Other legitimate purposes.',
        ],
      },
    ],
  },
  {
    title: '32. Third-Party Services',
    paragraphs: [
      'UniMart may rely on third-party services, including authentication, hosting, database, analytics, communications or other technology providers.',
      'Third-party services may have their own terms and privacy policies.',
      'UniMart is not responsible for the independent policies or practices of third-party providers.',
      'Where UniMart links to third-party websites or services, you access them at your own discretion.',
    ],
  },
  {
    title: '33. Availability of the Platform',
    paragraphs: [
      'UniMart aims to provide a reliable service but does not guarantee that the Platform will always be:',
    ],
    bullets: [
      'Available;',
      'Uninterrupted;',
      'Error-free;',
      'Secure from every possible threat; or',
      'Free of defects.',
    ],
    subsections: [
      {
        title: 'Possible service interruptions',
        paragraphs: ['The Platform may occasionally be unavailable due to:'],
        bullets: [
          'Maintenance;',
          'Updates;',
          'Technical problems;',
          'Network failures;',
          'Third-party service outages;',
          'Security incidents;',
          'Force majeure events; or',
          "Other circumstances beyond UniMart's reasonable control.",
        ],
      },
    ],
  },
  {
    title: '34. Changes to the Platform',
    paragraphs: ['UniMart may modify, add, remove or discontinue features.', 'This may include changes to:'],
    bullets: [
      'Marketplace functionality;',
      'Search;',
      'Categories;',
      'Shop features;',
      'Magazine features;',
      'Notifications;',
      'User interface;',
      'Account functionality; and',
      'Other Platform services.',
    ],
    subsections: [
      {
        title: 'Feature continuity',
        paragraphs: ['UniMart does not guarantee that any particular feature will remain available indefinitely.'],
      },
    ],
  },
  {
    title: '35. Accuracy of Information',
    paragraphs: [
      'UniMart attempts to provide useful and accurate Platform information but does not guarantee that all information is complete, accurate, current or error-free.',
      'Marketplace information is generally supplied by users.',
      'Users should independently verify important information before relying on it.',
      'Prices, availability and other listing details may change without notice.',
    ],
  },
  {
    title: '36. No Guarantee of Transactions',
    paragraphs: ['UniMart does not guarantee that:'],
    bullets: [
      'A listing will receive interest;',
      'A seller will find a buyer;',
      'A buyer will find a product;',
      'A service provider will receive customers;',
      'A gig will receive applicants;',
      'An applicant will obtain a gig;',
      'A rental will be completed;',
      'A transaction will be successful; or',
      'A user will make money through UniMart.',
    ],
    subsections: [
      {
        title: 'Commercial outcomes',
        paragraphs: ['UniMart provides the platform and tools for discovery and interaction but does not guarantee commercial outcomes.'],
      },
    ],
  },
  {
    title: '37. Disclaimer of Warranties',
    paragraphs: [
      'To the maximum extent permitted by applicable law, UniMart provides the Platform on an "as available" and "as is" basis.',
      'Except where expressly required by law, UniMart does not provide warranties regarding:',
    ],
    bullets: [
      'The accuracy of user-generated content;',
      'The quality of products;',
      'The quality of services;',
      'The safety of rental items;',
      'The reliability of users;',
      'The legitimacy of gigs;',
      'The accuracy of magazine content;',
      'The availability of listings;',
      'The suitability of a particular seller or provider; or',
      'The uninterrupted operation of the Platform.',
    ],
    subsections: [
      {
        title: 'Non-excludable rights',
        paragraphs: ['Nothing in these Terms excludes rights or protections that cannot legally be excluded.'],
      },
    ],
  },
  {
    title: '38. Limitation of Liability',
    paragraphs: [
      'To the maximum extent permitted by applicable law, UniMart and its owners, operators, employees, affiliates, contractors and service providers will not be liable for indirect, incidental, special, consequential or punitive losses arising from:',
    ],
    bullets: [
      'User-to-user transactions;',
      'Products purchased through the Platform;',
      'Services obtained through the Platform;',
      'Rental arrangements;',
      'Gig arrangements;',
      'Communications between users;',
      'User-generated content;',
      'Unauthorized conduct of another user;',
      'Loss of data;',
      'Platform interruptions;',
      'Third-party services; or',
      'Other use of the Platform.',
    ],
    subsections: [
      {
        title: 'Statutory rights preserved',
        paragraphs: [
          'This limitation does not apply to liability that cannot legally be excluded or limited under applicable law.',
          'Nothing in these Terms is intended to remove statutory rights that users may have under applicable law.',
        ],
      },
    ],
  },
  {
    title: '39. Indemnification',
    paragraphs: ['To the extent permitted by law, you agree to indemnify and hold harmless UniMart and its owners, operators, employees, affiliates and service providers from claims, losses, liabilities, damages and expenses arising from:'],
    bullets: [
      'Your violation of these Terms;',
      'Your unlawful conduct;',
      'Your User Content;',
      "Your infringement of another person's rights;",
      'Your fraudulent activity;',
      'Your transactions with other users; or',
      'Your misuse of the Platform.',
    ],
    subsections: [
      {
        title: 'Limit on indemnity',
        paragraphs: ['This provision does not require you to indemnify UniMart for matters caused by UniMart\'s own unlawful conduct or liability that cannot legally be transferred to you.'],
      },
    ],
  },
  {
    title: '40. Privacy',
    paragraphs: [
      'Your use of UniMart is also governed by the UniMart Privacy Policy.',
      'The Privacy Policy explains:',
    ],
    bullets: [
      'What personal information UniMart collects;',
      'How information is used;',
      'How information is protected;',
      'When information may be shared;',
      'User rights;',
      'Data retention; and',
      'Other privacy practices.',
    ],
    subsections: [
      {
        title: 'Privacy acknowledgement',
        paragraphs: ['By using UniMart, you acknowledge that you have had an opportunity to review the Privacy Policy.'],
      },
    ],
  },
  {
    title: '41. Personal Information in Listings',
    paragraphs: ['Do not include unnecessary personal information in public listings.', "Users should not publish another person's:"],
    bullets: [
      'Phone number;',
      'Home address;',
      'Identification documents;',
      'Financial information;',
      'Passwords;',
      'Private communications; or',
      'Other sensitive information',
    ],
    subsections: [
      {
        title: 'Personal information restrictions',
        paragraphs: ['without lawful authorization.', 'UniMart may remove content containing inappropriate personal information.'],
      },
    ],
  },
  {
    title: '42. Communications',
    paragraphs: ['By creating an account, you may receive service-related communications such as:'],
    bullets: [
      'Account notifications;',
      'Security alerts;',
      'Gig application notifications;',
      'Listing activity notifications;',
      'Shop notifications;',
      'Magazine notifications;',
      'Important Platform announcements.',
    ],
    subsections: [
      {
        title: 'Marketing opt-out',
        paragraphs: [
          'Where legally required, marketing communications will provide appropriate ways to opt out.',
          'Opting out of marketing messages does not necessarily disable essential service or security communications.',
        ],
      },
    ],
  },
  {
    title: '43. Notifications',
    paragraphs: ['UniMart may generate notifications based on activity on the Platform.', 'For example:'],
    bullets: [
      'A listing may receive a save;',
      'A shop may receive a follower;',
      'A gig may receive an application;',
      'An article may be approved.',
    ],
    subsections: [
      {
        title: 'Delivery timing',
        paragraphs: ['Notification delivery may depend on technical availability and may not always be instantaneous.'],
      },
    ],
  },
  {
    title: '44. Third-Party Content and Links',
    paragraphs: ['UniMart may contain links or references to external websites.', 'UniMart does not control those websites and is not responsible for:'],
    bullets: [
      'Their content;',
      'Their availability;',
      'Their security;',
      'Their privacy practices; or',
      'Their terms.',
    ],
    subsections: [
      {
        title: 'External service review',
        paragraphs: ['You should review the terms and privacy policies of external services before using them.'],
      },
    ],
  },
  {
    title: '45. Advertising and Promotional Content',
    paragraphs: [
      'The MVP may not include paid advertising.',
      'If advertising, sponsored listings or promotional placements are introduced in the future, UniMart may establish additional policies governing such content.',
      'Sponsored content should be identified appropriately where required.',
    ],
  },
  {
    title: '46. Future Features',
    paragraphs: [
      'UniMart may introduce additional functionality in the future, including marketplace tools, payments, subscriptions, promotional services or other features.',
      'New features may be governed by additional terms.',
      'If a feature requires separate terms, users will be required to agree to those terms before using the relevant feature where appropriate.',
    ],
  },
  {
    title: '47. Changes to These Terms',
    paragraphs: ['UniMart may update these Terms to reflect:'],
    bullets: [
      'Changes to the Platform;',
      'Changes in law;',
      'New features;',
      'Security requirements;',
      'Business changes; or',
      'User feedback.',
    ],
    subsections: [
      {
        title: 'Effective date and notice',
        paragraphs: [
          'The updated version will indicate its effective date.',
          'Material changes may be communicated through reasonable means.',
        ],
      },
    ],
  },
  {
    title: '48. Governing Law',
    paragraphs: [
      'These Terms shall be governed by and interpreted in accordance with the laws of Uganda, subject to any mandatory legal protections or rights that apply to users.',
      'Where a dispute cannot be resolved informally, the parties will seek resolution through the courts or other legally recognized dispute-resolution mechanisms having appropriate jurisdiction in Uganda.',
      'Nothing in this section prevents a user from exercising mandatory legal rights available to them under applicable law.',
    ],
  },
  {
    title: '49. Dispute Resolution',
    paragraphs: [
      'If you have a dispute with UniMart, we encourage you to contact us first so that we can attempt to resolve the issue informally.',
      'Before commencing formal proceedings, where appropriate, you should provide:',
    ],
    bullets: [
      'Your name;',
      'Account information;',
      'Description of the issue;',
      'Relevant listing or content;',
      'Relevant dates;',
      'Supporting evidence; and',
      'The resolution you are seeking.',
    ],
    subsections: [
      {
        title: 'Dispute handling',
        paragraphs: [
          'UniMart will review legitimate complaints and respond within a reasonable period.',
          "Disputes between users should ordinarily be resolved directly between the parties unless UniMart's involvement is appropriate under its moderation policies or applicable law.",
        ],
      },
    ],
  },
  {
    title: '50. No Agency Relationship',
    paragraphs: ['Using UniMart does not create a:'],
    bullets: [
      'Partnership;',
      'Joint venture;',
      'Employment relationship;',
      'Agency relationship; or',
      'Franchise relationship',
    ],
    subsections: [
      {
        title: 'Independent use',
        paragraphs: ['between you and UniMart.', 'Users are responsible for their own activities and transactions.'],
      },
    ],
  },
  {
    title: '51. No Professional Advice',
    paragraphs: [
      'Information provided through UniMart, including magazine articles, tips, guides, listings and user-generated content, should not automatically be treated as professional advice.',
      'This includes:',
    ],
    bullets: [
      'Medical advice;',
      'Legal advice;',
      'Financial advice;',
      'Academic advice;',
      'Technical advice; or',
      'Other professional advice.',
    ],
    subsections: [
      {
        title: 'Professional consultation',
        paragraphs: ['Where professional advice is required, users should consult a suitably qualified professional.'],
      },
    ],
  },
  {
    title: '52. Force Majeure',
    paragraphs: ['UniMart will not be responsible for delays or failures caused by circumstances beyond its reasonable control, including:'],
    bullets: [
      'Natural disasters;',
      'Internet or telecommunications failures;',
      'Government actions;',
      'Civil unrest;',
      'War;',
      'Public emergencies;',
      'Cyber incidents;',
      'Infrastructure failures;',
      'Power failures;',
      'Third-party service interruptions; or',
      'Other events beyond reasonable control.',
    ],
  },
  {
    title: '53. Severability',
    paragraphs: [
      'If any provision of these Terms is found to be unlawful, invalid or unenforceable, that provision will be interpreted or modified to the minimum extent necessary to make it enforceable where legally possible.',
      'The remaining provisions will continue in effect.',
    ],
  },
  {
    title: '54. Waiver',
    paragraphs: [
      'If UniMart does not immediately enforce a provision of these Terms, that does not mean UniMart has permanently waived its right to enforce that provision.',
      'Any waiver must be made appropriately and does not automatically apply to future violations.',
    ],
  },
  {
    title: '55. Entire Agreement',
    paragraphs: [
      'These Terms, together with any policies expressly incorporated into them, constitute the agreement between you and UniMart regarding your use of the Platform.',
      'They supersede prior understandings regarding the same subject matter to the extent permitted by law.',
    ],
  },
  {
    title: '56. Assignment',
    paragraphs: [
      'You may not transfer your rights or obligations under these Terms without UniMart\'s prior written consent where such consent is required.',
      'UniMart may transfer or assign its rights and obligations in connection with a merger, acquisition, restructuring, sale of assets or other legitimate business transaction, subject to applicable law.',
    ],
  },
  {
    title: '57. Contacting UniMart',
    paragraphs: [
      'If you have questions, complaints, reports or requests regarding these Terms, please contact UniMart through the official contact channels provided on the Platform.',
      'For account, safety, fraud, intellectual property or legal concerns, provide enough information for UniMart to understand and investigate the issue.',
    ],
  },
  {
    title: '58. Acknowledgement',
    paragraphs: ['By using UniMart, you acknowledge that:'],
    bullets: [
      'You have read these Terms;',
      'You understand how the Platform operates;',
      'You understand that many listings are created by independent users;',
      'You are responsible for your own interactions and transactions;',
      'You will use the Platform lawfully;',
      'You will provide truthful information;',
      'You will respect other users;',
      'You will not misuse the Platform; and',
      'You agree to comply with these Terms.',
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

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <Link href={marketPaths.home} className="inline-block">
        <BrandLogo showWordmark size={34} wordmarkClassName="text-xl" />
      </Link>

      <h1 className="mt-8 font-display text-[2rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.5rem]">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-[#8b9994]">Last updated: 18 August 2026</p>

      <div className="mt-8 space-y-6 text-base leading-7 text-[#5f746c]">
        <p>Welcome to <strong className="text-[#243e39]">UniMart</strong>.</p>
        <p>
          These Terms of Service (&quot;Terms&quot;, &quot;Terms of Service&quot; or
          &quot;Agreement&quot;) govern your access to and use of the UniMart website,
          application, marketplace, services, features and related content
          (collectively, the &quot;Platform&quot;).
        </p>
        <p>
          UniMart is a campus marketplace and community platform that enables
          users to discover and list products, services, rentals and gigs,
          create and follow shops, save listings, apply for gigs, and read or
          contribute to a moderated campus magazine.
        </p>
        <p>
          By creating an account, accessing, browsing or using UniMart, you
          agree to be bound by these Terms. If you do not agree with these
          Terms, you must not use the Platform.
        </p>
        <p>
          These Terms apply to all users, including visitors, registered users,
          sellers, service providers, renters, gig posters, gig applicants,
          shop owners, magazine contributors and administrators.
        </p>

        {termsSections.map((section) => (
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
              Thank you for being part of UniMart.
            </strong>
          </p>
          <p>
            UniMart exists to make it easier for campus communities to{' '}
            <strong className="text-[#243e39]">
              Buy · Sell · Hire · Connect
            </strong>
            .
          </p>
        </section>
      </div>
    </div>
  )
}

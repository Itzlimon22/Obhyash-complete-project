export interface PolicySection {
  id?: number;
  title: string;
  content: string[];
  callout?: string;
}

export interface PolicyDocument {
  title: string;
  subtitle: string;
  lastUpdated: string;
  badge: string;
  description: string;
  sections: PolicySection[];
}

export const LEGAL_CONTENT: {
  about: PolicyDocument;
  privacy: PolicyDocument;
  terms: PolicyDocument;
  refund: PolicyDocument;
} = {
  about: {
    title: 'About Obhyash',
    subtitle: 'Next-Generation AI-Powered Learning and Examination Platform',
    lastUpdated: 'September 15, 2026',
    badge: 'About Us',
    description:
      'Obhyash is an advanced, technology-driven educational examination platform specifically engineered for students preparing for HSC, SSC, and university admission examinations in Bangladesh. We combine structured question banks, intelligent analytics, and adaptive learning workflows to make exam mastery accessible, engaging, and remarkably efficient.',
    sections: [
      {
        id: 1,
        title: 'Our Mission & Vision',
        content: [
          'Our mission is to democratize high-caliber academic preparation across Bangladesh by delivering smart, affordable, and personalized assessment tools.',
          'We believe true academic excellence is built through deliberate, continuous practice rather than rote memorization. Obhyash empowers every learner to identify their knowledge gaps with precision and systematically achieve their highest potential.',
        ],
      },
      {
        id: 2,
        title: 'Core Platform Offerings',
        content: [
          'Smart Practice & Question Banks: High-yield, categorized chapter-wise and topic-wise MCQ questions thoroughly aligned with the latest national curriculum.',
          'Detailed Explanations & Scientific Accuracy: Clear step-by-step solutions, mathematical proofs, and diagnostic feedback for every question.',
          'Live Competitive Model Tests: Nation-wide scheduled live examinations with realistic timers, negative marking, and real-time national leaderboard ranking.',
          'Adaptive Habit Tracking: Daily streak rewards, XP progression, and personalized flashcard revision schedules to maintain peak learning momentum.',
        ],
      },
      {
        id: 3,
        title: 'Platform Ownership & Operations',
        content: [
          'Obhyash is designed, developed, and maintained by S. M Sahabul Alam and the Obhyash Core Engineering Team based in Khulna, Bangladesh.',
          'For institutional partnerships, developer inquiries, or general questions, please reach out to our official desk at support@obhyash.com.',
        ],
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Transparent, Secure, and Comprehensive User Data Protection',
    lastUpdated: 'September 15, 2026',
    badge: 'Privacy Policy',
    description:
      'At Obhyash, we hold user privacy and confidentiality as a paramount responsibility. This Privacy Policy details how we collect, process, store, and safeguard your personal and academic information when you use our mobile application and web services.',
    sections: [
      {
        id: 1,
        title: '1. Information We Collect',
        content: [
          'Account & Profile Information: When registering an account, we may collect your full name, email address, phone number, academic institution, HSC/SSC target batch, and profile avatar.',
          'Academic & Examination Data: We record your practice test results, live examination responses, question attempt timelines, subject scores, XP points, and daily streak progress.',
          'Technical & Device Information: Basic diagnostic information such as device model, operating system version, unique device identifiers, IP address, and application crash diagnostics are collected to ensure stability and prevent multi-device security fraud.',
        ],
      },
      {
        id: 2,
        title: '2. How We Use Your Information',
        content: [
          'To provide, operate, and enhance your personalized exam preparation experience.',
          'To calculate and display real-time leaderboard positions and comparative academic analytics.',
          'To deliver important platform notifications, security alerts, and subscription activation receipts.',
          'To enforce platform security, anti-cheating protocols, and maintain single-device login integrity during live exams.',
        ],
        callout:
          'We strictly do NOT sell, rent, or monetize your personal or academic data to any third-party advertisers or commercial entities under any circumstances.',
      },
      {
        id: 3,
        title: '3. Third-Party Service Providers',
        content: [
          'Supabase Cloud: Used for secure database storage, automated backups, and encrypted token-based authentication.',
          'Google Play Services & Firebase: Used for application distribution, crash reporting, and cloud messaging notifications.',
          'Payment Processors: Online transactions are processed through authorized payment gateways (such as UddoktaPay and Google Play In-App Billing). We never store raw credit/debit card numbers or mobile banking PINs on our servers.',
        ],
      },
      {
        id: 4,
        title: '4. User Data Deletion & Account Erasure (Google Play Compliant)',
        content: [
          'In-App Deletion: Users can permanently delete their account and associated data directly within the Obhyash mobile app or website by navigating to Profile > Settings > Delete Account.',
          'Email Request: You may also email us directly at support@obhyash.com with the subject line "Request Account Deletion" from your registered email address.',
          'Deletion Scope: Upon confirmation, your profile data, exam histories, streak records, and authentication credentials will be permanently purged from our primary databases within 30 days, except where retention is legally mandated.',
        ],
        callout:
          'You have the full legal right to review, update, or permanently delete your stored personal data at any time without fees.',
      },
      {
        id: 5,
        title: '5. Data Security Measures',
        content: [
          'All communication between your device and our servers is secured using industry-standard SSL/TLS (HTTPS) encryption.',
          'Sensitive credentials including passwords are encrypted using secure cryptographic hashing algorithms.',
          'Access to server infrastructure is restricted to authorized personnel under strict multi-factor authentication protocols.',
        ],
      },
      {
        id: 6,
        title: "6. Children's Privacy",
        content: [
          'Obhyash is designed primarily for high school, college, and university admission candidates.',
          'We do not knowingly collect personally identifiable information from children under the age of 13 without verifiable parental or guardian consent. If you believe a child under 13 has provided personal information without consent, contact us immediately at support@obhyash.com for prompt deletion.',
        ],
      },
      {
        id: 7,
        title: '7. Policy Updates & Contact',
        content: [
          'We may periodically update this Privacy Policy to reflect platform improvements or regulatory guidelines. Continued use of Obhyash after updates constitutes acceptance of the modified policy.',
          'If you have any questions or feedback regarding our privacy practices, please contact our Data Protection desk at support@obhyash.com.',
        ],
      },
    ],
  },

  terms: {
    title: 'Terms & Conditions',
    subtitle: 'Standard Agreement and User Guidelines for Obhyash',
    lastUpdated: 'September 15, 2026',
    badge: 'Terms of Service',
    description:
      'Welcome to Obhyash. By accessing or using our mobile application, web dashboard, or related educational services, you signify that you have read, understood, and agreed to be bound by the following Terms and Conditions.',
    sections: [
      {
        id: 1,
        title: '1. User Account & Registration',
        content: [
          'Eligibility: You must provide accurate, current, and complete information during registration and keep your profile information updated.',
          'Account Confidentiality: You are responsible for safeguarding your login credentials and for all activities that occur under your account.',
          'Single-User Policy: Each account is licensed exclusively for personal, individual use. Account sharing, credential reselling, or unauthorized multi-device sharing is strictly prohibited.',
        ],
      },
      {
        id: 2,
        title: '2. Intellectual Property Rights',
        content: [
          'All software code, question explanations, diagrams, user interfaces, branding, and proprietary question compilations are the exclusive intellectual property of Obhyash and its creators.',
          'You are granted a limited, personal, non-exclusive, non-transferable license to access study materials for personal exam preparation only.',
          'No part of the platform content may be scraped, reverse-engineered, reproduced, re-distributed, or commercially exploited without prior written authorization.',
        ],
        callout:
          'Unauthorized automated scraping or distribution of Obhyash examination databases will result in immediate termination and legal action under the Copyright & Cyber Security Acts.',
      },
      {
        id: 3,
        title: '3. Examination Conduct & Fair Play',
        content: [
          'Live examinations and national rankings require strict adherence to fair play standards.',
          'The use of automated bots, browser extensions, developer tools, or screen capture software to exploit answer keys or artificially manipulate rankings is strictly prohibited.',
          'Obhyash reserves the right to disqualify scores, suspend accounts, or revoke leaderboard privileges in cases of verified cheating or integrity violations.',
        ],
      },
      {
        id: 4,
        title: '4. Subscriptions & Premium Packages',
        content: [
          'Certain advanced features, unlimited model tests, and detailed solution archives may require a paid Pro subscription or package pass.',
          'All fees are clearly stated prior to purchase. Transactions processed via authorized payment partners are subject to our Refund Policy.',
        ],
      },
      {
        id: 5,
        title: '5. Limitation of Liability',
        content: [
          'Obhyash provides study materials and predictive scoring as educational aids. We do not guarantee admission into any specific educational institution or specific board exam outcomes.',
          'Services are provided on an "as is" and "as available" basis without warranties of uninterrupted availability during scheduled server maintenance.',
        ],
      },
      {
        id: 6,
        title: '6. Governing Law & Dispute Resolution',
        content: [
          'These Terms shall be governed and interpreted in accordance with the laws of the People’s Republic of Bangladesh.',
          'For any disputes or grievances, parties agree to first seek amicable informal resolution by contacting support@obhyash.com.',
        ],
      },
    ],
  },

  refund: {
    title: 'Refund Policy',
    subtitle: 'Transparent, Fair, and Timely Payment Protection',
    lastUpdated: 'September 15, 2026',
    badge: 'Refund Policy',
    description:
      'We want you to have complete confidence when investing in your education on Obhyash. This Refund Policy outlines the terms and conditions under which refunds are reviewed and issued for subscription purchases and digital goods.',
    sections: [
      {
        id: 1,
        title: '1. 48-Hour Satisfaction Window',
        content: [
          'If you purchase an Obhyash Pro subscription and encounter severe technical issues that prevent you from using the service, you may request a full refund within 48 hours of the initial transaction.',
          'To be eligible, the request must be submitted within 48 hours of purchase along with proof of payment (Transaction ID / TrxID).',
        ],
      },
      {
        id: 2,
        title: '2. Eligibility Criteria for Refunds',
        content: [
          'Accidental Duplicate Payment: In the event of dual-charging or billing gateway errors for a single subscription, the duplicate amount will be refunded in full.',
          'Unresolved Service Unavailability: If a paid feature remains inaccessible for more than 72 consecutive hours due to server-side outages and our technical support cannot resolve it.',
          'Payment Deducted but Subscription Not Activated: If your mobile banking/card was charged but the subscription was not credited, we will either manually activate your plan immediately or issue a complete refund.',
        ],
      },
      {
        id: 3,
        title: '3. Non-Refundable Scenarios',
        content: [
          'Requests submitted after the 48-hour window from the time of purchase.',
          'Accounts terminated or suspended due to severe policy violations, cheating in live exams, or unauthorized content distribution.',
          'Change of mind or lack of personal study time after substantial consumption of premium tests and question solutions.',
          'In-App Purchases made directly via Apple App Store or Google Play Store must be requested through Google or Apple’s standard customer refund flow according to their store terms.',
        ],
        callout:
          'Please ensure you review the plan details and free sample mock tests before purchasing a subscription.',
      },
      {
        id: 4,
        title: '4. How to Request a Refund',
        content: [
          'Email our dedicated payments desk at support@obhyash.com with the subject line "Refund Request - [Your Registered Email]".',
          'Include your registered phone number, Date of Transaction, and Payment TrxID/Order ID in your message.',
          'Our team reviews all refund requests within 24 to 48 business hours. Once approved, the funds are credited back to your original payment method (bKash, Nagad, or Bank Card) within 5 to 7 working days.',
        ],
      },
    ],
  },
};

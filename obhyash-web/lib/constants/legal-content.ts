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
    subtitle: 'Practices and Policies to Protect User Personal Information',
    lastUpdated: 'September 15, 2026',
    badge: 'Privacy Policy',
    description:
      'This is the privacy policy for Obhyash (obhyash.com and the Obhyash mobile application). This document outlines the practices and policies Obhyash uses to protect the personal information of its users. These include:',
    sections: [
      {
        id: 1,
        title: 'Privacy',
        content: [
          'Your privacy is of utmost importance to us. We follow stringent procedures to protect the security of the information and data stored on our platform. The information that you have shared with us is stored on secure servers with modern encryption and can be accessed only for authorized official purposes. Any of our team members who violate our privacy or data security policies related to user data are subject to strict disciplinary action, including termination and civil and/or criminal prosecution.',
        ],
      },
      {
        id: 2,
        title: 'Registration',
        content: [
          'On signing up on Obhyash (via our website or mobile app), users are required to provide certain basic mandatory information such as their full name, email address, password, and academic institution/batch. This information is used to securely authenticate the user’s account and personalize their preparation every time they visit the platform.',
        ],
      },
      {
        id: 3,
        title: 'Information Collection',
        content: [
          'Obhyash collects both anonymous and personally identifiable information from users, including basic profile details, device diagnostic information, and academic practice data, to improve security, analyze learning trends, and administer the platform effectively.',
        ],
      },
      {
        id: 4,
        title: 'Information Usage',
        content: [
          'Information that users provide is used for delivering exams, calculating leaderboards and streak progress, improving platform features, responding to support requests, and communicating important service updates. Obhyash maintains strict policies and does not share, rent, or sell personal information to external advertisers or unauthorized third parties.',
        ],
      },
      {
        id: 5,
        title: 'Cookies & Local Storage',
        content: [
          'Obhyash uses cookies and secure local storage to identify a user’s device or "session" for improving user experience and maintaining seamless login sessions. Users can configure their browser or device settings to clear or restrict cookies, though some interactive features may require session data to operate properly.',
        ],
      },
      {
        id: 6,
        title: 'Security Measures',
        content: [
          'Obhyash has in place appropriate technical and security measures to prevent unauthorized or unlawful access to, or accidental loss of, destruction, or damage to user information. All network transmissions are protected using industry-standard SSL/TLS (HTTPS) encryption, and sensitive credentials are encrypted using cryptographic hashing. Despite these measures, users should note that transmitting information via the internet is never completely immune to risks, and accounts should be kept confidential.',
          'By using the Obhyash platform and providing personal information, users agree to the terms of Obhyash’s online privacy policy and to its processing of such personal information for the purposes explained in this policy.',
        ],
      },
      {
        id: 7,
        title: 'Data Deletion Request',
        content: [
          'At Obhyash, we respect your right to privacy and control over your personal information. You can request the deletion of your account and all associated data at any time.',
          '• Through App Settings: Simply navigate to the settings screen in our app or web portal and click on the "Delete Account" button to permanently delete your account and personal records.',
          '• Via Email Request: You may also contact us by sending an email from your registered address to support@obhyash.com with the subject line "Request Account Deletion".',
          'We will process your request promptly and ensure that your data is permanently removed in accordance with relevant data protection laws.',
        ],
      },
    ],
  },

  terms: {
    title: 'Terms and Conditions',
    subtitle: 'User Agreement and Service Guidelines for Obhyash',
    lastUpdated: 'September 15, 2026',
    badge: 'Terms of Service',
    description:
      'Obhyash (obhyash.com and the Obhyash mobile application) is owned and operated by us. This user agreement defines the guidelines and terms for using Obhyash. By accessing or using our platform, you signify your consent to these user guidelines.',
    sections: [
      {
        id: 1,
        title: 'Usage of Cookies',
        content: [
          'Our platform makes use of cookies and secure device storage. By browsing Obhyash, you agree to our use of cookies in accordance with Obhyash’s Privacy Policy. Cookies and session storage help us remember user details for each visit and enable key examination functionalities, making your experience more seamless.',
        ],
      },
      {
        id: 2,
        title: 'Copyright and Licenses',
        content: [
          'Unless otherwise indicated, Obhyash and/or its licensors hold the copyright and intellectual property rights for all material on Obhyash. All copyright is strictly reserved. You are allowed to access this material from Obhyash exclusively for your personal, non-commercial exam preparation, subject to the restrictions mentioned in these user guidelines.',
        ],
      },
      {
        id: 3,
        title: 'Prohibitions:',
        content: [
          '• You must not republish, scrape, or extract question sets or materials from Obhyash.',
          '• You are prohibited from selling, renting, or sub-licensing content or subscriptions from Obhyash.',
          '• You are forbidden from reproducing, duplicating, downloading, or copying proprietary examination content from Obhyash.',
          '• You must not redistribute, broadcast, or circulate platform materials across external channels.',
        ],
      },
      {
        id: 4,
        title: 'Fair Use Policy',
        content: [
          'Users must comply with our Fair Use Policy and utilize Obhyash strictly for personal, intended educational purposes. Any misuse, automated scraping, account sharing, or unauthorized access is strictly prohibited. Violating our Fair Use Policy may result in temporary suspension or a permanent ban of your account.',
        ],
      },
      {
        id: 5,
        title: 'Reliability of Content',
        content: [
          'Obhyash exerts the utmost effort to ensure the integrity and accuracy of the content on this platform. However, it disclaims all warranties, explicit or implied, regarding the absolute accuracy of the information found on this platform, except as permitted by applicable law.',
        ],
      },
      {
        id: 6,
        title: 'Delivery Time:',
        content: [
          'Upon payment, you will immediately receive the chosen plan and features activated on your account.',
        ],
      },
      {
        id: 7,
        title: 'Limitation of Liability for Content',
        content: [
          'While we strive to ensure that the information on this platform is accurate, we do not guarantee its completeness or correctness; nor do we commit to ensuring that the platform remains accessible without interruption or that the material on the platform is updated regularly.',
          'To the maximum extent permitted by applicable law, Obhyash will not be held responsible for any direct, indirect, or consequential loss or damage of any kind arising from the use of our services.',
        ],
      },
    ],
  },

  refund: {
    title: 'Refund Policy',
    subtitle: 'We are sorry you had to visit this page.',
    lastUpdated: 'September 15, 2026',
    badge: 'Refund Policy',
    description: 'We are sorry you had to visit this page.',
    sections: [
      {
        id: 1,
        title: 'We are sorry you had to visit this page.',
        content: [
          'At Obhyash.com, we are committed to providing exceptional value and service.',
          'By completing your subscription purchase, you acknowledge and agree that the sale is final and non-refundable. We encourage our customers to review all subscription details before finalizing a purchase.',
          'Our customer support team remains available to assist you with any questions or concerns you may have regarding your subscription.',
          'By purchasing a subscription, you are agreeing to our terms and conditions and the no-refund policy. Your satisfaction is important to us, and we are here to support you in making the most of your subscription.',
        ],
      },
    ],
  },
};

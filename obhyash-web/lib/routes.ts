/**
 * Centralized Route Definitions for Obhyash Web App
 * Ensures production-grade consistency, SEO, and client/server sync.
 */

export const STUDENT_ROUTES = {
  dashboard: '/dashboard',
  setup: '/setup',
  exam: '/setup',
  liveExam: '/live_exam',
  questionBank: '/question-bank',
  questionBankLegacy: '/question_bank',
  history: '/history',
  practice: '/practice',
  leaderboard: '/leaderboard',
  analysis: '/analysis',
  formulas: '/formulas',
  settings: '/settings',
  profile: '/profile',
  bookmarks: '/bookmarks',
  notifications: '/notifications',
  complaint: '/complaint',
  featureRequests: '/feature-requests',
  subscription: '/subscription',
  upgrade: '/upgrade',
  referral: '/referral',
  about: '/about',
  privacy: '/privacy',
  terms: '/terms',
  faq: '/faq',
  accountInfo: '/account-info',
  accountLinking: '/account-linking',
  deleteAccount: '/delete-account',
  personal: '/personal',
  legendsLeague: '/legends-league',
  blog: '/blog',
} as const;

export type StudentRouteKey = keyof typeof STUDENT_ROUTES;

/**
 * Resolves any tab identifier to its canonical URL path
 */
export function getStudentRouteUrl(tab: string): string {
  switch (tab) {
    case 'dashboard':
      return STUDENT_ROUTES.dashboard;
    case 'setup':
    case 'exam':
      return STUDENT_ROUTES.setup;
    case 'live_exam':
      return STUDENT_ROUTES.liveExam;
    case 'question_bank':
    case 'question-bank':
      return STUDENT_ROUTES.questionBank;
    case 'history':
      return STUDENT_ROUTES.history;
    case 'practice':
      return STUDENT_ROUTES.practice;
    case 'leaderboard':
      return STUDENT_ROUTES.leaderboard;
    case 'analysis':
      return STUDENT_ROUTES.analysis;
    case 'formulas':
      return STUDENT_ROUTES.formulas;
    case 'settings':
      return STUDENT_ROUTES.settings;
    case 'profile':
      return STUDENT_ROUTES.profile;
    case 'bookmarks':
      return STUDENT_ROUTES.bookmarks;
    case 'notifications':
      return STUDENT_ROUTES.notifications;
    case 'complaint':
      return STUDENT_ROUTES.complaint;
    case 'feature-requests':
      return STUDENT_ROUTES.featureRequests;
    case 'subscription':
    case 'my-subscription':
      return STUDENT_ROUTES.subscription;
    case 'upgrade':
      return STUDENT_ROUTES.upgrade;
    case 'referral':
      return STUDENT_ROUTES.referral;
    case 'about':
      return STUDENT_ROUTES.about;
    case 'privacy':
      return STUDENT_ROUTES.privacy;
    case 'terms':
      return STUDENT_ROUTES.terms;
    case 'faq':
      return STUDENT_ROUTES.faq;
    case 'account-info':
    case 'info':
      return STUDENT_ROUTES.accountInfo;
    case 'account-linking':
      return STUDENT_ROUTES.accountLinking;
    case 'delete-account':
      return STUDENT_ROUTES.deleteAccount;
    case 'personal':
    case 'edit-profile':
      return STUDENT_ROUTES.personal;
    case 'legends-league':
    case 'legends_league':
      return STUDENT_ROUTES.legendsLeague;
    default:
      return '/' + tab;
  }
}

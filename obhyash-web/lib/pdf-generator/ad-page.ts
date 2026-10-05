/**
 * Obhyash Live Exam Promo / Feature Showcase Advertising Page (A4 Size: 210mm x 297mm)
 * Pure Vector HTML/CSS with White/Light Theme.
 * Embedded Real App Screenshots:
 * 1. Phone 1 (Left): Live Exam Main Page (screen_4.png)
 * 2. Phone 2 (Center Hero): Mock Exam Page (screen_1.png)
 * 3. Phone 3 (Right): Question Bank Page (screen_2.png)
 */

export function getAdPageFragment(): { css: string; html: string } {
  let src_1 = '/images/app-screenshots/screen_1.png';
  let src_4 = '/images/app-screenshots/screen_4.png';
  let src_2 = '/images/app-screenshots/screen_2.png';
  let src_full_logo = '/obhyash_full_logo.svg';

  // In Node.js server/CLI environments, embed base64 directly for offline PDF rendering
  if (typeof window === 'undefined') {
    try {
      const nodeFs = eval('require')('fs');
      const nodePath = eval('require')('path');
      const cwd = process.cwd();

      const img1Path = nodePath.join(cwd, 'public/images/app-screenshots/screen_1.png');
      const img4Path = nodePath.join(cwd, 'public/images/app-screenshots/screen_4.png');
      const img2Path = nodePath.join(cwd, 'public/images/app-screenshots/screen_2.png');
      const fullLogoPath = nodePath.join(cwd, 'public/obhyash_full_logo.svg');

      if (nodeFs.existsSync(img1Path)) {
        src_1 = `data:image/png;base64,${nodeFs.readFileSync(img1Path).toString('base64')}`;
      }
      if (nodeFs.existsSync(img4Path)) {
        src_4 = `data:image/png;base64,${nodeFs.readFileSync(img4Path).toString('base64')}`;
      }
      if (nodeFs.existsSync(img2Path)) {
        src_2 = `data:image/png;base64,${nodeFs.readFileSync(img2Path).toString('base64')}`;
      }
      if (nodeFs.existsSync(fullLogoPath)) {
        src_full_logo = `data:image/svg+xml;base64,${nodeFs.readFileSync(fullLogoPath).toString('base64')}`;
      }
    } catch {
      // Fallback to relative public paths if filesystem is inaccessible
    }
  }

  const css = `
    /* =========================================
       AD / SHOWCASE BACK COVER PAGE STYLES
       ========================================= */
    .page.ad-page {
      position: relative;
      width: 794px;
      height: 1122px;
      max-width: 794px;
      max-height: 1122px;
      box-sizing: border-box;
      overflow: hidden;
      font-family: 'Kalpurush', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 8mm 12mm 8mm 12mm;
      break-before: page;
      page-break-before: always;
      break-after: auto;
      page-break-after: auto;
    }

    /* Ambient Decorative Background */
    .ad-page .ambient-bg {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 18% 18%, rgba(2, 132, 199, 0.05) 0%, transparent 45%),
        radial-gradient(circle at 82% 25%, rgba(16, 185, 129, 0.05) 0%, transparent 45%),
        radial-gradient(circle at 50% 80%, rgba(220, 38, 38, 0.04) 0%, transparent 50%),
        #ffffff;
      pointer-events: none;
      z-index: 0;
    }
    .ad-page .dot-grid {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
      background-size: 24px 24px;
      opacity: 0.45;
      pointer-events: none;
      z-index: 0;
    }

    /* =========================================
       1. TOP BRANDING BAR (REAL LOGO LEFT, STORE BADGE RIGHT)
       ========================================= */
    .ad-page .top-nav-bar {
      position: relative;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding-bottom: 8px;
      border-bottom: 1.5px solid #f1f5f9;
    }
    .ad-page .top-left-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ad-page .top-brand-logo {
      height: 38px;
      width: auto;
      object-fit: contain;
      display: block;
    }
    .ad-page .top-right-download {
      display: flex;
      align-items: center;
    }
    .ad-page .play-store-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #0f172a;
      color: #ffffff;
      padding: 5px 14px;
      border-radius: 9999px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
    }
    .ad-page .play-pill-text {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
      text-align: left;
    }
    .ad-page .play-tiny {
      font-size: 8px;
      opacity: 0.8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 500;
      letter-spacing: 0.3px;
    }
    .ad-page .play-bold {
      font-size: 12px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      letter-spacing: 0.2px;
    }

    /* Headline Section */
    .ad-page .header-section {
      position: relative;
      z-index: 10;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }

    .ad-page .main-title {
      font-size: 28px;
      font-weight: 900;
      line-height: 1.2;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .ad-page .main-title .gradient-text {
      color: #0284c7;
    }
    .ad-page .main-subtitle {
      font-size: 13px;
      color: #475569;
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    /* =========================================
       2. SHOWCASE STAGE & PHONES
       ========================================= */
    .ad-page .showcase-stage {
      position: relative;
      z-index: 10;
      width: 100%;
      height: 650px;
      margin-top: 2px;
      margin-bottom: 2px;
    }

    /* Directional Arrows SVG Layer */
    .ad-page .arrows-overlay {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 15;
    }

    /* Callout Cards */
    .ad-page .callout-card {
      position: absolute;
      z-index: 20;
      background: #ffffff;
      border: 1.2px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 14px;
      box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04);
      width: 180px;
      box-sizing: border-box;
    }

    .ad-page .card-top-left {
      top: 18px;
      left: 6px;
      border-left: 4px solid #dc2626;
    }
    .ad-page .card-bot-left {
      bottom: 24px;
      left: 6px;
      border-left: 4px solid #f59e0b;
    }
    .ad-page .card-top-right {
      top: 18px;
      right: 6px;
      border-right: 4px solid #0284c7;
    }
    .ad-page .card-bot-right {
      bottom: 24px;
      right: 6px;
      border-right: 4px solid #10b981;
    }

    .ad-page .callout-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13.5px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 4px;
    }
    .ad-page .card-top-left .callout-header { color: #b91c1c; }
    .ad-page .card-bot-left .callout-header { color: #b45309; }
    .ad-page .card-top-right .callout-header { color: #0369a1; }
    .ad-page .card-bot-right .callout-header { color: #047857; }

    .ad-page .callout-desc {
      font-size: 10.5px;
      color: #475569;
      line-height: 1.35;
      font-weight: 500;
    }

    /* Phones Flexbox Stage */
    .ad-page .phones-wrapper {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 5;
    }

    /* Realistic Minimalist Android Phone Frame */
    .ad-page .phone-mockup {
      position: absolute;
      border-radius: 36px;
      background: #111827;
      padding: 7px;
      box-shadow: 
        0 25px 50px -12px rgba(15, 23, 42, 0.22),
        0 0 0 1px rgba(255, 255, 255, 0.15) inset,
        0 0 0 1.5px #374151;
      box-sizing: border-box;
      transform-origin: center center;
    }

    .ad-page .screen-img-box {
      width: 100%;
      height: 100%;
      border-radius: 29px;
      overflow: hidden;
      background: #ffffff;
      position: relative;
    }
    .ad-page .screen-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Phone 1: Left Phone (Live Exam Main Page) */
    .ad-page .phone-left {
      width: 220px;
      height: 485px;
      left: 70px;
      top: 90px;
      transform: scale(0.92) rotate(-3.5deg);
      z-index: 6;
      opacity: 0.98;
    }

    /* Phone 2: Center Hero Phone (Mock Exam Page) */
    .ad-page .phone-hero {
      width: 236px;
      height: 520px;
      left: 233px;
      top: 60px;
      transform: scale(1.04);
      z-index: 10;
      box-shadow: 
        0 30px 60px -12px rgba(15, 23, 42, 0.32),
        0 12px 24px -6px rgba(15, 23, 42, 0.15),
        0 0 0 2px #4b5563;
    }

    /* Phone 3: Right Phone (Question Bank Page) */
    .ad-page .phone-right {
      width: 220px;
      height: 485px;
      right: 70px;
      top: 90px;
      transform: scale(0.92) rotate(3.5deg);
      z-index: 6;
      opacity: 0.98;
    }

    /* =========================================
       3. FOOTER CALL-TO-ACTION (CTA)
       ========================================= */
    .ad-page .footer-cta {
      position: relative;
      z-index: 20;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 18px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.05);
      margin-bottom: 0;
    }

    /* Left Playstore Box */
    .ad-page .cta-left {
      display: flex;
      flex-direction: column;
      gap: 5px;
      flex: 1.2;
    }
    .ad-page .cta-heading {
      font-size: 13.5px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ad-page .cta-badges-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 9.5px;
      font-weight: 700;
      color: #475569;
    }
    .ad-page .cta-badge-item {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .ad-page .playstore-button {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      background: #0f172a;
      color: #ffffff;
      text-decoration: none;
      padding: 6px 14px;
      border-radius: 9px;
      width: fit-content;
      box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2);
    }
    .ad-page .play-icon-svg {
      width: 20px;
      height: 20px;
    }
    .ad-page .play-text-col {
      display: flex;
      flex-direction: column;
      line-height: 1.1;
      text-align: left;
    }
    .ad-page .play-small {
      font-size: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      letter-spacing: 0.5px;
      color: #cbd5e1;
    }
    .ad-page .play-large {
      font-size: 13px;
      font-weight: 700;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      letter-spacing: 0.3px;
    }

    /* Right Site Info */
    .ad-page .cta-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
      text-align: right;
    }
    .ad-page .web-url {
      font-size: 15px;
      font-weight: 800;
      color: #0284c7;
      letter-spacing: 0.5px;
      text-decoration: none;
    }
    .ad-page .rating-pill {
      font-size: 10px;
      color: #b45309;
      font-weight: 800;
    }
    .ad-page .slogan-bot {
      font-size: 9.5px;
      color: #64748b;
      font-weight: 600;
    }
  `;

  const html = `
  <div class="page ad-page">
    <!-- Ambient Decorative Background -->
    <div class="ambient-bg"></div>
    <div class="dot-grid"></div>

    <!-- =========================================
         1. TOP BRANDING BAR (REAL LOGO LEFT, STORE BADGE RIGHT)
         ========================================= -->
    <div class="top-nav-bar">
      <!-- Top-Left: Real Obhyash Full Logo -->
      <div class="top-left-brand">
        <img src="${src_full_logo}" class="top-brand-logo" alt="অভ্যাস" />
      </div>

      <!-- Top-Right: Google Play Store Pill -->
      <div class="top-right-download">
        <div class="play-store-pill">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M3.6 1.6c-.3.3-.5.8-.5 1.4v18c0 .6.2 1.1.5 1.4l.1.1L13.8 12.4v-.2L3.7 1.5z" fill="#00a0ff"/>
            <path d="M17.2 15.8l-3.4-3.4v-.2l3.4-3.4.1.1 4 2.3c1.1.6 1.1 1.7 0 2.3l-4 2.2z" fill="#ffc400"/>
            <path d="M17.3 15.7L13.8 12.3 3.6 22.4c.4.4 1 .4 1.7.1z" fill="#f43249"/>
            <path d="M17.3 8.9L5.3 2.1c-.7-.4-1.3-.3-1.7.1l10.2 10.1z" fill="#00e676"/>
          </svg>
          <div class="play-pill-text">
            <span class="play-tiny">GET IT ON</span>
            <span class="play-bold">Google Play</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Headline Section -->
    <div class="header-section">
      <h1 class="main-title">
        ভর্তি পরীক্ষার প্রস্তুতি <span class="gradient-text">এবার এক অ্যাপেই!</span>
      </h1>
      <p class="main-subtitle">
        মেডিকেল • ইঞ্জিনিয়ারিং • ভার্সিটি ‘ক’ • এইচএসসি
      </p>
    </div>

    <!-- =========================================
         2. SHOWCASE STAGE & PHONES
         ========================================= -->
    <div class="showcase-stage">

      <!-- Directional Curved Arrows & Feature Pins SVG Layer -->
      <svg class="arrows-overlay" viewBox="0 0 703 650" preserveAspectRatio="none">
        <defs>
          <!-- Arrowhead Marker (Royal Blue) -->
          <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7"/>
          </marker>
          <!-- Arrowhead Marker (Amber) -->
          <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d97706"/>
          </marker>
          <!-- Arrowhead Marker (Red) -->
          <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#dc2626"/>
          </marker>
          <!-- Arrowhead Marker (Emerald) -->
          <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#059669"/>
          </marker>

          <!-- Drop shadow filter for target pins -->
          <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#0f172a" flood-opacity="0.3"/>
          </filter>
        </defs>

        <!-- 1. ARROW TO PHONE 1: LIVE EXAM (ENGINEERING TILE) -->
        <path d="M 180 62 C 205 75, 145 145, 172 210" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-dasharray="4,4" marker-end="url(#arrow-red)"/>
        <g transform="translate(175, 215)" filter="url(#pin-shadow)">
          <circle cx="0" cy="0" r="10" fill="rgba(220, 38, 38, 0.18)" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="2.5,2.5"/>
          <circle cx="0" cy="0" r="4.5" fill="#dc2626"/>
          <circle cx="0" cy="0" r="1.8" fill="#ffffff"/>
        </g>

        <!-- 2. ARROW TO PHONE 2: MOCK EXAM (SUBJECT DROPDOWN) -->
        <path d="M 523 56 C 460 60, 460 150, 426 198" fill="none" stroke="#0284c7" stroke-width="2.2" stroke-dasharray="4,4" marker-end="url(#arrow-blue)"/>
        <g transform="translate(420, 202)" filter="url(#pin-shadow)">
          <circle cx="0" cy="0" r="10" fill="rgba(2, 132, 199, 0.18)" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="2.5,2.5"/>
          <circle cx="0" cy="0" r="4.5" fill="#0284c7"/>
          <circle cx="0" cy="0" r="1.8" fill="#ffffff"/>
        </g>

        <!-- 3. ARROW TO PHONE 2: MOCK EXAM (EXAM TYPE & DIFFICULTY) -->
        <path d="M 180 585 C 240 585, 270 470, 344 430" fill="none" stroke="#d97706" stroke-width="2.2" stroke-dasharray="4,4" marker-end="url(#arrow-amber)"/>
        <g transform="translate(350, 426)" filter="url(#pin-shadow)">
          <circle cx="0" cy="0" r="10" fill="rgba(217, 119, 6, 0.18)" stroke="#d97706" stroke-width="1.5" stroke-dasharray="2.5,2.5"/>
          <circle cx="0" cy="0" r="4.5" fill="#d97706"/>
          <circle cx="0" cy="0" r="1.8" fill="#ffffff"/>
        </g>

        <!-- 4. ARROW TO PHONE 3: QUESTION BANK (VARSITY TILES) -->
        <path d="M 523 585 C 470 585, 490 490, 554 448" fill="none" stroke="#059669" stroke-width="2.2" stroke-dasharray="4,4" marker-end="url(#arrow-emerald)"/>
        <g transform="translate(560, 444)" filter="url(#pin-shadow)">
          <circle cx="0" cy="0" r="10" fill="rgba(5, 150, 105, 0.18)" stroke="#059669" stroke-width="1.5" stroke-dasharray="2.5,2.5"/>
          <circle cx="0" cy="0" r="4.5" fill="#059669"/>
          <circle cx="0" cy="0" r="1.8" fill="#ffffff"/>
        </g>
      </svg>

      <!-- Callout 1: Top Left (Live Exam) -->
      <div class="callout-card card-top-left">
        <div class="callout-header">
          <span>🔴</span>
          <span>অল-বাংলাদেশ লাইভ এক্সাম</span>
        </div>
        <div class="callout-desc">
          প্রতিদিন রুটিন অনুযায়ী দেশসেরা প্রতিযোগীদের সাথে লাইভ টেস্ট ও র‍্যাংকিং।
        </div>
      </div>

      <!-- Callout 2: Bottom Left (Chapter Practice) -->
      <div class="callout-card card-bot-left">
        <div class="callout-header">
          <span>⚡</span>
          <span>অধ্যায়ভিত্তিক প্রস্তুতি</span>
        </div>
        <div class="callout-desc">
          কঠিন ও দুর্বল টপিকগুলো আলাদাভাবে প্র্যাকটিস করে শতভাগ প্রস্তুতি নাও।
        </div>
      </div>

      <!-- Callout 3: Top Right (Custom Mock Exam) -->
      <div class="callout-card card-top-right">
        <div class="callout-header">
          <span>🎯</span>
          <span>কাস্টম মক এক্সাম</span>
        </div>
        <div class="callout-desc">
          পছন্দমতো বিষয়, অধ্যায় ও প্রশ্নের সংখ্যা নির্ধারণ করে আনলিমিটেড মক পরীক্ষা।
        </div>
      </div>

      <!-- Callout 4: Bottom Right (Question Bank) -->
      <div class="callout-card card-bot-right">
        <div class="callout-header">
          <span>📚</span>
          <span>বিগত বছরের প্রশ্নব্যাংক</span>
        </div>
        <div class="callout-desc">
          বুয়েট, মেডিকেল, ঢাবি ও সকল পাবলিক বিশ্ববিদ্যালয়ের বিগত ২০+ বছরের প্রশ্ন ব্যাখ্যাসহ।
        </div>
      </div>

      <!-- The 3 Center Phone Mockups -->
      <div class="phones-wrapper">

        <!-- PHONE 1: REAL LIVE EXAM MAIN PAGE (LEFT) -->
        <div class="phone-mockup phone-left">
          <div class="screen-img-box">
            <img class="screen-img" src="${src_4}" alt="Live Exam Screen" />
          </div>
        </div>

        <!-- PHONE 2: REAL MOCK EXAM PAGE (HERO CENTER) -->
        <div class="phone-mockup phone-hero">
          <div class="screen-img-box">
            <img class="screen-img" src="${src_1}" alt="Mock Exam Screen" />
          </div>
        </div>

        <!-- PHONE 3: REAL QUESTION BANK PAGE (RIGHT) -->
        <div class="phone-mockup phone-right">
          <div class="screen-img-box">
            <img class="screen-img" src="${src_2}" alt="Question Bank Screen" />
          </div>
        </div>

      </div>
    </div>

    <!-- =========================================
         3. FOOTER CALL-TO-ACTION (CTA)
         ========================================= -->
    <div class="footer-cta">
      <!-- Left: Play Store Button -->
      <div class="cta-left">
        <div class="cta-heading">
          <span>🚀 আজই ডাউনলোড করো অভ্যাস অ্যাপ</span>
        </div>
        <div class="cta-badges-row">
          <span class="cta-badge-item">✓ আনলিমিটেড ফ্রি এক্সাম</span>
          <span class="cta-badge-item">✓ অধ্যায়ভিত্তিক প্র্যাকটিস</span>
          <span class="cta-badge-item">✓ অফলাইন মোড</span>
        </div>
        <a href="https://play.google.com/store/apps/details?id=com.obhyash.app" class="playstore-button" target="_blank">
          <svg class="play-icon-svg" viewBox="0 0 512 512">
            <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" fill="#00e676"/>
            <path d="M47 36.3C40.4 46.1 36.6 58.7 36.6 74v364c0 15.3 3.8 27.9 10.4 37.7L267.7 256 47 36.3z" fill="#00b0ff"/>
            <path d="M325.3 277.7l60.1 60.1L104.6 499l220.7-221.3z" fill="#ff3d00"/>
            <path d="M470.7 236.2l-85.3-48.9-60.1 60.1 60.1 60.1 85.3-48.9c13.6-7.8 21.3-21.7 21.3-36.2s-7.7-28.4-21.3-36.2z" fill="#ffc400"/>
          </svg>
          <div class="play-text-col">
            <span class="play-small">GET IT ON</span>
            <span class="play-large">Google Play</span>
          </div>
        </a>
      </div>

      <!-- Right: Site URL & Slogan -->
      <div class="cta-right">
        <a href="https://www.obhyash.com" class="web-url" target="_blank">www.obhyash.com</a>
        <span class="rating-pill">⭐ ৪.৯/৫ রেটিং • ৫০,০০০+ প্রশ্ন</span>
        <span class="slogan-bot">অভ্যাস • প্রস্তুতি নাও আত্মবিশ্বাসের সাথে</span>
      </div>
    </div>
  </div>
  `;

  return { css, html };
}

export function generateAdPageHtml(): string {
  const { css, html } = getAdPageFragment();

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>অভ্যাস • ফিচার শোকেস ও অ্যাপ ডাউনলোড</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

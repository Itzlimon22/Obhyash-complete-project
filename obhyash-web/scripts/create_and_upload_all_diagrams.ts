import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const r2PublicDomain = process.env.R2_PUBLIC_DOMAIN || 'https://pub-6560195307b14ca49f6f183b13bfa841.r2.dev';

// ==========================================
// 1. P-V Trapezium Work Diagram (W = 20 J)
// ==========================================
const svg_pv_trapezium = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 380" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="arrow-pv" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>
    </marker>
    <marker id="arrow-accent-pv" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7"/>
    </marker>
    <linearGradient id="shade-pv" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#bae6fd" stop-opacity="0.15"/>
    </linearGradient>
  </defs>

  <text x="260" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">P - V লেখচিত্র (কৃতকাজ নির্ণয়)</text>

  <!-- Shaded Trapezium Area -->
  <polygon points="180,230 180,180 340,100 340,290 180,290" fill="url(#shade-pv)" stroke="none" />
  
  <!-- Dashed drop lines -->
  <line x1="180" y1="230" x2="80" y2="230" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="340" y1="100" x2="80" y2="100" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="180" y1="230" x2="180" y2="290" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="340" y1="100" x2="340" y2="290" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Process line A -> B -->
  <line x1="180" y1="230" x2="340" y2="100" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="250" y1="173" x2="268" y2="158" stroke="#0284c7" stroke-width="3.5" marker-end="url(#arrow-accent-pv)"/>

  <!-- Points A and B -->
  <circle cx="180" cy="230" r="5" fill="#0369a1"/>
  <text x="170" y="222" font-size="14" font-weight="700" fill="#0369a1" text-anchor="end">A</text>

  <circle cx="340" cy="100" r="5" fill="#0369a1"/>
  <text x="355" y="98" font-size="14" font-weight="700" fill="#0369a1">B</text>

  <!-- Shaded Area Text -->
  <text x="260" y="225" font-size="13" font-weight="600" fill="#0369a1" text-anchor="middle">W = আবদ্ধ ক্ষেত্রফল</text>

  <!-- Y Axis (Pressure) -->
  <line x1="80" y1="290" x2="80" y2="55" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow-pv)"/>
  <text x="75" y="48" font-size="14" font-weight="700" fill="#0f172a" text-anchor="end">P (N/m²)</text>

  <!-- X Axis (Volume) -->
  <line x1="80" y1="290" x2="460" y2="290" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow-pv)"/>
  <text x="465" y="295" font-size="14" font-weight="700" fill="#0f172a" text-anchor="start">V (m³)</text>

  <!-- Y Ticks -->
  <line x1="75" y1="290" x2="80" y2="290" stroke="#1e293b" stroke-width="2"/>
  <text x="68" y="295" font-size="13" font-weight="600" fill="#475569" text-anchor="end">0</text>

  <line x1="75" y1="230" x2="80" y2="230" stroke="#1e293b" stroke-width="2"/>
  <text x="68" y="234" font-size="13" font-weight="600" fill="#0f172a" text-anchor="end">10</text>

  <line x1="75" y1="165" x2="80" y2="165" stroke="#94a3b8" stroke-width="1.5"/>
  <text x="68" y="169" font-size="13" font-weight="500" fill="#64748b" text-anchor="end">20</text>

  <line x1="75" y1="100" x2="80" y2="100" stroke="#1e293b" stroke-width="2"/>
  <text x="68" y="104" font-size="13" font-weight="600" fill="#0f172a" text-anchor="end">30</text>

  <!-- X Ticks -->
  <line x1="180" y1="290" x2="180" y2="295" stroke="#1e293b" stroke-width="2"/>
  <text x="180" y="315" font-size="13" font-weight="600" fill="#0f172a" text-anchor="middle">1</text>

  <line x1="340" y1="290" x2="340" y2="295" stroke="#1e293b" stroke-width="2"/>
  <text x="340" y="315" font-size="13" font-weight="600" fill="#0f172a" text-anchor="middle">2</text>
</svg>`;

// ==========================================
// 2. P-V Diagram with State X and Paths XA, XB, XC, XD
// ==========================================
const svg_pv_isochoric_xb = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 380" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="arr-main" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>
    </marker>
    <marker id="arr-path" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7"/>
    </marker>
    <marker id="arr-path-xb" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444"/>
    </marker>
  </defs>

  <text x="260" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">P - V লেখচিত্র (তাপগতীয় প্রক্রিয়াসমূহ)</text>

  <!-- Axes -->
  <line x1="90" y1="310" x2="90" y2="55" stroke="#1e293b" stroke-width="2.2" marker-end="url(#arr-main)"/>
  <text x="85" y="48" font-size="14" font-weight="700" fill="#0f172a" text-anchor="end">P (চাপ)</text>

  <line x1="90" y1="310" x2="470" y2="310" stroke="#1e293b" stroke-width="2.2" marker-end="url(#arr-main)"/>
  <text x="475" y="315" font-size="14" font-weight="700" fill="#0f172a" text-anchor="start">V (আয়তন)</text>

  <!-- Point X -->
  <circle cx="230" cy="150" r="6" fill="#0f172a"/>
  <text x="215" y="142" font-size="16" font-weight="800" fill="#0f172a">X</text>

  <!-- Path XC: Isobaric (horizontal right) -->
  <line x1="230" y1="150" x2="380" y2="150" stroke="#0284c7" stroke-width="3" marker-end="url(#arr-path)"/>
  <circle cx="380" cy="150" r="5" fill="#0284c7"/>
  <text x="395" y="155" font-size="15" font-weight="700" fill="#0284c7">C</text>

  <!-- Path XB: Isochoric (vertical straight down -> dV = 0, W = 0) -->
  <line x1="230" y1="150" x2="230" y2="280" stroke="#ef4444" stroke-width="3.5" marker-end="url(#arr-path-xb)"/>
  <circle cx="230" cy="280" r="5" fill="#ef4444"/>
  <text x="230" y="302" font-size="15" font-weight="700" fill="#ef4444" text-anchor="middle">B</text>
  <text x="242" y="225" font-size="12" font-weight="600" fill="#ef4444">সমআয়তন (ΔV=0)</text>

  <!-- Path XA: Isothermal / Polytropic Expansion (gentle curve) -->
  <path d="M 230 150 Q 290 190 370 215" fill="none" stroke="#059669" stroke-width="3" marker-end="url(#arr-path)"/>
  <circle cx="370" cy="215" r="5" fill="#059669"/>
  <text x="385" y="220" font-size="15" font-weight="700" fill="#059669">A</text>

  <!-- Path XD: Adiabatic / Steeper Expansion curve -->
  <path d="M 230 150 Q 275 220 330 270" fill="none" stroke="#8b5cf6" stroke-width="3" marker-end="url(#arr-path)"/>
  <circle cx="330" cy="270" r="5" fill="#8b5cf6"/>
  <text x="345" y="278" font-size="15" font-weight="700" fill="#8b5cf6">D</text>

  <!-- Dashed reference line for V_X -->
  <line x1="230" y1="150" x2="230" y2="310" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3,3"/>
  <text x="230" y="328" font-size="12" font-weight="600" fill="#64748b" text-anchor="middle">V_X</text>
</svg>`;

// ==========================================
// 3. Resistor Bridge Circuit (B & C Potential Difference)
// ==========================================
const svg_resistor_circuit_bc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 340" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="270" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">বর্তনী চিত্র (B ও C বিন্দুর বিভব পার্থক্য নির্ণয়)</text>

  <!-- Battery Branch (Bottom) -->
  <line x1="100" y1="260" x2="245" y2="260" stroke="#1e293b" stroke-width="2.5"/>
  <!-- DC Source E = 6V -->
  <line x1="245" y1="245" x2="245" y2="275" stroke="#0284c7" stroke-width="3.5"/> <!-- Long Positive Plate -->
  <line x1="255" y1="252" x2="255" y2="268" stroke="#1e293b" stroke-width="2.5"/> <!-- Short Negative Plate -->
  <line x1="265" y1="245" x2="265" y2="275" stroke="#0284c7" stroke-width="3.5"/> <!-- Long Positive Plate -->
  <line x1="275" y1="252" x2="275" y2="268" stroke="#1e293b" stroke-width="2.5"/> <!-- Short Negative Plate -->
  <line x1="275" y1="260" x2="440" y2="260" stroke="#1e293b" stroke-width="2.5"/>
  <text x="260" y="295" font-size="14" font-weight="700" fill="#0284c7" text-anchor="middle">E = 6 V</text>
  <text x="235" y="240" font-size="12" font-weight="700" fill="#0284c7">+</text>
  <text x="285" y="240" font-size="12" font-weight="700" fill="#1e293b">−</text>

  <!-- Left vertical line -->
  <line x1="100" y1="260" x2="100" y2="120" stroke="#1e293b" stroke-width="2.5"/>
  <!-- Node A -->
  <circle cx="100" cy="120" r="5" fill="#0f172a"/>
  <text x="85" y="125" font-size="14" font-weight="800" fill="#0f172a">A</text>

  <!-- R1 = 2 ohm -->
  <line x1="100" y1="120" x2="135" y2="120" stroke="#1e293b" stroke-width="2.5"/>
  <!-- Resistor zigzag R1 -->
  <path d="M 135 120 L 140 110 L 150 130 L 160 110 L 170 130 L 180 110 L 185 120" fill="none" stroke="#0284c7" stroke-width="2.5"/>
  <line x1="185" y1="120" x2="220" y2="120" stroke="#1e293b" stroke-width="2.5"/>
  <text x="160" y="100" font-size="13" font-weight="700" fill="#0284c7" text-anchor="middle">R₁ = 2 Ω</text>

  <!-- Node B -->
  <circle cx="220" cy="120" r="5" fill="#ef4444"/>
  <text x="220" y="105" font-size="15" font-weight="800" fill="#ef4444" text-anchor="middle">B</text>

  <!-- Parallel Branch Between B and C -->
  <!-- Split up to 3 ohm -->
  <line x1="220" y1="120" x2="220" y2="75" stroke="#1e293b" stroke-width="2.2"/>
  <line x1="220" y1="75" x2="245" y2="75" stroke="#1e293b" stroke-width="2.2"/>
  <path d="M 245 75 L 250 65 L 260 85 L 270 65 L 280 85 L 290 65 L 295 75" fill="none" stroke="#0f766e" stroke-width="2.5"/>
  <line x1="295" y1="75" x2="320" y2="75" stroke="#1e293b" stroke-width="2.2"/>
  <line x1="320" y1="75" x2="320" y2="120" stroke="#1e293b" stroke-width="2.2"/>
  <text x="270" y="58" font-size="13" font-weight="700" fill="#0f766e" text-anchor="middle">3 Ω</text>

  <!-- Split down to 6 ohm -->
  <line x1="220" y1="120" x2="220" y2="165" stroke="#1e293b" stroke-width="2.2"/>
  <line x1="220" y1="165" x2="245" y2="165" stroke="#1e293b" stroke-width="2.2"/>
  <path d="M 245 165 L 250 155 L 260 175 L 270 155 L 280 175 L 290 155 L 295 165" fill="none" stroke="#0f766e" stroke-width="2.5"/>
  <line x1="295" y1="165" x2="320" y2="165" stroke="#1e293b" stroke-width="2.2"/>
  <line x1="320" y1="165" x2="320" y2="120" stroke="#1e293b" stroke-width="2.2"/>
  <text x="270" y="195" font-size="13" font-weight="700" fill="#0f766e" text-anchor="middle">6 Ω</text>

  <!-- Node C -->
  <circle cx="320" cy="120" r="5" fill="#ef4444"/>
  <text x="320" y="105" font-size="15" font-weight="800" fill="#ef4444" text-anchor="middle">C</text>

  <!-- R3 = 2 ohm -->
  <line x1="320" y1="120" x2="355" y2="120" stroke="#1e293b" stroke-width="2.5"/>
  <path d="M 355 120 L 360 110 L 370 130 L 380 110 L 390 130 L 400 110 L 405 120" fill="none" stroke="#0284c7" stroke-width="2.5"/>
  <line x1="405" y1="120" x2="440" y2="120" stroke="#1e293b" stroke-width="2.5"/>
  <text x="380" y="100" font-size="13" font-weight="700" fill="#0284c7" text-anchor="middle">R₃ = 2 Ω</text>

  <!-- Node D -->
  <circle cx="440" cy="120" r="5" fill="#0f172a"/>
  <text x="455" y="125" font-size="14" font-weight="800" fill="#0f172a">D</text>

  <!-- Right vertical line -->
  <line x1="440" y1="120" x2="440" y2="260" stroke="#1e293b" stroke-width="2.5"/>

  <!-- V_BC indicator bracket -->
  <line x1="220" y1="210" x2="320" y2="210" stroke="#ef4444" stroke-width="1.8" stroke-dasharray="4,3"/>
  <text x="270" y="230" font-size="13" font-weight="700" fill="#ef4444" text-anchor="middle">V_BC = ?</text>
</svg>`;

// ==========================================
// 4. Triangular Cyclic P-V Diagram (300 kPa x 200 cm³)
// ==========================================
const svg_pv_cyclic_triangle = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 380" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="arr-axis" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>
    </marker>
    <marker id="arr-cycle" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#d97706"/>
    </marker>
    <linearGradient id="shade-tri" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde68a" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#fef3c7" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <text x="260" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">P - V চক্রিক প্রক্রিয়া (Cyclic Process)</text>

  <!-- Triangle (Counter-clockwise: (160,260) -> (360,260) -> (160,110) -> (160,260) or similar) -->
  <!-- A = (160, 110), B = (160, 260), C = (360, 260) -->
  <!-- CCW cycle: B(160,260) -> C(360,260) -> A(160,110) -> B(160,260) -->
  <polygon points="170,110 170,260 370,260" fill="url(#shade-tri)" stroke="none"/>

  <!-- Triangle Edges with CCW Direction -->
  <!-- Hypotenuse: C(370,260) -> A(170,110) -->
  <line x1="370" y1="260" x2="170" y2="110" stroke="#d97706" stroke-width="3"/>
  <line x1="280" y1="192" x2="260" y2="177" stroke="#d97706" stroke-width="3" marker-end="url(#arr-cycle)"/>

  <!-- Vertical: A(170,110) -> B(170,260) -->
  <line x1="170" y1="110" x2="170" y2="260" stroke="#d97706" stroke-width="3"/>
  <line x1="170" y1="170" x2="170" y2="195" stroke="#d97706" stroke-width="3" marker-end="url(#arr-cycle)"/>

  <!-- Horizontal: B(170,260) -> C(370,260) -->
  <line x1="170" y1="260" x2="370" y2="260" stroke="#d97706" stroke-width="3"/>
  <line x1="260" y1="260" x2="285" y2="260" stroke="#d97706" stroke-width="3" marker-end="url(#arr-cycle)"/>

  <!-- Shaded Area Text -->
  <text x="225" y="220" font-size="12" font-weight="700" fill="#b45309">ঘড়ির কাঁটার বিপরীত</text>
  <text x="225" y="238" font-size="12" font-weight="700" fill="#b45309">ΔW = -30 J</text>

  <!-- Axes -->
  <line x1="90" y1="290" x2="90" y2="60" stroke="#1e293b" stroke-width="2.2" marker-end="url(#arr-axis)"/>
  <text x="85" y="52" font-size="14" font-weight="700" fill="#0f172a" text-anchor="end">P (kPa)</text>

  <line x1="90" y1="290" x2="460" y2="290" stroke="#1e293b" stroke-width="2.2" marker-end="url(#arr-axis)"/>
  <text x="465" y="295" font-size="14" font-weight="700" fill="#0f172a" text-anchor="start">V (cm³)</text>

  <!-- Dashed drop lines to axes -->
  <line x1="170" y1="110" x2="90" y2="110" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="170" y1="260" x2="90" y2="260" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="170" y1="260" x2="170" y2="290" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="370" y1="260" x2="370" y2="290" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Axis Ticks & Labels -->
  <!-- Pressure labels: difference is 300 kPa (e.g., 100 to 400) -->
  <text x="80" y="265" font-size="13" font-weight="600" fill="#0f172a" text-anchor="end">P₁</text>
  <text x="80" y="115" font-size="13" font-weight="600" fill="#0f172a" text-anchor="end">P₂</text>
  <text x="45" y="185" font-size="12" font-weight="700" fill="#b45309" text-anchor="middle">ΔP = 300 kPa</text>

  <!-- Volume labels: difference is 200 cm³ (e.g., 100 to 300) -->
  <text x="170" y="315" font-size="13" font-weight="600" fill="#0f172a" text-anchor="middle">V₁</text>
  <text x="370" y="315" font-size="13" font-weight="600" fill="#0f172a" text-anchor="middle">V₂</text>
  <text x="270" y="340" font-size="12" font-weight="700" fill="#b45309" text-anchor="middle">ΔV = 200 cm³</text>
</svg>`;

// ==========================================
// 5. 3-Input Logic Gate (OR into AND)
// ==========================================
const svg_logic_or_and = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 280" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="260" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">লজিক বর্তনী (Logic Circuit)</text>

  <!-- Input Lines for 3-Input OR Gate -->
  <text x="60" y="75" font-size="14" font-weight="700" fill="#0f172a">A = 1</text>
  <line x1="110" y1="70" x2="160" y2="70" stroke="#1e293b" stroke-width="2.5"/>

  <text x="60" y="115" font-size="14" font-weight="700" fill="#0f172a">B = 0</text>
  <line x1="110" y1="110" x2="170" y2="110" stroke="#1e293b" stroke-width="2.5"/>

  <text x="60" y="155" font-size="14" font-weight="700" fill="#0f172a">C = 1</text>
  <line x1="110" y1="150" x2="160" y2="150" stroke="#1e293b" stroke-width="2.5"/>

  <!-- OR Gate Shape -->
  <path d="M 155 55 Q 180 110 155 165 Q 215 165 240 110 Q 215 55 155 55 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>
  <text x="185" y="115" font-size="13" font-weight="700" fill="#0369a1">OR</text>

  <!-- OR Gate Output to AND Gate -->
  <line x1="240" y1="110" x2="310" y2="110" stroke="#1e293b" stroke-width="2.5"/>
  <text x="275" y="100" font-size="12" font-weight="700" fill="#0369a1">1</text>

  <!-- Second Input to AND Gate (Line D = 0 or 1) -->
  <text x="60" y="215" font-size="14" font-weight="700" fill="#0f172a">D = 0</text>
  <line x1="110" y1="210" x2="270" y2="210" stroke="#1e293b" stroke-width="2.5"/>
  <line x1="270" y1="210" x2="270" y2="160" stroke="#1e293b" stroke-width="2.5"/>
  <line x1="270" y1="160" x2="310" y2="160" stroke="#1e293b" stroke-width="2.5"/>

  <!-- AND Gate Shape -->
  <path d="M 310 90 L 340 90 A 40 40 0 0 1 340 180 L 310 180 Z" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
  <text x="330" y="140" font-size="13" font-weight="700" fill="#b45309">AND</text>

  <!-- Output Y -->
  <line x1="380" y1="135" x2="445" y2="135" stroke="#1e293b" stroke-width="2.5"/>
  <circle cx="445" cy="135" r="4" fill="#0f172a"/>
  <text x="460" y="140" font-size="16" font-weight="800" fill="#0f172a">Y</text>
</svg>`;

// ==========================================
// 6. AND + OR Combination (Y = A + AB)
// ==========================================
const svg_logic_and_or_combination = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 280" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="260" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">লজিক গেট সমবায় (Logic Circuit)</text>

  <!-- Main Inputs A and B -->
  <text x="50" y="85" font-size="16" font-weight="800" fill="#0f172a">A</text>
  <text x="50" y="155" font-size="16" font-weight="800" fill="#0f172a">B</text>

  <!-- Input A Line (branches to AND and OR) -->
  <line x1="75" y1="80" x2="160" y2="80" stroke="#1e293b" stroke-width="2.5"/>
  <circle cx="110" cy="80" r="4" fill="#1e293b"/>
  <!-- Branch from A going directly to OR gate top input -->
  <line x1="110" y1="80" x2="110" y2="190" stroke="#1e293b" stroke-width="2.5"/>
  <line x1="110" y1="190" x2="310" y2="190" stroke="#1e293b" stroke-width="2.5"/>

  <!-- Input B Line going to AND gate bottom input -->
  <line x1="75" y1="150" x2="160" y2="150" stroke="#1e293b" stroke-width="2.5"/>

  <!-- AND Gate -->
  <path d="M 160 65 L 195 65 A 42 42 0 0 1 195 165 L 160 165 Z" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/>
  <text x="180" y="120" font-size="13" font-weight="700" fill="#b45309">AND</text>

  <!-- AND Output (A · B) -->
  <line x1="237" y1="115" x2="275" y2="115" stroke="#1e293b" stroke-width="2.5"/>
  <line x1="275" y1="115" x2="275" y2="230" stroke="#1e293b" stroke-width="2.5"/>
  <line x1="275" y1="230" x2="310" y2="230" stroke="#1e293b" stroke-width="2.5"/>
  <text x="255" y="105" font-size="12" font-weight="700" fill="#b45309">A · B</text>

  <!-- OR Gate -->
  <path d="M 305 175 Q 330 215 305 250 Q 365 250 390 215 Q 365 175 305 175 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5"/>
  <text x="335" y="220" font-size="13" font-weight="700" fill="#0369a1">OR</text>

  <!-- Output Y -->
  <line x1="390" y1="215" x2="445" y2="215" stroke="#1e293b" stroke-width="2.5"/>
  <circle cx="445" cy="215" r="4" fill="#0f172a"/>
  <text x="455" y="220" font-size="15" font-weight="800" fill="#0f172a">Y = A + A · B</text>
</svg>`;

// ==========================================
// 7. Shorted NAND Gate as NOT Gate
// ==========================================
const svg_logic_nand_shorted_not = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 240" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="250" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">লজিক গেট (NAND গেট হতে NOT গেট)</text>

  <!-- Input A -->
  <text x="60" y="125" font-size="18" font-weight="800" fill="#0f172a">A</text>
  <line x1="85" y1="120" x2="135" y2="120" stroke="#1e293b" stroke-width="2.5"/>

  <!-- Shorted Node -->
  <circle cx="135" cy="120" r="4.5" fill="#1e293b"/>

  <!-- Two inputs branched into NAND -->
  <line x1="135" y1="120" x2="135" y2="95" stroke="#1e293b" stroke-width="2.5"/>
  <line x1="135" y1="95" x2="190" y2="95" stroke="#1e293b" stroke-width="2.5"/>

  <line x1="135" y1="120" x2="135" y2="145" stroke="#1e293b" stroke-width="2.5"/>
  <line x1="135" y1="145" x2="190" y2="145" stroke="#1e293b" stroke-width="2.5"/>

  <!-- NAND Gate D-shape -->
  <path d="M 190 75 L 230 75 A 45 45 0 0 1 230 165 L 190 165 Z" fill="#fce7f3" stroke="#db2777" stroke-width="2.5"/>
  <!-- Inversion Bubble -->
  <circle cx="280" cy="120" r="6" fill="#ffffff" stroke="#db2777" stroke-width="2.5"/>
  <text x="215" y="125" font-size="13" font-weight="700" fill="#be185d">NAND</text>

  <!-- Output Y -->
  <line x1="286" y1="120" x2="350" y2="120" stroke="#1e293b" stroke-width="2.5"/>
  <circle cx="350" cy="120" r="4.5" fill="#0f172a"/>
  <text x="365" y="125" font-size="16" font-weight="800" fill="#0f172a">Y = Ā (NOT)</text>
</svg>`;

// ==========================================
// 8. Titration Apparatus Setup
// ==========================================
const svg_apparatus_titration = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 400" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <text x="270" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">টাইট্রেশন অ্যাপারেটাস সেটআপ (Titration Setup)</text>

  <!-- Retort Stand Base -->
  <rect x="80" y="360" width="160" height="15" rx="3" fill="#334155"/>
  <!-- Retort Stand Rod -->
  <rect x="120" y="60" width="8" height="300" fill="#64748b"/>

  <!-- Burette Clamp -->
  <rect x="128" y="130" width="45" height="10" fill="#475569"/>
  <rect x="173" y="120" width="14" height="30" rx="3" fill="#0284c7"/>

  <!-- Burette Tube -->
  <rect x="175" y="70" width="10" height="190" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.8"/>
  <!-- Solution in Burette (H2SO4) -->
  <rect x="176" y="100" width="8" height="160" fill="#7dd3fc" opacity="0.7"/>

  <!-- Burette Ticks -->
  <line x1="175" y1="110" x2="180" y2="110" stroke="#0369a1" stroke-width="1"/>
  <line x1="175" y1="130" x2="182" y2="130" stroke="#0369a1" stroke-width="1.2"/>
  <line x1="175" y1="150" x2="180" y2="150" stroke="#0369a1" stroke-width="1"/>
  <line x1="175" y1="170" x2="182" y2="170" stroke="#0369a1" stroke-width="1.2"/>
  <line x1="175" y1="190" x2="180" y2="190" stroke="#0369a1" stroke-width="1"/>
  <line x1="175" y1="210" x2="182" y2="210" stroke="#0369a1" stroke-width="1.2"/>

  <!-- Stopcock Valve -->
  <circle cx="180" cy="263" r="5" fill="#ef4444"/>
  <line x1="173" y1="263" x2="187" y2="263" stroke="#b91c1c" stroke-width="3"/>
  <!-- Burette Tip -->
  <path d="M 178 268 L 180 285 L 182 268 Z" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>

  <!-- Droplet -->
  <circle cx="180" cy="295" r="2.5" fill="#38bdf8"/>

  <!-- Conical Flask (Titration Flask) -->
  <path d="M 174 310 L 174 320 L 150 360 L 210 360 L 186 320 L 186 310 Z" fill="#f8fafc" stroke="#475569" stroke-width="2"/>
  <!-- Liquid in Flask (NaOH + Indicator) -->
  <path d="M 155 352 L 205 352 L 210 360 L 150 360 Z" fill="#fbcfe8" opacity="0.8"/>

  <!-- Pipette (drawn beside) -->
  <path d="M 330 90 L 334 90 L 334 160 Q 338 175 342 190 L 342 220 Q 338 235 334 250 L 334 320 L 332 335 L 330 320 L 330 250 Q 326 235 322 220 L 322 190 Q 326 175 330 160 Z" fill="#e0f2fe" stroke="#059669" stroke-width="1.8"/>
  <!-- Solution in Pipette (10 ml) -->
  <path d="M 330 180 L 334 180 L 334 220 L 332 330 L 330 220 Z" fill="#a7f3d0" opacity="0.8"/>
  <line x1="328" y1="120" x2="336" y2="120" stroke="#047857" stroke-width="1.5"/>
  <text x="345" y="123" font-size="11" font-weight="700" fill="#047857">10 ml দাগ</text>

  <!-- Labels & Pointers -->
  <line x1="190" y1="120" x2="245" y2="105" stroke="#64748b" stroke-width="1.5"/>
  <text x="250" y="108" font-size="13" font-weight="700" fill="#0369a1">বুরেট (H₂SO₄ দ্রবণ)</text>

  <line x1="190" y1="263" x2="245" y2="263" stroke="#64748b" stroke-width="1.5"/>
  <text x="250" y="267" font-size="13" font-weight="700" fill="#b91c1c">স্টপকক (Stopcock)</text>

  <line x1="210" y1="345" x2="245" y2="345" stroke="#64748b" stroke-width="1.5"/>
  <text x="250" y="348" font-size="13" font-weight="700" fill="#0f172a">কনিক্যাল ফ্লাস্ক (NaOH)</text>

  <text x="332" y="370" font-size="13" font-weight="700" fill="#047857" text-anchor="middle">পিপেট (Pipette)</text>
  <text x="332" y="388" font-size="11" font-weight="600" fill="#64748b" text-anchor="middle">নির্দিষ্ট আয়তন স্থানান্তরে ব্যবহৃত</text>
</svg>`;

// ==========================================
// 9. SHM Kinetic Energy vs Displacement Curves (A, B, C)
// ==========================================
const svg_shm_ke_displacement = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 380" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="arr-shm" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>
    </marker>
  </defs>

  <text x="260" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">গতিশক্তি বনাম সরণ লেখচিত্র (Ek - x Graph)</text>

  <!-- Axes -->
  <line x1="70" y1="300" x2="70" y2="60" stroke="#1e293b" stroke-width="2.2" marker-end="url(#arr-shm)"/>
  <text x="65" y="52" font-size="14" font-weight="700" fill="#0f172a" text-anchor="end">Ek (গতিশক্তি)</text>

  <line x1="70" y1="300" x2="470" y2="300" stroke="#1e293b" stroke-width="2.2" marker-end="url(#arr-shm)"/>
  <text x="475" y="305" font-size="14" font-weight="700" fill="#0f172a" text-anchor="start">x (সরণ)</text>

  <!-- Equilibrium line (x = 0) -->
  <line x1="270" y1="300" x2="270" y2="65" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4,4"/>
  <text x="270" y="325" font-size="13" font-weight="700" fill="#475569" text-anchor="middle">x = 0 (সাম্যাবস্থা)</text>
  <text x="130" y="325" font-size="13" font-weight="600" fill="#64748b" text-anchor="middle">-A</text>
  <text x="410" y="325" font-size="13" font-weight="600" fill="#64748b" text-anchor="middle">+A</text>

  <!-- Parabolic Curve A (Highest: Peak at 80) -->
  <path d="M 130 300 Q 270 -60 410 300" fill="none" stroke="#2563eb" stroke-width="3"/>
  <circle cx="270" cy="80" r="5" fill="#2563eb"/>
  <text x="285" y="85" font-size="15" font-weight="800" fill="#2563eb">A (সর্বোচ্চ Ek)</text>

  <!-- Parabolic Curve B (Middle: Peak at 145) -->
  <path d="M 130 300 Q 270 40 410 300" fill="none" stroke="#059669" stroke-width="3"/>
  <circle cx="270" cy="145" r="5" fill="#059669"/>
  <text x="285" y="150" font-size="15" font-weight="800" fill="#059669">B</text>

  <!-- Parabolic Curve C (Lowest: Peak at 215) -->
  <path d="M 130 300 Q 270 145 410 300" fill="none" stroke="#d97706" stroke-width="3"/>
  <circle cx="270" cy="215" r="5" fill="#d97706"/>
  <text x="285" y="220" font-size="15" font-weight="800" fill="#d97706">C</text>

  <!-- Summary note -->
  <text x="260" y="360" font-size="12" font-weight="700" fill="#334155" text-anchor="middle">Ek ∝ ω² ⇒ ω_A &gt; ω_B &gt; ω_C ⇒ T_C &gt; T_B &gt; T_A</text>
</svg>`;

// ==========================================
// 10. Adiabatic P-V Curves (He vs O2)
// ==========================================
const svg_pv_adiabatic_he_o2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 380" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="arr-pv2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>
    </marker>
    <marker id="arr-exp1" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7"/>
    </marker>
    <marker id="arr-exp2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#dc2626"/>
    </marker>
  </defs>

  <text x="260" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">রুদ্ধতাপীয় প্রসারণ লেখচিত্র (P - V Graph)</text>

  <!-- Axes -->
  <line x1="80" y1="310" x2="80" y2="55" stroke="#1e293b" stroke-width="2.2" marker-end="url(#arr-pv2)"/>
  <text x="75" y="48" font-size="14" font-weight="700" fill="#0f172a" text-anchor="end">P (চাপ)</text>

  <line x1="80" y1="310" x2="470" y2="310" stroke="#1e293b" stroke-width="2.2" marker-end="url(#arr-pv2)"/>
  <text x="475" y="315" font-size="14" font-weight="700" fill="#0f172a" text-anchor="start">V (আয়তন)</text>

  <!-- Common Initial Point (P0, V0) -->
  <circle cx="160" cy="110" r="5.5" fill="#0f172a"/>
  <text x="145" y="105" font-size="14" font-weight="800" fill="#0f172a">(P₀, V₀)</text>

  <!-- Curve 1: O2 (Diatomic, gamma = 1.4, Less steep) -->
  <path d="M 160 110 Q 230 190 380 230" fill="none" stroke="#0284c7" stroke-width="3.2"/>
  <line x1="280" y1="195" x2="305" y2="207" stroke="#0284c7" stroke-width="3.2" marker-end="url(#arr-exp1)"/>
  <circle cx="380" cy="230" r="5" fill="#0284c7"/>
  <text x="395" y="235" font-size="14" font-weight="700" fill="#0284c7">১ নং রেখা (কম ঢাল, O₂)</text>

  <!-- Curve 2: He (Monoatomic, gamma = 1.67, Steeper slope) -->
  <path d="M 160 110 Q 210 220 330 280" fill="none" stroke="#dc2626" stroke-width="3.2"/>
  <line x1="240" y1="215" x2="260" y2="238" stroke="#dc2626" stroke-width="3.2" marker-end="url(#arr-exp2)"/>
  <circle cx="330" cy="280" r="5" fill="#dc2626"/>
  <text x="345" y="285" font-size="14" font-weight="700" fill="#dc2626">২ নং রেখা (অধিক ঢাল, He)</text>

  <!-- Slope note -->
  <text x="260" y="355" font-size="12" font-weight="700" fill="#334155" text-anchor="middle">ঢাল ∝ γ ⇒ γ_He (১.৬৭) &gt; γ_O₂ (১.৪) ⇒ ২ নং He ও ১ নং O₂</text>
</svg>`;

// ==========================================
// 11. Common-Base BJT Transistor Circuit
// ==========================================
const svg_bjt_common_base = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 360" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="arr-cir" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#dc2626"/>
    </marker>
  </defs>

  <text x="270" y="30" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">Common-Base BJT সার্কিট</text>

  <!-- Transistor Circle & Terminals (Center at (270, 160)) -->
  <circle cx="270" cy="160" r="32" fill="#f8fafc" stroke="#1e293b" stroke-width="2.5"/>
  <!-- Base Bar (Vertical) -->
  <line x1="270" y1="135" x2="270" y2="185" stroke="#1e293b" stroke-width="4"/>

  <!-- Emitter Lead (Left) -->
  <line x1="270" y1="150" x2="248" y2="135" stroke="#1e293b" stroke-width="2.5"/>
  <!-- Arrow on Emitter pointing IN for PNP or OUT for NPN -->
  <line x1="262" y1="145" x2="252" y2="138" stroke="#1e293b" stroke-width="2.5"/>
  <line x1="248" y1="135" x2="220" y2="135" stroke="#1e293b" stroke-width="2.5"/>
  <text x="225" y="125" font-size="13" font-weight="800" fill="#0284c7">E</text>

  <!-- Collector Lead (Right) -->
  <line x1="270" y1="170" x2="292" y2="185" stroke="#1e293b" stroke-width="2.5"/>
  <line x1="292" y1="185" x2="320" y2="185" stroke="#1e293b" stroke-width="2.5"/>
  <text x="315" y="175" font-size="13" font-weight="800" fill="#0284c7">C</text>

  <!-- Base Lead (Grounded Bottom) -->
  <line x1="270" y1="185" x2="270" y2="240" stroke="#1e293b" stroke-width="2.5"/>
  <circle cx="270" cy="240" r="3.5" fill="#1e293b"/>
  <text x="282" y="225" font-size="13" font-weight="800" fill="#0284c7">B</text>

  <!-- Ground Symbol -->
  <line x1="255" y1="240" x2="285" y2="240" stroke="#1e293b" stroke-width="2.5"/>
  <line x1="260" y1="246" x2="280" y2="246" stroke="#1e293b" stroke-width="2"/>
  <line x1="265" y1="252" x2="275" y2="252" stroke="#1e293b" stroke-width="1.5"/>

  <!-- Emitter Loop (Left) -->
  <!-- Wire from E leftwards to Resistor RE -->
  <line x1="220" y1="135" x2="160" y2="135" stroke="#1e293b" stroke-width="2.2"/>
  <!-- Resistor RE = 1.5 kΩ -->
  <path d="M 160 135 L 155 125 L 145 145 L 135 125 L 125 145 L 115 125 L 110 135" fill="none" stroke="#0284c7" stroke-width="2.2"/>
  <text x="135" y="115" font-size="12" font-weight="700" fill="#0284c7" text-anchor="middle">R_E = 1.5 kΩ</text>
  <line x1="110" y1="135" x2="70" y2="135" stroke="#1e293b" stroke-width="2.2"/>

  <!-- Left Battery VEE = 8V -->
  <line x1="70" y1="135" x2="70" y2="185" stroke="#1e293b" stroke-width="2.2"/>
  <line x1="55" y1="185" x2="85" y2="185" stroke="#0284c7" stroke-width="3.5"/> <!-- Long plate -->
  <line x1="60" y1="193" x2="80" y2="193" stroke="#1e293b" stroke-width="2"/> <!-- Short plate -->
  <text x="40" y="195" font-size="12" font-weight="700" fill="#0284c7">8 V</text>
  <line x1="70" y1="193" x2="70" y2="240" stroke="#1e293b" stroke-width="2.2"/>
  <line x1="70" y1="240" x2="255" y2="240" stroke="#1e293b" stroke-width="2.2"/>

  <!-- Collector Loop (Right) -->
  <!-- Wire from C rightwards to Resistor RC -->
  <line x1="320" y1="185" x2="380" y2="185" stroke="#1e293b" stroke-width="2.2"/>
  <!-- Resistor RC = 1.2 kΩ -->
  <path d="M 380 185 L 385 175 L 395 195 L 405 175 L 415 195 L 425 175 L 430 185" fill="none" stroke="#0284c7" stroke-width="2.2"/>
  <text x="405" y="165" font-size="12" font-weight="700" fill="#0284c7" text-anchor="middle">R_C = 1.2 kΩ</text>
  <line x1="430" y1="185" x2="470" y2="185" stroke="#1e293b" stroke-width="2.2"/>

  <!-- Right Battery VCC = 18V -->
  <line x1="470" y1="185" x2="470" y2="205" stroke="#1e293b" stroke-width="2.2"/>
  <line x1="455" y1="205" x2="485" y2="205" stroke="#0284c7" stroke-width="3.5"/>
  <line x1="460" y1="213" x2="480" y2="213" stroke="#1e293b" stroke-width="2"/>
  <text x="500" y="215" font-size="12" font-weight="700" fill="#0284c7">18 V</text>
  <line x1="470" y1="213" x2="470" y2="240" stroke="#1e293b" stroke-width="2.2"/>
  <line x1="470" y1="240" x2="285" y2="240" stroke="#1e293b" stroke-width="2.2"/>

  <!-- Voltage indicators -->
  <text x="235" y="180" font-size="12" font-weight="700" fill="#dc2626">V_BE = 0.7 V</text>
  <text x="325" y="210" font-size="12" font-weight="700" fill="#dc2626">V_CB = 12.5 V</text>

  <!-- Output query label -->
  <text x="270" y="320" font-size="13" font-weight="700" fill="#0f172a" text-anchor="middle">Determine I_B = I_E - I_C = 0.29 mA</text>
</svg>`;

async function uploadToR2(key: string, content: string, contentType: string): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Body: Buffer.from(content, 'utf-8'),
    })
  );
  return `${r2PublicDomain}/${key}`;
}

async function run() {
  console.log('🚀 Uploading all 11 SVGs to Cloudflare R2...');

  const svgs = [
    { key: 'questions/diagrams/pv_trapezium_work.svg', content: svg_pv_trapezium },
    { key: 'questions/diagrams/pv_isochoric_xb.svg', content: svg_pv_isochoric_xb },
    { key: 'questions/diagrams/wheatstone_resistor_bc.svg', content: svg_resistor_circuit_bc },
    { key: 'questions/diagrams/pv_cyclic_triangle.svg', content: svg_pv_cyclic_triangle },
    { key: 'questions/diagrams/logic_or_and_3input.svg', content: svg_logic_or_and },
    { key: 'questions/diagrams/logic_and_or_combination.svg', content: svg_logic_and_or_combination },
    { key: 'questions/diagrams/logic_nand_shorted_not.svg', content: svg_logic_nand_shorted_not },
    { key: 'questions/diagrams/apparatus_titration.svg', content: svg_apparatus_titration },
    { key: 'questions/diagrams/shm_ke_displacement_curves.svg', content: svg_shm_ke_displacement },
    { key: 'questions/diagrams/pv_adiabatic_he_o2.svg', content: svg_pv_adiabatic_he_o2 },
    { key: 'questions/diagrams/bjt_common_base_circuit.svg', content: svg_bjt_common_base },
  ];

  const urls: Record<string, string> = {};
  for (const item of svgs) {
    const url = await uploadToR2(item.key, item.content, 'image/svg+xml');
    urls[item.key] = url;
    console.log(`✅ Uploaded: ${item.key} -> ${url}`);
  }

  console.log('\n📝 Updating Supabase Live Exam Questions...');

  // Helper to update question with image markdown
  async function updateQuestion(examTitle: string, serial: number, imageMarkdown: string, opts?: { updateExplanation?: string }) {
    const { data: exam } = await supabase.from('live_exams').select('id, title').eq('title', examTitle).single();
    if (!exam) {
      console.error(`❌ Exam not found: ${examTitle}`);
      return;
    }
    const { data: q } = await supabase.from('live_exam_questions')
      .select('id, question, explanation')
      .eq('live_exam_id', exam.id)
      .eq('serial', serial)
      .single();

    if (!q) {
      console.error(`❌ Question not found: ${examTitle} Q${serial}`);
      return;
    }

    let updatedQuestion = q.question;
    // Remove any existing broken markdown image if present, then add new
    if (!updatedQuestion.includes(imageMarkdown)) {
      updatedQuestion = updatedQuestion.trim() + '\n\n' + imageMarkdown;
    }

    const updatePayload: any = { question: updatedQuestion };
    if (opts?.updateExplanation) {
      updatePayload.explanation = opts.updateExplanation;
    }

    await supabase.from('live_exam_questions')
      .update(updatePayload)
      .eq('id', q.id);

    console.log(`✅ Updated: [${examTitle}] Q${serial}`);
  }

  // 1. P-V Trapezium Work Questions
  const pvTrapeziumMd = `![P-V লেখচিত্র](${urls['questions/diagrams/pv_trapezium_work.svg']})`;
  await updateQuestion('Varsity Daily Exam - 1', 33, pvTrapeziumMd);
  await updateQuestion('Varsity Weekly Exam - 1', 26, pvTrapeziumMd);
  await updateQuestion('Varsity Weekly Exam - 3', 77, pvTrapeziumMd);

  // 2. P-V Isochoric XB
  const pvIsochoricMd = `![P-V লেখচিত্র](${urls['questions/diagrams/pv_isochoric_xb.svg']})`;
  await updateQuestion('Varsity Daily Exam - 4', 7, pvIsochoricMd);

  // 3. Wheatstone Resistor BC
  const resistorBcMd = `![বর্তনী চিত্র](${urls['questions/diagrams/wheatstone_resistor_bc.svg']})`;
  await updateQuestion('Varsity Daily Exam - 12', 28, resistorBcMd);

  // 4. Triangular Cyclic P-V Diagram
  const pvTriangleMd = `![P-V চক্রিক প্রক্রিয়া](${urls['questions/diagrams/pv_cyclic_triangle.svg']})`;
  await updateQuestion('Engineering Daily Exam - 8', 14, pvTriangleMd);
  await updateQuestion('Engineering Weekly Exam - 3', 15, pvTriangleMd);

  // 5. 3-Input Logic Gate (OR into AND)
  const logicOrAndMd = `![লজিক বর্তনী](${urls['questions/diagrams/logic_or_and_3input.svg']})`;
  await updateQuestion('Engineering Daily Exam - 22', 16, logicOrAndMd);
  await updateQuestion('Engineering Weekly Exam - 8', 8, logicOrAndMd);

  // 6. AND + OR Combination (Y = A + AB)
  const logicAndOrMd = `![লজিক গেট সমবায়](${urls['questions/diagrams/logic_and_or_combination.svg']})`;
  await updateQuestion('Varsity Daily Exam - 21', 46, logicAndOrMd);
  await updateQuestion('Varsity Daily Exam - 21', 49, logicAndOrMd);
  await updateQuestion('Varsity Weekly Exam - 7', 80, logicAndOrMd);

  // 7. Shorted NAND Gate as NOT
  const logicNandNotMd = `![NAND গেট সমবায়](${urls['questions/diagrams/logic_nand_shorted_not.svg']})`;
  await updateQuestion('Varsity Daily Exam - 21', 47, logicNandNotMd);
  await updateQuestion('Varsity Weekly Exam - 7', 72, logicNandNotMd);

  // 8. Titration Apparatus (Update Explanations replacing broken r2.obhyash.com URL)
  const titrationUrl = urls['questions/diagrams/apparatus_titration.svg'];
  const fixedTitrationExpl = `![টাইট্রেশন অ্যাপারেটাস](${titrationUrl})\n\nপিপেট হলো বিশ্লেষণী রসায়নে ব্যবহৃত একটি কাঁচের নল যা নির্দিষ্ট আয়তনের তরল পরিমাপ করে স্থানান্তর করার কাজে ব্যবহৃত হয়। টাইট্রেশনের সময় গোলতলী ফ্লাস্কে নির্দিষ্ট আয়তনের ক্ষার (যেমন: 10 $\\text{ ml} \\text{ NaOH}$) নেওয়ার জন্য পিপেট সবচেয়ে উপযুক্ত উপকরণ।`;

  for (const item of [
    { title: 'Engineering Weekly Exam - 7', serial: 100 },
    { title: 'Engineering Daily Exam - 20', serial: 50 },
  ]) {
    const { data: exam } = await supabase.from('live_exams').select('id, title').eq('title', item.title).single();
    if (exam) {
      await supabase.from('live_exam_questions')
        .update({ explanation: fixedTitrationExpl })
        .eq('live_exam_id', exam.id)
        .eq('serial', item.serial);
      console.log(`✅ Fixed broken explanation image: [${item.title}] Q${item.serial}`);
    }
  }

  // 9. SHM Kinetic Energy vs Displacement Curves
  const shmKeMd = `![গতিশক্তি বনাম সরণ লেখচিত্র](${urls['questions/diagrams/shm_ke_displacement_curves.svg']})`;
  await updateQuestion('Engineering Daily Exam - 6', 47, shmKeMd);

  // 10. Adiabatic P-V Curves (He vs O2)
  const pvAdiabaticMd = `![রুদ্ধতাপীয় প্রসারণ লেখচিত্র](${urls['questions/diagrams/pv_adiabatic_he_o2.svg']})`;
  await updateQuestion('Varsity Daily Exam - 12', 37, pvAdiabaticMd);

  // 11. Common-Base BJT Transistor Circuit
  const bjtCircuitMd = `![Common-Base BJT সার্কিট](${urls['questions/diagrams/bjt_common_base_circuit.svg']})`;
  await updateQuestion('Engineering Daily Exam - 22', 43, bjtCircuitMd);

  console.log('\n🎉 ALL SVGs generated, uploaded to R2, and database successfully updated!');
}

run().catch(console.error);

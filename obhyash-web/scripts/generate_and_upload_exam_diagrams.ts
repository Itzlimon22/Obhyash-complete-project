import * as fs from 'fs';
import * as path from 'path';
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

// --- SVG 1: P-V Indicator Diagram for varsity_live_09 Q16 ---
const svg1_PV_Diagram = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 380" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>
    </marker>
    <marker id="arrow-accent" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284c7"/>
    </marker>
    <linearGradient id="shade-pv" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#bae6fd" stop-opacity="0.15"/>
    </linearGradient>
  </defs>

  <!-- Title / Label -->
  <text x="260" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">P - V লেখচিত্র (কৃতকাজ নির্ণয়)</text>

  <!-- Shaded Trapezium Area -->
  <polygon points="180,230 180,180 340,100 340,290 180,290" fill="url(#shade-pv)" stroke="none" />
  
  <!-- Dashed drop lines -->
  <line x1="180" y1="230" x2="80" y2="230" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="340" y1="100" x2="80" y2="100" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="180" y1="230" x2="180" y2="290" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="340" y1="100" x2="340" y2="290" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Process line A -> B -->
  <line x1="180" y1="230" x2="340" y2="100" stroke="#0284c7" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Middle direction arrow on line -->
  <line x1="250" y1="173" x2="268" y2="158" stroke="#0284c7" stroke-width="3.5" marker-end="url(#arrow-accent)"/>

  <!-- Points A and B -->
  <circle cx="180" cy="230" r="5" fill="#0369a1"/>
  <text x="170" y="222" font-size="14" font-weight="700" fill="#0369a1" text-anchor="end">A</text>

  <circle cx="340" cy="100" r="5" fill="#0369a1"/>
  <text x="355" y="98" font-size="14" font-weight="700" fill="#0369a1">B</text>

  <!-- Shaded Area Text -->
  <text x="260" y="225" font-size="13" font-weight="600" fill="#0369a1" text-anchor="middle">W = আবদ্ধ ক্ষেত্রফল</text>

  <!-- Y Axis (Pressure) -->
  <line x1="80" y1="290" x2="80" y2="55" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="75" y="48" font-size="14" font-weight="700" fill="#0f172a" text-anchor="end">P (N/m²)</text>

  <!-- X Axis (Volume) -->
  <line x1="80" y1="290" x2="460" y2="290" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow)"/>
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

  <line x1="420" y1="290" x2="420" y2="295" stroke="#94a3b8" stroke-width="1.5"/>
  <text x="420" y="315" font-size="13" font-weight="500" fill="#64748b" text-anchor="middle">3</text>
</svg>`;


// --- SVG 2: KVL Circuit Diagram for engineering_live_13 Q32 ---
const svg2_Circuit_Diagram = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 360" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="cur-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 2 L 7 5 L 0 8 z" fill="#0284c7"/>
    </marker>
  </defs>

  <!-- Title -->
  <text x="270" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">বর্তনী চিত্র (KVL প্রয়োগ)</text>

  <!-- Circuit Loop Wire -->
  <!-- Top Wire: (90, 80) to (450, 80) with Diodes in between -->
  <line x1="90" y1="80" x2="180" y2="80" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
  
  <!-- Silicon Diode at x=200 -->
  <g transform="translate(180, 65)">
    <!-- Diode Triangle -->
    <polygon points="0,0 0,30 25,15" fill="#0f172a" stroke="#0f172a" stroke-width="2"/>
    <!-- Cathode Bar -->
    <line x1="25" y1="0" x2="25" y2="30" stroke="#0f172a" stroke-width="3"/>
    <text x="12" y="-8" font-size="12" font-weight="700" fill="#0369a1" text-anchor="middle">Si (0.7V)</text>
  </g>
  <line x1="205" y1="80" x2="275" y2="80" stroke="#1e293b" stroke-width="2.5"/>

  <!-- Germanium Diode at x=295 -->
  <g transform="translate(275, 65)">
    <!-- Diode Triangle -->
    <polygon points="0,0 0,30 25,15" fill="#0f172a" stroke="#0f172a" stroke-width="2"/>
    <!-- Cathode Bar -->
    <line x1="25" y1="0" x2="25" y2="30" stroke="#0f172a" stroke-width="3"/>
    <text x="12" y="-8" font-size="12" font-weight="700" fill="#0369a1" text-anchor="middle">Ge (0.3V)</text>
  </g>
  <line x1="300" y1="80" x2="450" y2="80" stroke="#1e293b" stroke-width="2.5"/>

  <!-- Right Branch with Source E -->
  <line x1="450" y1="80" x2="450" y2="150" stroke="#1e293b" stroke-width="2.5"/>
  <!-- Source E Plates (Positive at Top opposing clockwise current) -->
  <line x1="432" y1="150" x2="468" y2="150" stroke="#1e293b" stroke-width="3.5"/>
  <text x="478" y="146" font-size="14" font-weight="700" fill="#dc2626">+</text>
  <line x1="439" y1="165" x2="461" y2="165" stroke="#1e293b" stroke-width="3.5"/>
  <text x="478" y="171" font-size="14" font-weight="700" fill="#dc2626">-</text>
  <text x="415" y="162" font-size="15" font-weight="700" fill="#0f172a" text-anchor="end">E = ?</text>
  <line x1="450" y1="165" x2="450" y2="280" stroke="#1e293b" stroke-width="2.5"/>

  <!-- Bottom Branch with Resistor R = 4 ohm -->
  <line x1="450" y1="280" x2="310" y2="280" stroke="#1e293b" stroke-width="2.5"/>
  <!-- Resistor zigzag / rectangle -->
  <rect x="230" y="268" width="80" height="24" rx="4" fill="#f8fafc" stroke="#1e293b" stroke-width="2.5"/>
  <text x="270" y="284" font-size="13" font-weight="700" fill="#0f172a" text-anchor="middle">R = 4 Ω</text>
  <line x1="230" y1="280" x2="90" y2="280" stroke="#1e293b" stroke-width="2.5"/>

  <!-- Left Branch with 20V Battery -->
  <line x1="90" y1="280" x2="90" y2="195" stroke="#1e293b" stroke-width="2.5"/>
  <!-- 20V Source Plates (Long positive plate at top) -->
  <line x1="72" y1="165" x2="108" y2="165" stroke="#1e293b" stroke-width="3.5"/>
  <text x="62" y="161" font-size="14" font-weight="700" fill="#16a34a">+</text>
  <line x1="79" y1="180" x2="101" y2="180" stroke="#1e293b" stroke-width="3.5"/>
  <text x="62" y="186" font-size="14" font-weight="700" fill="#16a34a">-</text>
  <text x="125" y="177" font-size="15" font-weight="700" fill="#0f172a">20 V</text>
  <line x1="90" y1="165" x2="90" y2="80" stroke="#1e293b" stroke-width="2.5"/>

  <!-- Clockwise Current Loop Indicator -->
  <g transform="translate(270, 180)">
    <path d="M -30,-20 A 35 35 0 1 1 30,20" fill="none" stroke="#0284c7" stroke-width="2" stroke-dasharray="5,4"/>
    <line x1="25" y1="19" x2="35" y2="16" stroke="#0284c7" stroke-width="2" marker-end="url(#cur-arrow)"/>
    <text x="0" y="5" font-size="14" font-weight="700" fill="#0284c7" text-anchor="middle">I = 2.5 A</text>
  </g>
</svg>`;


// --- SVG 3: F-x Force vs Displacement Graph for engineering_live_12 Q46 ---
const svg3_Fx_Graph = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 380" width="100%" height="100%" style="background:#ffffff; border-radius:12px; font-family:system-ui, -apple-system, sans-serif;">
  <defs>
    <marker id="arrow-fx" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>
    </marker>
    <linearGradient id="shade-fx1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#a7f3d0" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="shade-fx2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#bfdbfe" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="shade-fx3" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#fde68a" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <!-- Title -->
  <text x="270" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#0f172a">বল-সরণ (F - x) লেখচিত্র</text>

  <!-- Shaded Region 1: x=0 to 1, F=5 -->
  <!-- Origin x=90, y=290. 1m = 100px. 5N = 45px (15N = 135px, 20N = 180px) -->
  <rect x="90" y="245" width="100" height="45" fill="url(#shade-fx1)"/>
  <text x="140" y="272" font-size="12" font-weight="700" fill="#047857" text-anchor="middle">W₁ = 5 J</text>

  <!-- Shaded Region 2: x=1 to 2, F=15 -->
  <rect x="190" y="155" width="100" height="135" fill="url(#shade-fx2)"/>
  <text x="240" y="225" font-size="12" font-weight="700" fill="#1d4ed8" text-anchor="middle">W₂ = 15 J</text>

  <!-- Shaded Region 3: x=2 to 3, F=10 -->
  <rect x="290" y="200" width="100" height="90" fill="url(#shade-fx3)"/>
  <text x="340" y="250" font-size="12" font-weight="700" fill="#b45309" text-anchor="middle">W₃ = 10 J</text>

  <!-- Dashed horizontal guide lines to Y-axis -->
  <line x1="90" y1="245" x2="90" y2="245" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="90" y1="200" x2="290" y2="200" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>
  <line x1="90" y1="155" x2="190" y2="155" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4"/>

  <!-- Step Function Line Curve -->
  <line x1="90" y1="245" x2="190" y2="245" stroke="#0f172a" stroke-width="3.5"/>
  <line x1="190" y1="245" x2="190" y2="155" stroke="#0f172a" stroke-width="3" stroke-dasharray="3,3"/>
  <line x1="190" y1="155" x2="290" y2="155" stroke="#0f172a" stroke-width="3.5"/>
  <line x1="290" y1="155" x2="290" y2="200" stroke="#0f172a" stroke-width="3" stroke-dasharray="3,3"/>
  <line x1="290" y1="200" x2="390" y2="200" stroke="#0f172a" stroke-width="3.5"/>
  <line x1="390" y1="200" x2="390" y2="290" stroke="#0f172a" stroke-width="3" stroke-dasharray="3,3"/>

  <!-- Y Axis (Force F) -->
  <line x1="90" y1="290" x2="90" y2="70" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow-fx)"/>
  <text x="85" y="60" font-size="14" font-weight="700" fill="#0f172a" text-anchor="end">F (N)</text>

  <!-- X Axis (Displacement x) -->
  <line x1="90" y1="290" x2="480" y2="290" stroke="#1e293b" stroke-width="2" marker-end="url(#arrow-fx)"/>
  <text x="485" y="295" font-size="14" font-weight="700" fill="#0f172a" text-anchor="start">x (m)</text>

  <!-- Y Ticks -->
  <line x1="85" y1="290" x2="90" y2="290" stroke="#1e293b" stroke-width="2"/>
  <text x="78" y="295" font-size="13" font-weight="600" fill="#475569" text-anchor="end">0</text>

  <line x1="85" y1="245" x2="90" y2="245" stroke="#1e293b" stroke-width="2"/>
  <text x="78" y="250" font-size="13" font-weight="600" fill="#0f172a" text-anchor="end">5</text>

  <line x1="85" y1="200" x2="90" y2="200" stroke="#1e293b" stroke-width="2"/>
  <text x="78" y="205" font-size="13" font-weight="600" fill="#0f172a" text-anchor="end">10</text>

  <line x1="85" y1="155" x2="90" y2="155" stroke="#1e293b" stroke-width="2"/>
  <text x="78" y="160" font-size="13" font-weight="600" fill="#0f172a" text-anchor="end">15</text>

  <!-- X Ticks -->
  <line x1="190" y1="290" x2="190" y2="295" stroke="#1e293b" stroke-width="2"/>
  <text x="190" y="315" font-size="13" font-weight="600" fill="#0f172a" text-anchor="middle">1</text>

  <line x1="290" y1="290" x2="290" y2="295" stroke="#1e293b" stroke-width="2"/>
  <text x="290" y="315" font-size="13" font-weight="600" fill="#0f172a" text-anchor="middle">2</text>

  <line x1="390" y1="290" x2="390" y2="295" stroke="#1e293b" stroke-width="2"/>
  <text x="390" y="315" font-size="13" font-weight="600" fill="#0f172a" text-anchor="middle">3</text>

  <!-- Total summary indicator -->
  <text x="270" y="355" font-size="13" font-weight="600" fill="#334155" text-anchor="middle">মোট কাজ W = W₁ + W₂ + W₃ = 5 + 15 + 10 = 30 J</text>
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
  console.log('🚀 Generating and uploading SVGs to Cloudflare R2...');

  const url1 = await uploadToR2('questions/diagrams/varsity_live_09_q16_pv_diagram.svg', svg1_PV_Diagram, 'image/svg+xml');
  console.log('✅ Uploaded Diagram 1:', url1);

  const url2 = await uploadToR2('questions/diagrams/engineering_live_13_q32_circuit.svg', svg2_Circuit_Diagram, 'image/svg+xml');
  console.log('✅ Uploaded Diagram 2:', url2);

  const url3 = await uploadToR2('questions/diagrams/engineering_live_12_q46_fx_graph.svg', svg3_Fx_Graph, 'image/svg+xml');
  console.log('✅ Uploaded Diagram 3:', url3);

  console.log('\n📝 Updating database questions with diagram markdown...');

  // 1. Update varsity_live_09 Q16
  const { data: exam1 } = await supabase.from('live_exams').select('id').eq('exam_id', 'varsity_live_09').single();
  if (exam1) {
    const newQ1 = `চিত্রে প্রদর্শিত প্রক্রিয়ায় কৃতকাজ কত?\n\n![P-V লেখচিত্র](${url1})`;
    const newExplanation1 = `$P-V$ লেখচিত্রে কৃতকাজ হলো রেখার নিচের ক্ষেত্রফল। এখানে চিত্রটি একটি ট্রাপিজিয়াম নির্দেশ করে।\n\n$$\\begin{aligned} W &= \\text{Trapezium এর ক্ষেত্রফল} \\\\ W &= \\frac{1}{2} \\times (P_1 + P_2) \\times (V_2 - V_1) \\\\ W &= \\frac{1}{2} \\times (10 + 30)\\text{ N/m}^2 \\times (2 - 1)\\text{ m}^3 \\\\ W &= \\frac{1}{2} \\times 40 \\times 1 = 20\\text{ J} \\end{aligned}$$`;
    
    await supabase.from('live_exam_questions')
      .update({
        question: newQ1,
        explanation: newExplanation1,
        options: ['$10\\text{ J}$', '$20\\text{ J}$', '$30\\text{ J}$', '$40\\text{ J}$'],
        correct_answer_index: 1
      })
      .eq('live_exam_id', exam1.id)
      .eq('serial', 16);
    console.log('✅ Updated varsity_live_09 Q16');
  }

  // 2. Update engineering_live_13 Q32
  const { data: exam2 } = await supabase.from('live_exams').select('id').eq('exam_id', 'engineering_live_13').single();
  if (exam2) {
    const newQ2 = `চিত্রে প্রদর্শিত বর্তনীতে তড়িৎপ্রবাহ $I = 2.5\\text{ A}$ হলে, ভোল্টেজ উৎস $E$ এর মান কত?\n\n![বর্তনী চিত্র](${url2})`;
    const newExplanation2 = `কার্শফের ভোল্টেজ সূত্র (KVL) ঘড়ির কাঁটার দিকে প্রয়োগ করে পাই:\n\n$$\\begin{aligned} \\sum V &= 0 \\\\ +20\\text{ V} - V_{\\text{Si}} - V_{\\text{Ge}} - E - I \\cdot R &= 0 \\\\ 20 - 0.7 - 0.3 - E &= 2.5 \\times 4 \\\\ 19 - E &= 10 \\\\ E &= 19 - 10 = 9\\text{ V} \\end{aligned}$$`;

    await supabase.from('live_exam_questions')
      .update({
        question: newQ2,
        explanation: newExplanation2,
        options: ['7 V', '9 V', '11 V', '13 V'],
        correct_answer_index: 1
      })
      .eq('live_exam_id', exam2.id)
      .eq('serial', 32);
    console.log('✅ Updated engineering_live_13 Q32');
  }

  // 3. Update engineering_live_12 Q46
  const { data: exam3 } = await supabase.from('live_exams').select('id').eq('exam_id', 'engineering_live_12').single();
  if (exam3) {
    const newQ3 = `চিত্রে প্রদর্শিত পরিবর্তনশীল বল $F$ এর অধীনে একটি বস্তুকে $x = 0\\text{ m}$ হতে $x = 3\\text{ m}$ অবস্থানে স্থানান্তরিত করতে কৃতকাজ কত?\n\n![বল-সরণ লেখচিত্র](${url3})`;
    const newExplanation3 = `বল-সরণ ($F-x$) লেখচিত্রের নিচে আবদ্ধ ক্ষেত্রফলই হলো সম্পাদিত কাজের পরিমাণ:\n\n$$\\begin{aligned} W &= \\int_{0}^{3} F \\, dx = W_1 + W_2 + W_3 \\\\ W &= (5\\text{ N} \\times 1\\text{ m}) + (15\\text{ N} \\times 1\\text{ m}) + (10\\text{ N} \\times 1\\text{ m}) \\\\ W &= 5\\text{ J} + 15\\text{ J} + 10\\text{ J} = 30\\text{ J} \\end{aligned}$$`;

    await supabase.from('live_exam_questions')
      .update({
        question: newQ3,
        explanation: newExplanation3,
        options: ['25 J', '30 J', '35 J', '40 J'],
        correct_answer_index: 1
      })
      .eq('live_exam_id', exam3.id)
      .eq('serial', 46);
    console.log('✅ Updated engineering_live_12 Q46');
  }

  console.log('🎉 All 3 questions updated successfully with R2 SVG diagrams!');
}

run().catch(console.error);

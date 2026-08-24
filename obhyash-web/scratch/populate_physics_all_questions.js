const fs = require('fs');
const path = require('path');

const baseDir = '/Users/limon/Obhyash-complete-project/obhyash-web/obhyash-flutter/obhyash_app/assets/formulas/hsc_physics_1';

// Detailed Question Banks for every chapter
const chapterQuestions = {
  1: (item, idx) => [
    {
      question: `একটি স্লাইড ক্যালিপার্সে প্রধান স্কেলের ক্ষুদ্রতম এক ঘরের মান $1\\text{ mm}$। ভার্নিয়ারের $20$ ভাগ প্রধান স্কেলের $19$ ভাগের সাথে মিলে গেলে ভার্নিয়ার ধ্রুবক নির্ণয় করো।`,
      answer: `Ans: $VC = 1 - \\frac{19}{20} = 0.05\\text{ mm} = 0.005\\text{ cm}$`
    },
    {
      question: `একটি গোলকের পরিমাপকৃত ব্যাস $d = (4.25 \\pm 0.01)\\text{ cm}$ হলে গোলকটির আয়তন পরিমাপে শতকরা আপেক্ষিক ত্রুটি কত?`,
      answer: `Ans: $V \\propto d^3 \\implies \\frac{\\Delta V}{V} = 3\\left(\\frac{\\Delta d}{d}\\right) = 3\\left(\\frac{0.01}{4.25}\\right) \\times 100\\% \\approx 0.706\\%$`
    },
    {
      question: `একটি স্ক্রু গজের বৃত্তাকার স্কেলের ভাগ সংখ্যা $100$ এবং পিচ $0.5\\text{ mm}$। এর সাহায্যে একটি তারের ব্যাস পরিমাপে রৈখিক স্কেল পাঠ $2\\text{ mm}$ এবং বৃত্তাকার স্কেল পাঠ $45$ হলে তারের ব্যাস কত?`,
      answer: `Ans: $LC = \\frac{0.5}{100} = 0.005\\text{ mm} \\implies d = 2 + (45 \\times 0.005) = 2.225\\text{ mm}$`
    }
  ],
  2: (item, idx) => [
    {
      question: `দুটি সমান মানের বলের লব্ধির মান তাদের যেকোনো একটির মানের সমান হলে বলদ্বয়ের মধ্যবর্তী কোণ $\\alpha$ কত?`,
      answer: `Ans: $R^2 = P^2 + P^2 + 2P^2\\cos\\alpha \\implies P^2 = 2P^2(1+\\cos\\alpha) \\implies \\cos\\alpha = -\\frac{1}{2} \\implies \\alpha = 120^\\circ$`
    },
    {
      question: `একটি নদীতে স্রোতের বেগ $3\\text{ km/h}$ এবং নৌকার বেগ $6\\text{ km/h}$। সোজাসুজি অপর পাড়ে পৌঁছাতে নৌকাকে স্রোতের সাথে কত কোণে চালাতে হবে?`,
      answer: `Ans: $\\cos\\alpha = -\\frac{u}{v} = -\\frac{3}{6} = -0.5 \\implies \\alpha = 120^\\circ$`
    },
    {
      question: `$\\vec{A} = 2\\hat{i} + 3\\hat{j} - \\hat{k}$ এবং $\\vec{B} = 4\\hat{i} + m\\hat{j} + 2\\hat{k}$ ভেক্টরদ্বয় পরস্পর লম্ব হলে $m$ এর মান নির্ণয় করো।`,
      answer: `Ans: $\\vec{A} \\cdot \\vec{B} = 0 \\implies (2)(4) + (3)(m) + (-1)(2) = 0 \\implies 8 + 3m - 2 = 0 \\implies m = -2$`
    }
  ],
  3: (item, idx) => [
    {
      question: `একটি প্রক্ষেপককে $39.2\\text{ m/s}$ বেগে অনুভূমিকের সাথে $30^\\circ$ কোণে নিক্ষেপ করা হলো। এর সর্বাধিক উচ্চতা ও অনুভূমিক পাল্লা নির্ণয় করো।`,
      answer: `Ans: $H = \\frac{(39.2\\sin 30^\\circ)^2}{2 \\times 9.8} = 19.6\\text{ m}, \\quad R = \\frac{39.2^2 \\sin 60^\\circ}{9.8} = 135.79\\text{ m}$`
    },
    {
      question: `একটি বন্দুকের গুলি $3\\text{ cm}$ পুরু কাঠের তক্তা ভেদ করার পর এর বেগ অর্ধেক হারিয়ে ফেলে। তক্তাটির ভেতর আর কতদূর গিয়ে গুলিটি থেমে যাবে?`,
      answer: `Ans: $x_2 = \\frac{x_1}{3} = \\frac{3\\text{ cm}}{3} = 1\\text{ cm}$ (মোট দূরত্ব $4\\text{ cm}$)`
    },
    {
      question: `স্থিরাবস্থা থেকে সুষম ত্বরণে চলমান একটি গাড়ি $4\\text{ s}$-এ $32\\text{ m}$ দূরত্ব অতিক্রম করে। এর ত্বরণ ও $4\\text{ s}$ পর অর্জিত বেগ কত?`,
      answer: `Ans: $s = \\frac{1}{2}at^2 \\implies a = \\frac{2 \\times 32}{16} = 4\\text{ m/s}^2, \\quad v = at = 4 \\times 4 = 16\\text{ m/s}$`
    }
  ],
  4: (item, idx) => [
    {
      question: `$1000\\text{ kg}$ ভরের একটি গাড়ি $54\\text{ km/h}$ বেগে চলার সময় ব্রেক চেপে $15\\text{ m}$ দূরত্বে থামানো হলো। প্রযুক্ত বাধা দানকারী বলের মান কত?`,
      answer: `Ans: $v_0 = 15\\text{ m/s} \\implies a = \\frac{v_0^2}{2s} = \\frac{225}{30} = 7.5\\text{ m/s}^2 \\implies F = ma = 1000 \\times 7.5 = 7500\\text{ N}$`
    },
    {
      question: `$100\\text{ m}$ ব্যাসার্ধের একটি অনুভূমিক বাঁকে $50\\text{ km/h}$ বেগে গাড়ি নিরাপদভাবে মোড় নিতে ব্যাংকিং কোণ $\\theta$ কত হওয়া প্রয়োজন?`,
      answer: `Ans: $v = \\frac{50}{3.6} = 13.89\\text{ m/s} \\implies \\tan\\theta = \\frac{v^2}{rg} = \\frac{(13.89)^2}{100 \\times 9.8} = 0.1968 \\implies \\theta \\approx 11.13^\\circ$`
    },
    {
      question: `$2\\text{ kg}$ ভরের একটি সুষম গোলকের ব্যাসার্ধ $0.2\\text{ m}$ হলে এর নিজস্ব ব্যাসের সাপেক্ষে জড়তার ভ্রামক ($I$) কত?`,
      answer: `Ans: $I = \\frac{2}{5}MR^2 = \\frac{2}{5}(2)(0.2)^2 = 0.032\\text{ kg}\\cdot\\text{m}^2$`
    }
  ],
  5: (item, idx) => [
    {
      question: `$2\\text{ kg}$ ভরের একটি বস্তুকে ভূমি থেকে $20\\text{ m}$ উচ্চতায় উঠালে এর সঞ্চিত স্থিতিশক্তি কত? এবং সেখান থেকে ছেড়ে দিলে ভূমিতে আঘাত করার মুহূর্তে গতিশক্তি কত হবে?`,
      answer: `Ans: $E_p = mgh = 2 \\times 9.8 \\times 20 = 392\\text{ J}, \\quad E_k = E_p = 392\\text{ J}$`
    },
    {
      question: `একটি স্প্রিংকে $0.05\\text{ m}$ প্রসারিত করতে $20\\text{ N}$ বল প্রয়োগ করতে হয়। স্প্রিংটির স্প্রিং ধ্রুবক এবং সঞ্চিত বিভব শক্তি নির্ণয় করো।`,
      answer: `Ans: $k = \\frac{F}{x} = \\frac{20}{0.05} = 400\\text{ N/m}, \\quad U = \\frac{1}{2}kx^2 = \\frac{1}{2}(400)(0.05)^2 = 0.5\\text{ J}$`
    },
    {
      question: `একটি মোটরের ক্ষমতা $2\\text{ kW}$ এবং কর্মদক্ষতা $80\\%। এটি $10\\text{ m}$ গভীর কূপ থেকে প্রতি মিনিটে কত লিটার পানি তুলতে পারবে?`,
      answer: `Ans: $P_{\\text{out}} = 2000 \\times 0.8 = 1600\\text{ W} \\implies m = \\frac{P_{\\text{out}} \\times t}{gh} = \\frac{1600 \\times 60}{9.8 \\times 10} \\approx 979.59\\text{ kg (বা লিটার)}$`
    }
  ],
  6: (item, idx) => [
    {
      question: `পৃথিবীর ব্যাসার্ধ $R = 6400\\text{ km}$। ভূ-পৃষ্ঠ হতে কত উচ্চতায় অভিকর্ষজ ত্বরণের মান ভূ-পৃষ্ঠের মানের $\\frac{1}{4}$ অংশ হবে?`,
      answer: `Ans: $g_h = g\\left(\\frac{R}{R+h}\\right)^2 = \\frac{g}{4} \\implies \\frac{R}{R+h} = \\frac{1}{2} \\implies h = R = 6400\\text{ km}$`
    },
    {
      question: `ভূ-পৃষ্ঠে একটি সেকেন্ড দোলকের কার্যকরী দৈর্ঘ্য $0.993\\text{ m}$। চাঁদে অভিকর্ষজ ত্বরণ পৃথিবীর $\\frac{1}{6}$ গুণ হলে চাঁদে সেকেন্ড দোলকটির কার্যকরী দৈর্ঘ্য কত হতে হবে?`,
      answer: `Ans: $L' = \\frac{L}{6} = \\frac{0.993}{6} = 0.1655\\text{ m} = 16.55\\text{ cm}$`
    },
    {
      question: `পৃথিবীর ভর $6 \\times 10^{24}\\text{ kg}$ এবং ব্যাসার্ধ $6.4 \\times 10^6\\text{ m}$ হলে ভূ-পৃষ্ঠে মুক্তিবেগ ($v_e$) নির্ণয় করো।`,
      answer: `Ans: $v_e = \\sqrt{\\frac{2GM}{R}} = \\sqrt{\\frac{2 \\times 6.673 \\times 10^{-11} \\times 6 \\times 10^{24}}{6.4 \\times 10^6}} \\approx 11.18\\text{ km/s}$`
    }
  ],
  7: (item, idx) => [
    {
      question: `$2\\text{ m}$ দীর্ঘ এবং $1\\text{ mm}^2$ প্রস্থচ্ছেদের একটি তারে $10\\text{ kg}$ ভর ঝুলালে দৈর্ঘ্য বৃদ্ধি $0.5\\text{ mm}$ হয়। তারের উপাদানের ইয়ং-এর গুণাঙ্ক ($Y$) নির্ণয় করো।`,
      answer: `Ans: $Y = \\frac{FL}{Al} = \\frac{(10 \\times 9.8)(2)}{(10^{-6})(0.5 \\times 10^{-3})} = 3.92 \\times 10^{11}\\text{ N/m}^2$`
    },
    {
      question: `পানির পৃষ্ঠটান $T = 7.2 \\times 10^{-2}\\text{ N/m}$। $0.1\\text{ mm}$ ব্যাসার্ধের একটি কৈশিক কাচ নলে পানি কত উচ্চতায় আরোহণ করবে? (স্পর্শ কোণ $\\theta = 0^\\circ$)`,
      answer: `Ans: $h = \\frac{2T\\cos\\theta}{r\\rho g} = \\frac{2(7.2 \\times 10^{-2})(1)}{(10^{-4})(1000)(9.8)} \\approx 0.1469\\text{ m} = 14.69\\text{ cm}$`
    },
    {
      question: `$0.1\\text{ mm}$ ব্যাসার্ধের একটি পানির ফোঁটা ভেঙে সমান আকারের $1000$ টি ছোট ফোঁটায় পরিণত হলে কৃতকাজের পরিমাণ কত? ($T = 0.072\\text{ N/m}$)`,
      answer: `Ans: $W = 4\\pi R^2 T (n^{1/3} - 1) = 4\\pi (10^{-4})^2 (0.072)(10 - 1) \\approx 8.14 \\times 10^{-8}\\text{ J}$`
    }
  ],
  8: (item, idx) => [
    {
      question: `একটি সরল ছন্দিত স্পন্দনে গতিশীল কণার বিস্তার $A = 0.08\\text{ m}$ এবং পর্যায়কাল $T = 4\\text{ s}$। সাম্যাবস্থা হতে $0.04\\text{ m}$ দূরত্বে কণাটির বেগ ও ত্বরণ কত?`,
      answer: `Ans: $\\omega = \\frac{2\\pi}{4} = 1.57\\text{ rad/s}, \\quad v = \\omega\\sqrt{A^2-x^2} = 1.57\\sqrt{0.08^2-0.04^2} \\approx 0.1088\\text{ m/s}, \\quad a = \\omega^2 x \\approx 0.0987\\text{ m/s}^2$`
    },
    {
      question: `একটি সরল ছন্দিত স্পন্দনে কণার সর্বোচ্চ বেগ $v_{\\text{max}} = 0.2\\text{ m/s}$ এবং সর্বোচ্চ ত্বরণ $a_{\\text{max}} = 0.8\\text{ m/s}^2$ হলে এর কম্পাঙ্ক এবং বিস্তার নির্ণয় করো।`,
      answer: `Ans: $\\omega = \\frac{a_{\\text{max}}}{v_{\\text{max}}} = \\frac{0.8}{0.2} = 4\\text{ rad/s} \\implies f = \\frac{4}{2\\pi} \\approx 0.637\\text{ Hz}, \\quad A = \\frac{v_{\\text{max}}}{\\omega} = \\frac{0.2}{4} = 0.05\\text{ m}$`
    },
    {
      question: `একটি সেকেন্ড দোলক দিনে $20\\text{ s}$ ধীরগতিতে চললে এর কার্যকরী দৈর্ঘ্য কত শতাংশ কমাতে বা বাড়াতে হবে?`,
      answer: `Ans: দিনে ধীর চললে দৈর্ঘ্য কমাতে হবে। $\\frac{\\Delta L}{L} \\approx \\frac{2 \\times 20}{86400} \\times 100\\% \\approx 0.0463\\%$ কমাতে হবে।`
    }
  ],
  9: (item, idx) => [
    {
      question: `একটি অগ্রগামী তরঙ্গের সমীকরণ $y = 0.05\\sin(200\\pi t - 0.5\\pi x)$ (যেখানে সকল রাশি SI এককে)। তরঙ্গটির বিস্তার, কম্পাঙ্ক ও বেগ নির্ণয় করো।`,
      answer: `Ans: $A = 0.05\\text{ m}, \\quad \\omega = 200\\pi \\implies f = 100\\text{ Hz}, \\quad k = 0.5\\pi \\implies v = \\frac{\\omega}{k} = \\frac{200\\pi}{0.5\\pi} = 400\\text{ m/s}$`
    },
    {
      question: `একটি সুরশলাকা $A$ একটি নির্দিষ্ট তারের সাথে প্রতি সেকেন্ডে $5$ টি বীট তৈরি করে। তারের টান সামান্য বৃদ্ধি করলে বীট সংখ্যা বৃদ্ধি পায়। $A$ এর কম্পাঙ্ক $256\\text{ Hz}$ হলে তারের আদি কম্পাঙ্ক কত ছিল?`,
      answer: `Ans: টান বাড়ালে কম্পাঙ্ক বাড়ে এবং বীটও বাড়ে $\\implies f_{\\text{wire}} = 256 + 5 = 261\\text{ Hz}$`
    },
    {
      question: `শব্দের তীব্রতা লেভেল $40\\text{ dB}$ থেকে $70\\text{ dB}$-এ উন্নীত করলে শব্দের তীব্রতা কত গুণ বৃদ্ধি পায়?`,
      answer: `Ans: $\\Delta\\beta = 10\\log_{10}\\left(\\frac{I_2}{I_1}\\right) = 30\\text{ dB} \\implies \\log_{10}\\left(\\frac{I_2}{I_1}\\right) = 3 \\implies \\frac{I_2}{I_1} = 10^3 = 1000\\text{ গুণ}$`
    }
  ],
  10: (item, idx) => [
    {
      question: `$27^\\circ\\text{C}$ তাপমাত্রায় হিলিয়াম গ্যাসের মূল গড় বর্গবেগ ($c_{\\text{rms}}$) নির্ণয় করো। ($R = 8.314\\text{ J/mol}\\cdot\\text{K}, M_{\\text{He}} = 4 \\times 10^{-3}\\text{ kg/mol}$)`,
      answer: `Ans: $T = 300\\text{ K} \\implies c_{\\text{rms}} = \\sqrt{\\frac{3RT}{M}} = \\sqrt{\\frac{3 \\times 8.314 \\times 300}{4 \\times 10^{-3}}} \\approx 1369.37\\text{ m/s}$`
    },
    {
      question: `স্বাভাবিক তাপমাত্রা ও চাপে ($STP$) $32\\text{ g}$ অক্সিজেন গ্যাসের মোট গতিশক্তি কত?`,
      answer: `Ans: $n = 1\\text{ mol}, T = 273.15\\text{ K} \\implies E_k = \\frac{3}{2}nRT = 1.5 \\times 1 \\times 8.314 \\times 273.15 \\approx 3406.84\\text{ J}$`
    },
    {
      question: `কোনো স্থানে কোনো একদিনের শুষ্ক ও আর্দ্র বাল্ব থার্মোমিটারের পাঠ যথাক্রমে $30^\\circ\\text{C}$ এবং $24^\\circ\\text{C}$। গ্লেইশারের উৎপাদক $G = 1.65$ হলে ঐ দিনের শিশিরাঙ্ক কত?`,
      answer: `Ans: $\\theta = \\theta_1 - G(\\theta_1 - \\theta_2) = 30 - 1.65(30 - 24) = 30 - 9.9 = 20.1^\\circ\\text{C}$`
    }
  ]
};

// Also generate tailored formula questions based on formula's actual title and latex
function generateTailoredQuestions(formula, chapterNum, idx) {
  const t = formula.title;
  const l = formula.latex;
  const base = chapterQuestions[chapterNum] ? chapterQuestions[chapterNum](formula, idx) : [];
  
  // Custom tailored item
  const tailored = {
    question: `প্রদত্ত সূত্র **$${l}$** (${t}) ব্যবহার করে সংশ্লিষ্ট রাশিগুলোর মান উপযুক্ত এককে প্রতিস্থাপন করে বুয়েট ও বোর্ড স্ট্যান্ডার্ড গাণিতিক সমস্যাটির চূড়ান্ত মান ও একক নির্ণয় করো।`,
    answer: `Ans: সূত্র সমীকরণ: $${l}$`
  };

  return [base[idx % base.length], base[(idx + 1) % base.length], base[(idx + 2) % base.length]];
}

for (let ch = 1; ch <= 10; ch++) {
  const filePath = `${baseDir}/chapter_${ch}.json`;
  if (!fs.existsSync(filePath)) continue;

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updated = data.map((item, idx) => {
    const questions = generateTailoredQuestions(item, ch, idx);
    return {
      ...item,
      practiceQuestions: questions
    };
  });

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
  console.log(`Updated Chapter ${ch}: ${updated.length} formulas with 3 rich practice questions each.`);
}

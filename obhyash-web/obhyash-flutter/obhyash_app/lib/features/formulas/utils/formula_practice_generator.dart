import '../models/formula_models.dart';

/// Resolves multiple serial practice questions with question and answer only.
class FormulaPracticeGenerator {
  static List<FormulaPracticeQuestion> resolvePracticeQuestions(
    FormulaEntry formula, {
    String? chapterName,
    int? serialNumber,
  }) {
    if (formula.practiceQuestions.isNotEmpty) {
      return formula.practiceQuestions;
    }

    final title = formula.title.toLowerCase();

    // 1. Vernier Constant / Screw Gauge
    if (title.contains('ভার্নিয়ার ধ্রুবক') || title.contains('vernier')) {
      return const [
        FormulaPracticeQuestion(
          question:
              r'একটি স্লাইড ক্যালিপার্সে প্রধান স্কেলের ক্ষুদ্রতম এক ঘরের মান $1\text{ mm}$। ভার্নিয়ার স্কেলের $20$ ভাগ প্রধান স্কেলের $19$ ভাগের সাথে হুবহু মিলে গেলে ভার্নিয়ার ধ্রুবক ($VC$) কত?',
          answer: r'Ans: $0.05\text{ mm}$ (বা $0.005\text{ cm}$)',
        ),
        FormulaPracticeQuestion(
          question:
              r'একটি ভার্নিয়ার স্কেলের ভাগ সংখ্যা $50$ এবং প্রধান স্কেলের ১ ভাগের মান $0.5\text{ mm}$ হলে এর ভার্নিয়ার ধ্রুবক নির্ণয় করো।',
          answer: r'Ans: $0.01\text{ mm}$',
        ),
        FormulaPracticeQuestion(
          question:
              r'কোনো ধাতব গোলকের ব্যাস পরিমাপে প্রধান স্কেল পাঠ $4.2\text{ cm}$, ভার্নিয়ার সমপাতন $8$ এবং $VC = 0.005\text{ cm}$ হলে গোলকটির প্রকৃত ব্যাস কত?',
          answer: r'Ans: $4.24\text{ cm}$',
        ),
      ];
    }

    // 2. Vectors: Parallelogram & Resultant
    if (title.contains('সামান্তরিক') || (title.contains('লব্ধি') && title.contains('মান'))) {
      return const [
        FormulaPracticeQuestion(
          question:
              r'একটি বিন্দুতে ক্রিয়াশীল দুটি সমমানের বলের লব্ধির মান বলদ্বয়ের যেকোনো একটির সমান হলে তাদের অন্তর্ভুক্ত কোণ $\alpha$ কত?',
          answer: r'Ans: $\alpha = 120^\circ$',
        ),
        FormulaPracticeQuestion(
          question:
              r'$5\text{ N}$ এবং $12\text{ N}$ মানের দুটি বল পরস্পরের সাথে $90^\circ$ কোণে ক্রিয়াশীল হলে এদের লব্ধির মান ও দিক নির্ণয় করো।',
          answer: r'Ans: $R = 13\text{ N}, \quad \theta = \tan^{-1}\left(\frac{12}{5}\right) \approx 67.38^\circ$',
        ),
        FormulaPracticeQuestion(
          question:
              r'দুটি বলের সর্বোচ্চ লব্ধি $17\text{ N}$ এবং সর্বনিম্ন লব্ধি $7\text{ N}$। বল দুটি পরস্পর লম্বভাবে ক্রিয়া করলে লব্ধি বলের মান কত হবে?',
          answer: r'Ans: $R = 13\text{ N}$ (যেখানে $P = 12\text{ N}, Q = 5\text{ N}$)',
        ),
      ];
    }

    // 3. River Crossing (Shortest Path & Shortest Time)
    if (title.contains('নদী') || title.contains('স্রোত') || title.contains('river')) {
      return const [
        FormulaPracticeQuestion(
          question:
              r'$1.5\text{ km}$ প্রশস্ত একটি নদীতে স্রোতের বেগ $4\text{ km/h}$ এবং নৌকার বেগ $8\text{ km/h}$। সোজাসুজি নদী পার হতে নৌকাটিকে স্রোতের সাথে কত কোণে চালাতে হবে এবং নদী পার হতে কত সময় লাগবে?',
          answer: r'Ans: $\alpha = 120^\circ, \quad t = 13\text{ min } 0.4\text{ s} \ (0.2165\text{ hr})$',
        ),
        FormulaPracticeQuestion(
          question:
              r'$500\text{ m}$ চওড়া একটি নদীতে স্রোতের বেগ $3\text{ m/s}$ এবং নৌকার বেগ $5\text{ m/s}$। নূন্যতম কত সময়ে অপর পাড়ে পৌঁছানো সম্ভব এবং নদীর তীর বরাবর অনুভূমিক সরণ (Drift) কত হবে?',
          answer: r'Ans: $t_{\text{min}} = 100\text{ s}, \quad \text{Drift } x = 300\text{ m}$',
        ),
        FormulaPracticeQuestion(
          question:
              r'একজন সাঁতারু $60^\circ$ কোণে $6\text{ km/h}$ বেগে সাঁতার শুরু করল। স্রোতের বেগ $3\text{ km/h}$ এবং নদীর প্রস্থ $1\text{ km}$ হলে নদী পার হতে সাঁতারুর কত সময় লাগবে?',
          answer: r'Ans: $t = \frac{1}{6\sin 60^\circ} \approx 0.1925\text{ hr} \approx 11.55\text{ min}$',
        ),
      ];
    }

    // 4. Dot Product & Cross Product
    if (title.contains('ডট গুণন') || title.contains('লম্ব') || title.contains('ক্রস')) {
      return const [
        FormulaPracticeQuestion(
          question:
              r'$\vec{A} = 2\hat{i} + a\hat{j} + \hat{k}$ এবং $\vec{B} = 4\hat{i} - 2\hat{j} - 2\hat{k}$ ভেক্টরদ্বয় পরস্পর লম্ব হলে ধ্রুবক $a$ এর মান নির্ণয় করো।',
          answer: r'Ans: $a = 3$',
        ),
        FormulaPracticeQuestion(
          question:
              r'একটি সামান্তরিকের সন্নিহিত বাহু $\vec{A} = 3\hat{i} + \hat{j} - 2\hat{k}$ এবং $\vec{B} = \hat{i} - 3\hat{j} + 4\hat{k}$ হলে সামান্তরিকটির ক্ষেত্রফল কত বর্গ একক?',
          answer: r'Ans: $\text{Area} = 5\sqrt{14} \approx 18.71\text{ sq. units}$',
        ),
        FormulaPracticeQuestion(
          question:
              r'$\vec{P} = 2\hat{i} + 3\hat{j} - 4\hat{k}$ এবং $\vec{Q} = 4\hat{i} + m\hat{j} - 8\hat{k}$ ভেক্টর দুটি সমান্তরাল হওয়ার জন্য $m$ এর মান কত হতে হবে?',
          answer: r'Ans: $m = 6$',
        ),
      ];
    }

    // 5. Projectiles (প্রাস)
    if (title.contains('প্রাস') || title.contains('পাল্লা') || title.contains('projectile')) {
      return const [
        FormulaPracticeQuestion(
          question:
              r'একটি প্রাসের অনুভূমিক পাল্লা $R$ এর মান তার সর্বোচ্চ উচ্চতা $H$ এর $4\sqrt{3}$ গুণ হলে নিক্ষেপণ কোণ $\theta_0$ কত?',
          answer: r'Ans: $\theta_0 = 30^\circ$',
        ),
        FormulaPracticeQuestion(
          question:
              r'একটি বস্তুকে অনুভূমিকের সাথে $45^\circ$ কোণে $20\text{ m/s}$ আদিবেগে ছুড়ে মারা হলো। এর অনুভূমিক পাল্লা $R$ এবং বিচরণকাল $T$ নির্ণয় করো। ($g = 9.8\text{ m/s}^2$)',
          answer: r'Ans: $R = 40.82\text{ m}, \quad T = 2.89\text{ s}$',
        ),
        FormulaPracticeQuestion(
          question:
              r'$40\text{ m}$ উঁচু দালানের ছাদ থেকে $30^\circ$ কোণে $19.6\text{ m/s}$ আদিবেগে একটি বল ছোড়া হলে বলটি কত সময় পর মাটিতে পড়বে?',
          answer: r'Ans: $t = 4.0\text{ s}$',
        ),
      ];
    }

    // 6. Rocket Propulsion / Banking
    if (title.contains('রকেট') || title.contains('ব্যাংকিং')) {
      return const [
        FormulaPracticeQuestion(
          question:
              r'$100\text{ m}$ ব্যাসার্ধবিশিষ্ট একটি রেললাইনের দুই পাতের মধ্যবর্তী দূরত্ব $1\text{ m}$। $50.4\text{ km/h}$ বেগে গাড়ি বাঁক নেওয়ার জন্য বাইরের পাতটিকে ভেতরের পাতের চেয়ে কত উঁচুতে স্থাপন করতে হবে? ($g = 9.8\text{ m/s}^2$)',
          answer: r'Ans: $h = 0.2\text{ m} = 20\text{ cm}$',
        ),
        FormulaPracticeQuestion(
          question:
              r'একটি রকেট প্রতি সেকেন্ডে $40\text{ kg}$ হারে জ্বালানি পুড়িয়ে $1500\text{ m/s}$ বেগে নির্গত করে। রকেটের উপর প্রযুক্ত ধাক্কা বল (Thrust) কত?',
          answer: r'Ans: $F_{\text{thrust}} = 60,000\text{ N} = 60\text{ kN}$',
        ),
        FormulaPracticeQuestion(
          question:
              r'কোনো রাস্তার বাঁকের ব্যাসার্ধ $80\text{ m}$ এবং ব্যাংকিং কোণ $6^\circ$ হলে সর্বোচ্চ নিরাপদ গতিবেগ কত $\text{km/h}$?',
          answer: r'Ans: $v = 9.08\text{ m/s} \approx 32.68\text{ km/h}$',
        ),
      ];
    }

    // 7. Work, Energy & Power
    if (title.contains('কুয়া') || title.contains('কূপ') || title.contains('চেইন')) {
      return const [
        FormulaPracticeQuestion(
          question:
              r'$20\text{ m}$ গভীর এবং $2\text{ m}$ ব্যাসের একটি পানিপূর্ণ কুয়া একটি পাম্প দ্বারা $20\text{ মিনিটে}$ খালি করা হলে পাম্পটির কার্যকর ক্ষমতা (Output Power) অশ্বক্ষমতায় (HP) কত?',
          answer: r'Ans: $P = 5.14\text{ kW} \approx 6.89\text{ HP}$',
        ),
        FormulaPracticeQuestion(
          question:
              r'একটি বস্তুর ভরবেগ $50\%$ বৃদ্ধি করা হলে তার গতিশক্তি শতকরা কত বৃদ্ধি পাবে?',
          answer: r'Ans: ১২৫% বৃদ্ধি পাবে',
        ),
        FormulaPracticeQuestion(
          question:
              r'$100\text{ m}$ উচ্চতা থেকে একটি বস্তু মুক্তভাবে নিচে পড়তে থাকলে ভূমি হতে কত উচ্চতায় এর গতিশক্তি বিভব শক্তির দ্বিগুণ হবে?',
          answer: r"Ans: $h' = 33.33\text{ m}$",
        ),
      ];
    }

    // 8. Gravitation & Satellites
    if (title.contains('মুক্তিবেগ') || title.contains('উপগ্রহ') || title.contains('escape')) {
      return const [
        FormulaPracticeQuestion(
          question:
              r'একটি গ্রহের ভর ও ব্যাসার্ধ উভয়ই পৃথিবীর তুলনায় দ্বিগুণ হলে ঐ গ্রহপৃষ্ঠে মুক্তিবেগ কত হবে? (পৃথিবীতে $v_e = 11.2\text{ km/s}$)',
          answer: r'Ans: $v_e = 11.2\text{ km/s}$ (অপরিবর্তিত থাকবে)',
        ),
        FormulaPracticeQuestion(
          question:
              r'ভূপৃষ্ঠ হতে কত উচ্চতায় অভিকর্ষজ ত্বরণ $g$ এর মান ভূপৃষ্ঠের মানের এক-চতুর্থাংশ ($\frac{g}{4}$) হবে? ($R = 6400\text{ km}$)',
          answer: r'Ans: $h = R = 6400\text{ km}$',
        ),
        FormulaPracticeQuestion(
          question:
              r'একটি ভূ-স্থির উপগ্রহের পর্যায়কাল $24\text{ ঘণ্টা}$ হলে এটি ভূপৃষ্ঠ হতে প্রায় কত কিলোমিটার উচ্চতায় পৃথিবীকে প্রদক্ষিণ করে?',
          answer: r'Ans: $h \approx 35,800\text{ km} \approx 3.6 \times 10^4\text{ km}$',
        ),
      ];
    }

    // 9. Ideal Gas & Waves
    if (title.contains('হ্রদ') || title.contains('বুদবুদ') || title.contains('আরএমএস') || title.contains('rms')) {
      return const [
        FormulaPracticeQuestion(
          question:
              r'একটি হ্রদের তলদেশ থেকে উপরিভাগে আসায় একটি বায়ুর বুদবুদের ব্যাস দ্বিগুণ হয়। বায়ুমণ্ডলীয় চাপ $10^5\text{ Pa}$ এবং পানির ঘনত্ব $1000\text{ kg/m}^3$ হলে হ্রদের গভীরতা কত?',
          answer: r'Ans: $h = 71.43\text{ m}$ (ব্যাস দ্বিগুণ $\implies$ আয়তন ৮ গুণ, $n = 8$)',
        ),
        FormulaPracticeQuestion(
          question:
              r'$27^\circ\text{C}$ তাপমাত্রায় অক্সিজেনের অণুসমূহের মূল গড় বর্গ বেগ ($c_{\text{rms}}$) কত $\text{m/s}$? ($M = 32 \times 10^{-3}\text{ kg/mol}, R = 8.314\text{ J/mol}\cdot\text{K}$)',
          answer: r'Ans: $c_{\text{rms}} = 483.56\text{ m/s}$',
        ),
        FormulaPracticeQuestion(
          question:
              r'কোনো গ্যাসের তাপমাত্রা $0^\circ\text{C}$ থেকে কত ডিগ্রি সেলসিয়াসে উন্নীত করলে তার RMS বেগ দ্বিগুণ হবে?',
          answer: r'Ans: $819^\circ\text{C}$ (বা $1092\text{ K}$)',
        ),
      ];
    }

    // Standard Fallback
    return [
      FormulaPracticeQuestion(
        question:
            'উক্ত সূত্রের উপর ভিত্তি করে সংশ্লিষ্ট মানসমূহ প্রতিস্থাপন করে গাণিতিক সমস্যাটির চূড়ান্ত মান ও একক নির্ণয় করো।',
        answer: 'Ans: সূত্র সমীকরণ: \$\$${formula.latex}\$\$',
      ),
      FormulaPracticeQuestion(
        question:
            'উক্ত রাশির ক্ষেত্রে মানসমূহ দ্বিগুণ অথবা পরিবর্তন করা হলে চূড়ান্ত রাশিটির আনুপাতিক পরিবর্তনের মান কত হবে?',
        answer: 'Ans: আনুপাতিক সম্পর্ক: \$\$${formula.latex}\$\$',
      ),
    ];
  }
}

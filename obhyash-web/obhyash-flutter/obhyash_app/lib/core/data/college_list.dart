// Top Bangladeshi colleges with canonical names and lowercase search aliases.
// Used for autocomplete in the signup form.

const _collegeData = [
  // ── Dhaka Division ─────────────────────────────────────────────────────────
  {
    'name': 'ঢাকা কলেজ',
    'search': ['dhaka college', 'dc'],
  },
  {
    'name': 'ইডেন মহিলা কলেজ',
    'search': ['eden mohila', 'eden women', 'eden college'],
  },
  {
    'name': 'সরকারি তিতুমীর কলেজ',
    'search': ['titumir', 'titumeer', 'govt titumir'],
  },
  {
    'name': 'কবি নজরুল সরকারি কলেজ',
    'search': ['kabi nazrul', 'kabi nojrul', 'knsgc', 'nazrul college'],
  },
  {
    'name': 'মিরপুর সরকারি কলেজ',
    'search': ['mirpur govt college', 'mirpur college'],
  },
  {
    'name': 'বাংলা কলেজ, ঢাকা',
    'search': [
      'sarkari bangla college',
      'bangla college dhaka',
      'bangla college',
    ],
  },
  {
    'name': 'ঢাকা কমার্স কলেজ',
    'search': ['dhaka commerce college', 'dcc'],
  },
  {
    'name': 'নটর ডেম কলেজ',
    'search': ['notre dame', 'notredame', 'ndc', 'notre dame college'],
  },
  {
    'name': 'হলি ক্রস কলেজ',
    'search': ['holy cross', 'holycross', 'hcc', 'holy cross college'],
  },
  {
    'name': 'ভিকারুননিসা নূন স্কুল এন্ড কলেজ',
    'search': ['viqarunnisa', 'vns', 'vikharunnisa', 'vnsc', 'vicarunissa'],
  },
  {
    'name': 'রাজউক উত্তরা মডেল কলেজ',
    'search': ['rajuk uttara', 'rumc', 'rajuk', 'uttara model college'],
  },
  {
    'name': 'আদমজী ক্যান্টনমেন্ট কলেজ',
    'search': ['adamjee', 'adamjee cantonment', 'acc', 'adamji'],
  },
  {
    'name': 'ঢাকা রেসিডেনশিয়াল মডেল কলেজ',
    'search': ['drmc', 'dhaka residential model', 'dhaka residential'],
  },
  {
    'name': 'সরকারি বিজ্ঞান কলেজ, ঢাকা',
    'search': [
      'govt science college dhaka',
      'gsc dhaka',
      'government science college',
    ],
  },
  {
    'name': 'ঢাকা ইম্পেরিয়াল কলেজ',
    'search': ['dhaka imperial', 'imperial college dhaka'],
  },
  {
    'name': 'ঢাকা সিটি কলেজ',
    'search': ['city college dhaka', 'dhaka city college'],
  },
  {
    'name': 'আইডিয়াল কলেজ',
    'search': ['ideal college dhaka'],
  },
  {
    'name': 'ধানমণ্ডি সরকারি বালক উচ্চ বিদ্যালয় ও কলেজ',
    'search': ['dhanmondi govt boys college', 'dhanmondi college'],
  },
  {
    'name': 'বেগম বদরুন্নেসা সরকারি মহিলা কলেজ',
    'search': ['badrunnessa', 'badrunessa', 'begum badrunnessa'],
  },
  {
    'name': 'ঢাকা পলিটেকনিক ইনস্টিটিউট',
    'search': ['dhaka polytechnic', 'dpi'],
  },
  {
    'name': 'শহীদ সোহরাওয়ার্দী কলেজ',
    'search': ['suhrawardy', 'sorawardy college', 'shaheed suhrawardy'],
  },
  {
    'name': 'নারায়ণগঞ্জ কলেজ',
    'search': ['narayanganj college'],
  },
  {
    'name': 'নারায়ণগঞ্জ সরকারি মহিলা কলেজ',
    'search': ['narayanganj govt women', 'narayanganj mohila'],
  },
  {
    'name': 'তোলারাম কলেজ',
    'search': ['tolaram college', 'tolaraam'],
  },
  {
    'name': 'গভর্নমেন্ট মোহাম্মদপুর মডেল স্কুল অ্যান্ড কলেজ',
    'search': [
      'government mohammadpur model school and college',
      'mohammadpur model',
      'mohammadpur model school and college',
      'gmmsc',
    ],
  },
  {
    'name': 'সরকারি মুড়াপাড়া কলেজ',
    'search': [
      'murapara',
      'murapara college',
      'govt murapara college',
      'sorkari murapara college',
      'sarkari murapara',
      'সরকারি মুরাপাড়া কলেজ',
      'সরকারি মুরাপারা কলেজ',
      'মুরাপাড়া কলেজ',
      'মুরাপারা কলেজ',
      'মুড়াপাড়া কলেজ',
    ],
  },
  {
    'name': 'গাজীপুর সরকারি কলেজ',
    'search': ['gazipur govt college', 'gazipur college'],
  },
  {
    'name': 'টঙ্গী সরকারি কলেজ',
    'search': ['tongi govt college', 'tongi college'],
  },
  {
    'name': 'ফরিদপুর সরকারি কলেজ',
    'search': ['faridpur govt college', 'faridpur college'],
  },
  {
    'name': 'রাজেন্দ্র কলেজ, ফরিদপুর',
    'search': ['rajendra college', 'faridpur rajendra'],
  },
  {
    'name': 'টাঙ্গাইল সরকারি কলেজ',
    'search': ['tangail govt college', 'tangail college'],
  },
  {
    'name': 'মাওলানা মোহাম্মদ আলী কলেজ',
    'search': ['mawlana mohammad ali college', 'mma college'],
  },
  {
    'name': 'কিশোরগঞ্জ সরকারি কলেজ',
    'search': ['kishoreganj govt college', 'kishoreganj college'],
  },
  {
    'name': 'গুরুদয়াল সরকারি কলেজ',
    'search': ['gurudayal college', 'gurudayal govt college'],
  },
  {
    'name': 'মানিকগঞ্জ সরকারি কলেজ',
    'search': ['manikganj govt college', 'manikganj college'],
  },
  {
    'name': 'নরসিংদী সরকারি কলেজ',
    'search': ['narsingdi govt college', 'narsingdi college'],
  },
  {
    'name': 'রাজবাড়ী সরকারি কলেজ',
    'search': ['rajbari govt college', 'rajbari college'],
  },
  {
    'name': 'মাদারীপুর সরকারি কলেজ',
    'search': ['madaripur govt college', 'madaripur college'],
  },
  {
    'name': 'গোপালগঞ্জ সরকারি কলেজ',
    'search': ['gopalganj govt college', 'gopalganj college'],
  },
  {
    'name': 'শরীয়তপুর সরকারি কলেজ',
    'search': ['shariatpur govt college', 'shariatpur college'],
  },
  {
    'name': 'মুন্সিগঞ্জ সরকারি কলেজ',
    'search': ['munshiganj govt college', 'munshiganj college'],
  },
  // ── Chittagong Division ─────────────────────────────────────────────────────
  {
    'name': 'চট্টগ্রাম কলেজ',
    'search': ['chittagong college', 'ctg college', 'chattogram college'],
  },
  {
    'name': 'হাজী মুহাম্মদ মহসীন কলেজ',
    'search': ['hazi muhammed mohsin', 'mohsin college', 'hm mohsin'],
  },
  {
    'name': 'চট্টগ্রাম সিটি কলেজ',
    'search': ['chittagong city college', 'ctg city college'],
  },
  {
    'name': 'চট্টগ্রাম কমার্স কলেজ',
    'search': ['chittagong commerce college', 'ctg commerce'],
  },
  {
    'name': 'ক্যান্টনমেন্ট পাবলিক কলেজ, চট্টগ্রাম',
    'search': [
      'cantonment public college chittagong',
      'ccpc',
      'ctg cantonment',
    ],
  },
  {
    'name': 'চট্টগ্রাম সরকারি মহিলা কলেজ',
    'search': ['chittagong govt womens', 'ctg mohila', 'chittagong women'],
  },
  {
    'name': 'চট্টগ্রাম সরকারি কমার্স কলেজ',
    'search': ['chittagong govt commerce', 'ctg govt commerce'],
  },
  {
    'name': 'চট্টগ্রাম মেডিকেল কলেজ',
    'search': ['chittagong medical college', 'cmc'],
  },
  {
    'name': 'চট্টগ্রাম ক্যান্টনমেন্ট পাবলিক কলেজ',
    'search': ['chittagong cantonment public college'],
  },
  {
    'name': 'কক্সবাজার সরকারি কলেজ',
    'search': [
      "cox's bazar govt college",
      'coxs bazar college',
      'coxsbazar college',
    ],
  },
  {
    'name': 'কুমিল্লা ভিক্টোরিয়া সরকারি কলেজ',
    'search': [
      'comilla victoria',
      'victoria college comilla',
      'cumilla college',
    ],
  },
  {
    'name': 'কুমিল্লা সরকারি মহিলা কলেজ',
    'search': ['comilla govt women', 'cumilla mohila'],
  },
  {
    'name': 'কুমিল্লা ক্যান্টনমেন্ট কলেজ',
    'search': ['comilla cantonment college', 'cumilla cantonment'],
  },
  {
    'name': 'ফেনী সরকারি কলেজ',
    'search': ['feni govt college', 'feni college'],
  },
  {
    'name': 'নোয়াখালী সরকারি কলেজ',
    'search': ['noakhali govt college', 'noakhali college'],
  },
  {
    'name': 'লক্ষ্মীপুর সরকারি কলেজ',
    'search': ['lakshmipur govt college', 'laxmipur college'],
  },
  {
    'name': 'চাঁদপুর সরকারি কলেজ',
    'search': ['chandpur govt college', 'chandpur college'],
  },
  {
    'name': 'ব্রাহ্মণবাড়িয়া সরকারি কলেজ',
    'search': ['brahmanbaria govt college', 'brahmanbaria college'],
  },
  {
    'name': 'রাঙামাটি সরকারি কলেজ',
    'search': ['rangamati govt college', 'rangamati college'],
  },
  {
    'name': 'বান্দরবান সরকারি কলেজ',
    'search': ['bandarban govt college', 'bandarban college'],
  },
  {
    'name': 'খাগড়াছড়ি সরকারি কলেজ',
    'search': ['khagrachhari govt college', 'khagrachhari college'],
  },
  // ── Rajshahi Division ───────────────────────────────────────────────────────
  {
    'name': 'রাজশাহী কলেজ',
    'search': ['rajshahi college', 'rc', 'rajshahi govt college'],
  },
  {
    'name': 'রাজশাহী সরকারি সিটি কলেজ',
    'search': ['rajshahi city college', 'rajshahi govt city'],
  },
  {
    'name': 'রাজশাহী সরকারি মহিলা কলেজ',
    'search': ['rajshahi govt womens', 'rajshahi mohila'],
  },
  {
    'name': 'নিউ গভর্নমেন্ট ডিগ্রি কলেজ, রাজশাহী',
    'search': ['new govt degree college rajshahi', 'ngdc rajshahi'],
  },
  {
    'name': 'রাজশাহী মেডিকেল কলেজ',
    'search': ['rajshahi medical college', 'rmc'],
  },
  {
    'name': 'রাজশাহী কমার্স কলেজ',
    'search': ['rajshahi commerce college'],
  },
  {
    'name': 'চাঁপাইনবাবগঞ্জ সরকারি কলেজ',
    'search': ['chapai nawabganj govt college', 'chapainawabganj college'],
  },
  {
    'name': 'নাটোর সরকারি কলেজ',
    'search': ['natore govt college', 'natore college'],
  },
  {
    'name': 'পাবনা সরকারি এডওয়ার্ড কলেজ',
    'search': [
      'pabna edward college',
      'edward college pabna',
      'govt edward college',
    ],
  },
  {
    'name': 'পাবনা সরকারি মহিলা কলেজ',
    'search': ['pabna govt womens', 'pabna mohila'],
  },
  {
    'name': 'সিরাজগঞ্জ সরকারি কলেজ',
    'search': ['sirajganj govt college', 'sirajganj college'],
  },
  {
    'name': 'গভর্নমেন্ট আজিজুল হক কলেজ, বগুড়া',
    'search': ['azizul haque', 'bogra college', 'azizul haq', 'bogura college'],
  },
  {
    'name': 'বগুড়া সরকারি মহিলা কলেজ',
    'search': ['bogura govt womens', 'bogra mohila'],
  },
  {
    'name': 'জয়পুরহাট সরকারি কলেজ',
    'search': ['joypurhat govt college', 'joypurhat college'],
  },
  {
    'name': 'নওগাঁ সরকারি কলেজ',
    'search': ['naogaon govt college', 'naogaon college', 'nawgaon college'],
  },
  // ── Khulna Division ─────────────────────────────────────────────────────────
  {
    'name': 'সরকারি বি এল কলেজ, খুলনা',
    'search': ['bl college', 'govt bl college', 'khulna bl', 'b l college'],
  },
  {
    'name': 'খুলনা সরকারি মহিলা কলেজ',
    'search': ['khulna govt womens', 'khulna mohila'],
  },
  {
    'name': 'আজম খান সরকারি কমার্স কলেজ',
    'search': ['azam khan commerce', 'govt commerce college khulna'],
  },
  {
    'name': 'খুলনা মেডিকেল কলেজ',
    'search': ['khulna medical college', 'kmc'],
  },
  {
    'name': 'বাগেরহাট সরকারি কলেজ',
    'search': ['bagerhat govt college', 'bagerhat college'],
  },
  {
    'name': 'সাতক্ষীরা সরকারি কলেজ',
    'search': ['satkhira govt college', 'satkhira college'],
  },
  {
    'name': 'যশোর সরকারি সিটি কলেজ',
    'search': ['jessore city college', 'jessore college', 'jashore college'],
  },
  {
    'name': 'যশোর সরকারি মহিলা কলেজ',
    'search': ['jessore govt womens', 'jessore mohila'],
  },
  {
    'name': 'মাইকেল মধুসূদন কলেজ',
    'search': [
      'michael madhusudan',
      'mm college jessore',
      'madhusudan college',
    ],
  },
  {
    'name': 'নড়াইল সরকারি ভিক্টোরিয়া কলেজ',
    'search': ['narail victoria', 'narail college'],
  },
  {
    'name': 'মাগুরা সরকারি কলেজ',
    'search': ['magura govt college', 'magura college'],
  },
  {
    'name': 'ঝিনাইদহ সরকারি কলেজ',
    'search': ['jhenaidah govt college', 'jhenaidah college'],
  },
  {
    'name': 'কুষ্টিয়া সরকারি কলেজ',
    'search': ['kushtia govt college', 'kushtia college'],
  },
  {
    'name': 'চুয়াডাঙ্গা সরকারি কলেজ',
    'search': ['chuadanga govt college', 'chuadanga college'],
  },
  {
    'name': 'মেহেরপুর সরকারি কলেজ',
    'search': ['meherpur govt college', 'meherpur college'],
  },
  // ── Barisal Division ────────────────────────────────────────────────────────
  {
    'name': 'বরিশাল সরকারি কলেজ',
    'search': [
      'barisal govt college',
      'barishal govt college',
      'bm college barisal',
    ],
  },
  {
    'name': 'বরিশাল সরকারি মহিলা কলেজ',
    'search': ['barisal govt womens', 'barishal mohila'],
  },
  {
    'name': 'বরিশাল ক্যান্টনমেন্ট কলেজ',
    'search': ['barisal cantonment', 'barishal cantonment'],
  },
  {
    'name': 'বরিশাল মেডিকেল কলেজ',
    'search': ['barisal medical', 'barishal medical college'],
  },
  {
    'name': 'শের-ই-বাংলা মেডিকেল কলেজ',
    'search': ['shere bangla medical', 'sher e bangla medical', 'sbmc'],
  },
  {
    'name': 'বিএম কলেজ, বরিশাল',
    'search': ['bm college', 'b m college barisal'],
  },
  {
    'name': 'ভোলা সরকারি কলেজ',
    'search': ['bhola govt college', 'bhola college'],
  },
  {
    'name': 'পটুয়াখালী সরকারি কলেজ',
    'search': ['patuakhali govt college', 'patuakhali college'],
  },
  {
    'name': 'পিরোজপুর সরকারি কলেজ',
    'search': ['pirojpur govt college', 'pirojpur college'],
  },
  {
    'name': 'ঝালকাঠি সরকারি কলেজ',
    'search': ['jhalokathi govt college', 'jhalokati college'],
  },
  {
    'name': 'বরগুনা সরকারি কলেজ',
    'search': ['barguna govt college', 'barguna college'],
  },
  // ── Sylhet Division ─────────────────────────────────────────────────────────
  {
    'name': 'সিলেট সরকারি কলেজ',
    'search': [
      'sylhet government college',
      'sylhet sarkari',
      'govt college sylhet',
    ],
  },
  {
    'name': 'মুরারিচাঁদ কলেজ (এমসি কলেজ), সিলেট',
    'search': [
      'mc college',
      'murarichand college',
      'murari chand',
      'sylhet mc',
    ],
  },
  {
    'name': 'সিলেট সরকারি মহিলা কলেজ',
    'search': ['sylhet govt womens', 'sylhet mohila', 'sylhet womens college'],
  },
  {
    'name': 'সিলেট কমার্স কলেজ',
    'search': ['sylhet commerce college'],
  },
  {
    'name': 'সিলেট ক্যান্টনমেন্ট কলেজ',
    'search': ['sylhet cantonment college'],
  },
  {
    'name': 'সিলেট মেডিকেল কলেজ',
    'search': ['sylhet medical college', 'smc sylhet'],
  },
  {
    'name': 'এমএজি ওসমানী মেডিকেল কলেজ',
    'search': ['osmani medical college', 'mag osmani', 'mag osmani medical'],
  },
  {
    'name': 'মৌলভীবাজার সরকারি কলেজ',
    'search': ['moulvibazar govt college', 'moulvibazar college'],
  },
  {
    'name': 'হবিগঞ্জ সরকারি কলেজ',
    'search': ['habiganj govt college', 'habiganj college'],
  },
  {
    'name': 'সুনামগঞ্জ সরকারি কলেজ',
    'search': ['sunamganj govt college', 'sunamganj college'],
  },
  // ── Rangpur Division ────────────────────────────────────────────────────────
  {
    'name': 'রংপুর সরকারি কলেজ',
    'search': ['rangpur govt college', 'rangpur government college'],
  },
  {
    'name': 'কারমাইকেল কলেজ, রংপুর',
    'search': ['carmichael college', 'carmichael rangpur'],
  },
  {
    'name': 'রংপুর সরকারি মহিলা কলেজ',
    'search': ['rangpur govt womens', 'rangpur mohila'],
  },
  {
    'name': 'রংপুর মেডিকেল কলেজ',
    'search': ['rangpur medical college'],
  },
  {
    'name': 'দিনাজপুর সরকারি কলেজ',
    'search': ['dinajpur govt college', 'dinajpur government college'],
  },
  {
    'name': 'সুরেন্দ্রনাথ কলেজ, দিনাজপুর',
    'search': ['surendranath college', 'snc dinajpur'],
  },
  {
    'name': 'দিনাজপুর সরকারি মহিলা কলেজ',
    'search': ['dinajpur govt womens', 'dinajpur mohila'],
  },
  {
    'name': 'গাইবান্ধা সরকারি কলেজ',
    'search': ['gaibandha govt college', 'gaibandha college'],
  },
  {
    'name': 'কুড়িগ্রাম সরকারি কলেজ',
    'search': ['kurigram govt college', 'kurigram college'],
  },
  {
    'name': 'নীলফামারী সরকারি কলেজ',
    'search': ['nilphamari govt college', 'nilphamari college'],
  },
  {
    'name': 'লালমনিরহাট সরকারি কলেজ',
    'search': ['lalmonirhat govt college', 'lalmonirhat college'],
  },
  {
    'name': 'পঞ্চগড় সরকারি কলেজ',
    'search': ['panchagarh govt college', 'panchagarh college'],
  },
  {
    'name': 'ঠাকুরগাঁও সরকারি কলেজ',
    'search': ['thakurgaon govt college', 'thakurgaon college'],
  },
  {
    'name': 'সৈয়দপুর সরকারি কলেজ',
    'search': ['saidpur govt college', 'saidpur college'],
  },
  // ── Mymensingh Division ─────────────────────────────────────────────────────
  {
    'name': 'আনন্দমোহন কলেজ, ময়মনসিংহ',
    'search': ['ananda mohan', 'anandamohan', 'amc mymensingh'],
  },
  {
    'name': 'ময়মনসিংহ সরকারি মহিলা কলেজ',
    'search': ['mymensingh govt womens', 'mymensingh mohila'],
  },
  {
    'name': 'ময়মনসিংহ সরকারি কলেজ',
    'search': ['mymensingh govt college', 'mymensingh college'],
  },
  {
    'name': 'ময়মনসিংহ মেডিকেল কলেজ',
    'search': ['mymensingh medical college', 'mmc'],
  },
  {
    'name': 'ময়মনসিংহ ক্যান্টনমেন্ট কলেজ',
    'search': ['mymensingh cantonment'],
  },
  {
    'name': 'নেত্রকোণা সরকারি কলেজ',
    'search': ['netrokona govt college', 'netrokona college'],
  },
  {
    'name': 'শেরপুর সরকারি কলেজ',
    'search': ['sherpur govt college', 'sherpur college'],
  },
  {
    'name': 'জামালপুর সরকারি আশেক মাহমুদ কলেজ',
    'search': [
      'jamalpur ashek mahmud',
      'jamalpur college',
      'ashek mahmud college',
    ],
  },
  // ── Notable Others ──────────────────────────────────────────────────────────
  {
    'name': 'ফৌজদারহাট ক্যাডেট কলেজ',
    'search': ['faujdarhat cadet', 'fouzdarhat cadet'],
  },
  {
    'name': 'রাজশাহী ক্যাডেট কলেজ',
    'search': ['rajshahi cadet', 'rcc'],
  },
  {
    'name': 'যশোর ক্যাডেট কলেজ',
    'search': ['jhenaidah cadet', 'jessore cadet', 'jashore cadet'],
  },
  {
    'name': 'পাবনা ক্যাডেট কলেজ',
    'search': ['pabna cadet'],
  },
  {
    'name': 'কুমিল্লা ক্যাডেট কলেজ',
    'search': ['comilla cadet', 'cumilla cadet'],
  },
  {
    'name': 'ময়মনসিংহ ক্যাডেট কলেজ',
    'search': ['mymensingh cadet'],
  },
  {
    'name': 'খুলনা ক্যাডেট কলেজ',
    'search': ['khulna cadet', 'kcc'],
  },
  {
    'name': 'বরিশাল ক্যাডেট কলেজ',
    'search': ['barisal cadet', 'barishal cadet'],
  },
  {
    'name': 'সরকারি সাদত কলেজ, করটিয়া',
    'search': ['sadat college', 'karatia college', 'govt sadat college'],
  },
  {
    'name': 'স্কলাস্টিকা স্কুল এন্ড কলেজ',
    'search': ['scholastica', 'scholastika'],
  },
  {
    'name': 'সানশাইন গ্রামার স্কুল এন্ড কলেজ',
    'search': ['sunshine grammar', 'sunshine school'],
  },
  // ─── Additional colleges from district list ────────────────────────────────
  {
    'name': 'নারায়ণগঞ্জ সরকারি তিতুমীর কলেজ',
    'search': ['narayanganj govt titumir', 'titumir narayanganj'],
  },
  {
    'name': 'সোনারগাঁও সরকারি কলেজ',
    'search': ['sonargaon govt college', 'sonargaon college'],
  },
  {
    'name': 'গাজীপুর ক্যান্টনমেন্ট কলেজ',
    'search': ['gazipur cantonment college'],
  },
  {
    'name': 'বাঘা কলেজ',
    'search': ['bagha college'],
  },
  {
    'name': 'চারঘাট কলেজ',
    'search': ['charghat college'],
  },
  {
    'name': 'গোদাগাড়ী কলেজ',
    'search': ['godagari college'],
  },
  {
    'name': 'ভোলাহাট কলেজ',
    'search': ['bholahat college'],
  },
  {
    'name': 'গোমস্তাপুর কলেজ',
    'search': ['gomastapur college'],
  },
  {
    'name': 'নাচোল কলেজ',
    'search': ['nachole college'],
  },
  {
    'name': 'শিবগঞ্জ কলেজ',
    'search': ['shibganj college'],
  },
  {
    'name': 'বালাগঞ্জ কলেজ',
    'search': ['balaganj college'],
  },
  {
    'name': 'বিয়ানীবাজার কলেজ',
    'search': ['beani bazar college', 'beanibazar college'],
  },
  {
    'name': 'বিশ্বনাথ কলেজ',
    'search': ['bishwanath college'],
  },
  {
    'name': 'ফেঞ্চুগঞ্জ কলেজ',
    'search': ['fenchuganj college'],
  },
  {
    'name': 'গোলাপগঞ্জ কলেজ',
    'search': ['golapganj college'],
  },
  {
    'name': 'জকিগঞ্জ কলেজ',
    'search': ['zakiganj college'],
  },
  {
    'name': 'শ্রীমঙ্গল কলেজ',
    'search': ['sreemangal college', 'srimangal college'],
  },
  {
    'name': 'বরুড়া কলেজ',
    'search': ['barura college'],
  },
  {
    'name': 'চাঁদিনা কলেজ',
    'search': ['chandina college'],
  },
  {
    'name': 'দাউদকান্দি কলেজ',
    'search': ['daudkandi college'],
  },
  {
    'name': 'লাকসাম সরকারি কলেজ',
    'search': ['laksam govt college', 'laksam college'],
  },
  {
    'name': 'মুরাদনগর কলেজ',
    'search': ['muradnagar college'],
  },
  {
    'name': 'সোনাগাজী কলেজ',
    'search': ['sonagazi college'],
  },
  {
    'name': 'পরশুরাম কলেজ',
    'search': ['parshuram college'],
  },
  {
    'name': 'আখাউড়া কলেজ',
    'search': ['akhaura college'],
  },
  {
    'name': 'আশুগঞ্জ কলেজ',
    'search': ['ashuganj college'],
  },
  {
    'name': 'কসবা কলেজ',
    'search': ['kasba college'],
  },
  {
    'name': 'নবীনগর কলেজ',
    'search': ['nabinagar college'],
  },
  {
    'name': 'সরাইল কলেজ',
    'search': ['sarail college'],
  },
  {
    'name': 'বাগেরহাট সরকারি মহিলা কলেজ',
    'search': ['bagerhat govt womens', 'bagerhat mohila'],
  },
  {
    'name': 'চিতলমারী কলেজ',
    'search': ['chitalmari college'],
  },
  {
    'name': 'মোল্লারহাট কলেজ',
    'search': ['mollahat college'],
  },
  {
    'name': 'মোরেলগঞ্জ কলেজ',
    'search': ['morrelganj college'],
  },
  {
    'name': 'চুয়াডাঙ্গা সরকারি মহিলা কলেজ',
    'search': ['chuadanga govt womens'],
  },
  {
    'name': 'আলমডাঙ্গা কলেজ',
    'search': ['alamdanga college'],
  },
  {
    'name': 'দামুড়হুদা কলেজ',
    'search': ['damurhuda college'],
  },
  {
    'name': 'মেহেরপুর সরকারি মহিলা কলেজ',
    'search': ['meherpur govt womens'],
  },
  {
    'name': 'যশোর ক্যান্টনমেন্ট কলেজ',
    'search': ['jessore cantonment college'],
  },
  {
    'name': 'ঝিকরগাছা কলেজ',
    'search': ['jhikargachha college'],
  },
  {
    'name': 'কেশবপুর কলেজ',
    'search': ['keshabpur college'],
  },
  {
    'name': 'মনিরামপুর কলেজ',
    'search': ['manirampur college'],
  },
  {
    'name': 'বাকেরগঞ্জ কলেজ',
    'search': ['bakerganj college'],
  },
  {
    'name': 'বানারীপাড়া কলেজ',
    'search': ['banaripara college'],
  },
  {
    'name': 'গৌরনদী কলেজ',
    'search': ['gaurnadi college'],
  },
  {
    'name': 'মেহেন্দিগঞ্জ কলেজ',
    'search': ['mehendiganj college'],
  },
  {
    'name': 'বোরহানউদ্দিন কলেজ',
    'search': ['borhanuddin college'],
  },
  {
    'name': 'চরফ্যাশন কলেজ',
    'search': ['char fasson college'],
  },
  {
    'name': 'পটুয়াখালী সরকারি মহিলা কলেজ',
    'search': ['patuakhali govt womens'],
  },
  {
    'name': 'বাউফল কলেজ',
    'search': ['bauphal college'],
  },
  {
    'name': 'গলাচিপা কলেজ',
    'search': ['galachipa college'],
  },
  {
    'name': 'কলাপাড়া কলেজ',
    'search': ['kalapara college'],
  },
  {
    'name': 'পিরোজপুর সরকারি মহিলা কলেজ',
    'search': ['pirojpur govt womens'],
  },
  {
    'name': 'ভান্ডারিয়া কলেজ',
    'search': ['bhandaria college'],
  },
  {
    'name': 'মঠবাড়িয়া কলেজ',
    'search': ['mathbaria college'],
  },
  {
    'name': 'ঝালকাঠি সরকারি মহিলা কলেজ',
    'search': ['jhalokathi govt womens'],
  },
  {
    'name': 'বরগুনা সরকারি মহিলা কলেজ',
    'search': ['barguna govt womens'],
  },
  {
    'name': 'আমতলী কলেজ',
    'search': ['amtali college'],
  },
  {
    'name': 'রংপুর ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ',
    'search': ['rangpur cantonment public college', 'rcpsc'],
  },
  {
    'name': 'বদরগঞ্জ কলেজ',
    'search': ['badarganj college'],
  },
  {
    'name': 'গঙ্গাচড়া কলেজ',
    'search': ['gangachhara college'],
  },
  {
    'name': 'মিঠাপুকুর কলেজ',
    'search': ['mithapukur college'],
  },
  {
    'name': 'পীরগঞ্জ কলেজ',
    'search': ['pirganj college rangpur'],
  },
  {
    'name': 'গোবিন্দগঞ্জ কলেজ',
    'search': ['gobindaganj college'],
  },
  {
    'name': 'পলাশবাড়ী কলেজ',
    'search': ['palashbari college'],
  },
  {
    'name': 'সাদুল্লাপুর কলেজ',
    'search': ['sadullapur college'],
  },
  {
    'name': 'সুন্দরগঞ্জ কলেজ',
    'search': ['sundarganj college'],
  },
  {
    'name': 'ভুরুঙ্গামারী কলেজ',
    'search': ['bhurungamari college'],
  },
  {
    'name': 'নাগেশ্বরী কলেজ',
    'search': ['nageshwari college'],
  },
  {
    'name': 'উলিপুর কলেজ',
    'search': ['ulipur college'],
  },
  {
    'name': 'দিমলা কলেজ',
    'search': ['dimla college'],
  },
  {
    'name': 'ডোমার কলেজ',
    'search': ['domar college'],
  },
  {
    'name': 'আদিতমারী কলেজ',
    'search': ['aditmari college'],
  },
  {
    'name': 'হাতীবান্ধা কলেজ',
    'search': ['hatibandha college'],
  },
  {
    'name': 'পাটগ্রাম কলেজ',
    'search': ['patgram college'],
  },
  {
    'name': 'আটোয়ারী কলেজ',
    'search': ['atwari college'],
  },
  {
    'name': 'বোদা কলেজ',
    'search': ['boda college'],
  },
  {
    'name': 'তেঁতুলিয়া কলেজ',
    'search': ['tetulia college'],
  },
  {
    'name': 'ঠাকুরগাঁও সরকারি মহিলা কলেজ',
    'search': ['thakurgaon govt womens'],
  },
  {
    'name': 'বালিয়াডাঙ্গী কলেজ',
    'search': ['baliadangi college'],
  },
  {
    'name': 'রাণীশংকৈল কলেজ',
    'search': ['ranisankail college'],
  },
  {
    'name': 'ভালুকা কলেজ',
    'search': ['bhaluka college'],
  },
  {
    'name': 'ফুলবাড়িয়া কলেজ',
    'search': ['fulbaria college'],
  },
  {
    'name': 'গফরগাঁও কলেজ',
    'search': ['gaffargaon college'],
  },
  {
    'name': 'হালুয়াঘাট কলেজ',
    'search': ['haluaghat college'],
  },
  {
    'name': 'মুক্তাগাছা কলেজ',
    'search': ['muktagacha college', 'muktagachha college'],
  },
  {
    'name': 'ফুলপুর কলেজ',
    'search': ['phulpur college'],
  },
  {
    'name': 'ত্রিশাল কলেজ',
    'search': ['trishal college'],
  },
  {
    'name': 'নেত্রকোণা সরকারি মহিলা কলেজ',
    'search': ['netrokona govt womens'],
  },
  {
    'name': 'কলমাকান্দা কলেজ',
    'search': ['kalmakanda college'],
  },
  {
    'name': 'কেন্দুয়া কলেজ',
    'search': ['kendua college'],
  },
  {
    'name': 'মোহনগঞ্জ কলেজ',
    'search': ['mohanganj college'],
  },
  {
    'name': 'শেরপুর সরকারি মহিলা কলেজ',
    'search': ['sherpur govt womens'],
  },
  {
    'name': 'ঝেনাইগাতী কলেজ',
    'search': ['jhenaigati college'],
  },
  {
    'name': 'নালিতাবাড়ী কলেজ',
    'search': ['nalitabari college'],
  },
  {
    'name': 'নকলা কলেজ',
    'search': ['nakla college'],
  },
  {
    'name': 'শ্রীবরদী কলেজ',
    'search': ['sreebardi college'],
  },
  {
    'name': 'জামালপুর সরকারি মহিলা কলেজ',
    'search': ['jamalpur govt womens'],
  },
  {
    'name': 'বকশীগঞ্জ কলেজ',
    'search': ['bakshiganj college'],
  },
  {
    'name': 'দেওয়ানগঞ্জ কলেজ',
    'search': ['dewanganj college'],
  },
  {
    'name': 'ইসলামপুর কলেজ',
    'search': ['islampur college jamalpur'],
  },
  {
    'name': 'মেলান্দহ কলেজ',
    'search': ['melandaha college'],
  },
  {
    'name': 'সরিষাবাড়ী কলেজ',
    'search': ['sarishabari college'],
  },

  // ─── Top Bangladeshi High Schools (SSC) ───────────────────────────────────
  // Dhaka & Nearby
  {
    'name': 'আইডিয়াল স্কুল অ্যান্ড কলেজ, মতিঝিল',
    'search': ['ideal school motijheel', 'ideal school', 'ideal motijheel', 'isc'],
  },
  {
    'name': 'মতিঝিল সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['motijheel govt boys high school', 'motijheel govt boys', 'mgbhs'],
  },
  {
    'name': 'মতিঝিল সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['motijheel govt girls high school', 'motijheel govt girls', 'mgghs'],
  },
  {
    'name': 'মতিঝিল মডেল স্কুল অ্যান্ড কলেজ',
    'search': ['motijheel model school', 'motijheel model', 'mmsc'],
  },
  {
    'name': 'গভর্নমেন্ট ল্যাবরেটরি হাই স্কুল, ঢাকা',
    'search': ['govt laboratory high school', 'government laboratory', 'gov lab', 'glhs', 'lab school'],
  },
  {
    'name': 'ধানমন্ডি সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['dhanmondi govt boys high school', 'dhanmondi govt boys', 'dgbhs'],
  },
  {
    'name': 'ধানমন্ডি সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['dhanmondi govt girls high school', 'dhanmondi govt girls', 'dgghs'],
  },
  {
    'name': 'ঢাকা কলেজিয়েট স্কুল',
    'search': ['collegiate school dhaka', 'dhaka collegiate school', 'collegiate school'],
  },
  {
    'name': 'আরমানিটোলা সরকারি উচ্চ বিদ্যালয়',
    'search': ['armanitola govt high school', 'armanitola school', 'aghs'],
  },
  {
    'name': 'সেন্ট গ্রেগরিজ হাই স্কুল অ্যান্ড কলেজ',
    'search': ['st gregory high school', 'saint gregory', 'gregory school', 'sghsc'],
  },
  {
    'name': 'সেন্ট জোসেফ উচ্চ মাধ্যমিক বিদ্যালয়',
    'search': ['st joseph higher secondary', 'saint joseph school', 'st joseph', 'sjhs'],
  },
  {
    'name': 'সেন্ট ফ্রান্সিস জেভিয়ার্স গ্রিন হেরাল্ড ইন্টারন্যাশনাল স্কুল',
    'search': ['green herald', 'st francis xavier', 'greenherald'],
  },
  {
    'name': 'বি এ এফ শাহীন কলেজ ঢাকা (স্কুল শাখা)',
    'search': ['baf shaheen school dhaka', 'shaheen school dhaka', 'shaheen school'],
  },
  {
    'name': 'বি এ এফ শাহীন কলেজ কুর্মিটোলা (স্কুল শাখা)',
    'search': ['baf shaheen kurmitola school', 'shaheen kurmitola'],
  },
  {
    'name': 'মিরপুর সরকারি উচ্চ বিদ্যালয়',
    'search': ['mirpur govt high school', 'mirpur govt school', 'mghs'],
  },
  {
    'name': 'মিরপুর বাংলা উচ্চ বিদ্যালয়',
    'search': ['mirpur bangla school', 'bangla high school mirpur'],
  },
  {
    'name': 'মিরপুর ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ',
    'search': ['mirpur cantonment public school', 'mcpsc'],
  },
  {
    'name': 'উত্তরা হাই স্কুল অ্যান্ড কলেজ',
    'search': ['uttara high school', 'uhsc'],
  },
  {
    'name': 'মাইলস্টোন স্কুল অ্যান্ড কলেজ',
    'search': ['milestone school', 'milestone college', 'msc'],
  },
  {
    'name': 'মনোয়ার হোসেন খান উচ্চ বিদ্যালয়',
    'search': ['monowar hossain khan school'],
  },
  {
    'name': 'মোহাম্মদপুর সরকারি উচ্চ বিদ্যালয়',
    'search': ['mohammadpur govt high school', 'mohammadpur govt school', 'mghs dhaka'],
  },
  {
    'name': 'মোহাম্মদপুর প্রিপারেটরি স্কুল অ্যান্ড কলেজ',
    'search': ['mohammadpur preparatory school', 'preparatory school', 'mpsc'],
  },
  {
    'name': 'তেজগাঁও সরকারি উচ্চ বিদ্যালয়',
    'search': ['tejgaon govt high school', 'tejgaon govt boys'],
  },
  {
    'name': 'তেজগাঁও সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['tejgaon govt girls high school', 'tejgaon girls school'],
  },
  {
    'name': 'খিলগাঁও সরকারি উচ্চ বিদ্যালয়',
    'search': ['khilgaon govt high school', 'khilgaon govt school'],
  },
  {
    'name': 'নওয়াবপুর সরকারি উচ্চ বিদ্যালয়',
    'search': ['nawabpur govt high school', 'nawabpur school'],
  },
  {
    'name': 'মুসলিম সরকারি উচ্চ বিদ্যালয়, ঢাকা',
    'search': ['muslim govt high school dhaka', 'muslim high school'],
  },
  {
    'name': 'আজিমপুর সরকারি গার্লস স্কুল অ্যান্ড কলেজ',
    'search': ['azimpur govt girls school', 'azimpur girls school'],
  },
  {
    'name': 'অগ্রণী স্কুল অ্যান্ড কলেজ',
    'search': ['agroni school and college', 'agrani school'],
  },
  {
    'name': 'বি এন কলেজ ঢাকা (স্কুল শাখা)',
    'search': ['navy school dhaka', 'bn college school dhaka'],
  },
  {
    'name': 'নারায়ণগঞ্জ সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['narayanganj govt girls high school', 'narayanganj girls school'],
  },
  {
    'name': 'নারায়ণগঞ্জ হাই স্কুল অ্যান্ড কলেজ',
    'search': ['narayanganj high school', 'nhs'],
  },
  {
    'name': 'সোনারগাঁও জি আর ইনস্টিটিউশন',
    'search': ['sonargaon gr institution', 'sonargaon school', 'sonargaon gr school'],
  },
  {
    'name': 'সোনারগাঁও পাইলট বালিকা উচ্চ বিদ্যালয়',
    'search': ['sonargaon pilot girls high school', 'sonargaon girls school'],
  },
  {
    'name': 'কাঁচপুর ওমর আলী উচ্চ বিদ্যালয়',
    'search': ['kanchpur omar ali high school', 'omar ali school'],
  },
  {
    'name': 'মোগরাপাড়া এইচ জি জি এস স্মৃতি বিদ্যায়তন',
    'search': ['mograpara hggs school', 'mograpara school'],
  },
  {
    'name': 'জয়গোবিন্দ উচ্চ বিদ্যালয়, নারায়ণগঞ্জ',
    'search': ['joygovinda high school', 'joygobindo high school'],
  },
  {
    'name': 'মর্গ্যান গার্লস স্কুল অ্যান্ড কলেজ, নারায়ণগঞ্জ',
    'search': ['morgan girls school', 'morgon girls school'],
  },
  {
    'name': 'গাজীপুর সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['gazipur govt boys high school', 'gazipur boys school'],
  },
  {
    'name': 'রানী বিলাসমণি সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['rani bilashmoni govt boys high school', 'rani bilashmoni school'],
  },
  {
    'name': 'জয়দেবপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['joydebpur govt girls high school', 'joydebpur girls school'],
  },
  {
    'name': 'টঙ্গী পাইলট স্কুল অ্যান্ড গার্লস কলেজ',
    'search': ['tongi pilot school', 'tongi pilot'],
  },
  {
    'name': 'সাভার অধরচন্দ্র সরকারি উচ্চ বিদ্যালয়',
    'search': ['savar adhar chandra govt high school', 'adhar chandra school', 'savar adhar chandra'],
  },
  {
    'name': 'সাভার সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['savar govt girls high school', 'savar girls school'],
  },
  {
    'name': 'ধামরাই সরকারি এম এম উচ্চ বিদ্যালয়',
    'search': ['dhamrai govt mm high school', 'dhamrai mm school'],
  },
  {
    'name': 'মানিকগঞ্জ সরকারি উচ্চ বিদ্যালয়',
    'search': ['manikganj govt high school', 'manikganj boys school'],
  },
  {
    'name': 'মুন্সীগঞ্জ সরকারি হরগঙ্গা কলেজিয়েট স্কুল',
    'search': ['munshiganj collegiate school', 'munshiganj school'],
  },
  {
    'name': 'নরসিংদী সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['narsingdi govt girls high school', 'narsingdi girls school'],
  },
  {
    'name': 'নরসিংদী সরকারি ব্রজেন্দ্র কুমার উচ্চ বিদ্যালয়',
    'search': ['narsingdi govt bk high school', 'bk high school narsingdi'],
  },
  {
    'name': 'কিশোরগঞ্জ সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['kishoreganj govt boys high school', 'kishoreganj boys school'],
  },
  {
    'name': 'টাঙ্গাইল বিন্দুবাসিনী সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['bindubasini govt boys high school', 'bindubasini boys school', 'bindubasini tangail'],
  },
  {
    'name': 'টাঙ্গাইল বিন্দুবাসিনী সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['bindubasini govt girls high school', 'bindubasini girls school'],
  },
  {
    'name': 'ফরিদপুর জিলা স্কুল',
    'search': ['faridpur zilla school', 'faridpur zila school'],
  },
  {
    'name': 'গোপালগঞ্জ এস এম মডেল সরকারি উচ্চ বিদ্যালয়',
    'search': ['gopalganj sm model govt high school', 'sm model gopalganj'],
  },

  // Chittagong Division Schools
  {
    'name': 'চট্টগ্রাম কলেজিয়েট স্কুল',
    'search': ['chittagong collegiate school', 'ctg collegiate school', 'cchs'],
  },
  {
    'name': 'চট্টগ্রাম সরকারি উচ্চ বিদ্যালয়',
    'search': ['chittagong govt high school', 'ctg govt high school', 'cghs'],
  },
  {
    'name': 'চট্টগ্রাম সরকারি মুসলিম হাই স্কুল',
    'search': ['govt muslim high school chittagong', 'muslim high school ctg', 'gmhs'],
  },
  {
    'name': 'ডা. খাস্তগীর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['dr khastagir govt girls high school', 'khastagir school ctg', 'dr khastagir'],
  },
  {
    'name': 'নাসিরাবাদ সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['nasirabad govt boys high school', 'nasirabad school', 'ngbhs'],
  },
  {
    'name': 'চট্টগ্রাম ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ',
    'search': ['chittagong cantonment public school', 'ccpsc school'],
  },
  {
    'name': 'সেন্ট প্লাসিডস স্কুল অ্যান্ড কলেজ',
    'search': ['st placids school', 'saint placids ctg'],
  },
  {
    'name': 'কক্সবাজার সরকারি উচ্চ বিদ্যালয়',
    'search': ['coxs bazar govt high school', 'coxsbazar boys school'],
  },
  {
    'name': 'কুমিল্লা জিলা স্কুল',
    'search': ['comilla zilla school', 'cumilla zilla school', 'czs'],
  },
  {
    'name': 'নওয়াব ফয়জুন্নেসা সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['nawab faizunnesa govt girls high school', 'faizunnesa school comilla'],
  },
  {
    'name': 'কুমিল্লা শিক্ষাবোর্ড সরকারি মডেল কলেজ (স্কুল শাখা)',
    'search': ['comilla board school', 'cumilla board school'],
  },
  {
    'name': 'নোয়াখালী জিলা স্কুল',
    'search': ['noakhali zilla school', 'noakhali zila school', 'nzs'],
  },
  {
    'name': 'ফেনী সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['feni govt pilot high school', 'feni pilot school'],
  },
  {
    'name': 'ব্রাহ্মণবাড়িয়া অন্নদা সরকারি উচ্চ বিদ্যালয়',
    'search': ['annada govt high school', 'annada school brahmanbaria'],
  },
  {
    'name': 'চাঁদপুর হাসান আলী সরকারি উচ্চ বিদ্যালয়',
    'search': ['hasan ali govt high school', 'hasan ali school chandpur'],
  },

  // Rajshahi Division Schools
  {
    'name': 'রাজশাহী কলেজিয়েট স্কুল',
    'search': ['rajshahi collegiate school', 'rcs rajshahi'],
  },
  {
    'name': 'রাজশাহী সরকারি প্রমথনাথ (পি এন) বালিকা উচ্চ বিদ্যালয়',
    'search': ['pn govt girls high school', 'pn girls school rajshahi'],
  },
  {
    'name': 'রাজশাহী গভ. ল্যাবরেটরি হাই স্কুল',
    'search': ['govt laboratory high school rajshahi', 'lab school rajshahi'],
  },
  {
    'name': 'রাজশাহী শিরোইল সরকারি উচ্চ বিদ্যালয়',
    'search': ['shiroil govt high school', 'shiroil school'],
  },
  {
    'name': 'বগুড়া জিলা স্কুল',
    'search': ['bogra zilla school', 'bogura zilla school', 'bzs'],
  },
  {
    'name': 'বগুড়া সরকারি বালিকা উচ্চ বিদ্যালয় (ভিএম)',
    'search': ['bogra govt girls high school', 'vm school bogra'],
  },
  {
    'name': 'বগুড়া পুলিশ লাইন্স স্কুল অ্যান্ড কলেজ',
    'search': ['police lines school bogra', 'police lines bogura'],
  },
  {
    'name': 'পাবনা জিলা স্কুল',
    'search': ['pabna zilla school', 'pabna zila school', 'pzs'],
  },
  {
    'name': 'সিরাজগঞ্জ সরকারি বি এল উচ্চ বিদ্যালয়',
    'search': ['sirajganj govt bl high school', 'bl high school sirajganj'],
  },
  {
    'name': 'নওগাঁ কে ডি সরকারি উচ্চ বিদ্যালয়',
    'search': ['kd govt high school naogaon', 'kd school naogaon'],
  },

  // Khulna Division Schools
  {
    'name': 'খুলনা জিলা স্কুল',
    'search': ['khulna zilla school', 'khulna zila school', 'kzs'],
  },
  {
    'name': 'করনেশন সরকারি মাধ্যমিক বালিকা বিদ্যালয়, খুলনা',
    'search': ['coronation govt girls school khulna', 'coronation girls school'],
  },
  {
    'name': 'খুলনা গভ. ল্যাবরেটরি হাই স্কুল',
    'search': ['govt laboratory high school khulna', 'lab school khulna'],
  },
  {
    'name': 'যশোর জিলা স্কুল',
    'search': ['jessore zilla school', 'jashore zilla school', 'jzs'],
  },
  {
    'name': 'যশোর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['jessore govt girls high school', 'jashore girls school'],
  },
  {
    'name': 'কুষ্টিয়া জিলা স্কুল',
    'search': ['kushtia zilla school', 'kushtia zila school'],
  },
  {
    'name': 'ঝিনাইদহ সরকারি উচ্চ বিদ্যালয়',
    'search': ['jhenaidah govt high school', 'jhenaidah boys school'],
  },
  {
    'name': 'সাতক্ষীরা সরকারি উচ্চ বিদ্যালয়',
    'search': ['satkhira govt high school', 'satkhira boys school'],
  },

  // Barisal Division Schools
  {
    'name': 'বরিশাল জিলা স্কুল',
    'search': ['barisal zilla school', 'barishal zilla school', 'bzs barisal'],
  },
  {
    'name': 'বরিশাল সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['barisal govt girls high school', 'barishal girls school'],
  },
  {
    'name': 'পটুয়াখালী সরকারি জুবিলী উচ্চ বিদ্যালয়',
    'search': ['patuakhali govt jubilee high school', 'jubilee school patuakhali'],
  },
  {
    'name': 'পিরোজপুর সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['pirojpur govt boys high school', 'pirojpur school'],
  },

  // Sylhet Division Schools
  {
    'name': 'সিলেট সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['sylhet govt pilot high school', 'sylhet pilot school', 'pilot school sylhet'],
  },
  {
    'name': 'সিলেট সরকারি অগ্রগামী বালিকা উচ্চ বিদ্যালয়',
    'search': ['agragami govt girls high school', 'agragami school sylhet'],
  },
  {
    'name': 'জালালাবাদ ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ',
    'search': ['jalalabad cantonment public school', 'jcpsc school'],
  },
  {
    'name': 'মৌলভীবাজার সরকারি উচ্চ বিদ্যালয়',
    'search': ['moulvibazar govt high school', 'moulvibazar school'],
  },
  {
    'name': 'হবিগঞ্জ সরকারি উচ্চ বিদ্যালয়',
    'search': ['habiganj govt high school', 'habiganj school'],
  },
  {
    'name': 'সুনামগঞ্জ সরকারি জুবিলী উচ্চ বিদ্যালয়',
    'search': ['sunamganj govt jubilee high school', 'jubilee school sunamganj'],
  },

  // Rangpur Division Schools
  {
    'name': 'রংপুর জিলা স্কুল',
    'search': ['rangpur zilla school', 'rangpur zila school', 'rzs'],
  },
  {
    'name': 'রংপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['rangpur govt girls high school', 'rangpur girls school'],
  },
  {
    'name': 'দিনাজপুর জিলা স্কুল',
    'search': ['dinajpur zilla school', 'dinajpur zila school', 'dzs'],
  },
  {
    'name': 'দিনাজপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['dinajpur govt girls high school', 'dinajpur girls school'],
  },
  {
    'name': 'গাইবান্ধা সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['gaibandha govt boys high school', 'gaibandha boys school'],
  },
  {
    'name': 'কুড়িগ্রাম সরকারি উচ্চ বিদ্যালয়',
    'search': ['kurigram govt high school', 'kurigram school'],
  },
  {
    'name': 'নীলফামারী সরকারি উচ্চ বিদ্যালয়',
    'search': ['nilphamari govt high school', 'nilphamari school'],
  },

  // Mymensingh Division Schools
  {
    'name': 'ময়মনসিংহ জিলা স্কুল',
    'search': ['mymensingh zilla school', 'mymensingh zila school', 'mzs'],
  },
  {
    'name': 'বিদ্যাময়ী সরকারি বালিকা উচ্চ বিদ্যালয়, ময়মনসিংহ',
    'search': ['bidyamoyee govt girls high school', 'bidyamoyee school mymensingh', 'vidyamoyee'],
  },
  {
    'name': 'ময়মনসিংহ ল্যাবরেটরি হাই স্কুল',
    'search': ['mymensingh laboratory high school', 'lab school mymensingh'],
  },
  {
    'name': 'জামালপুর জিলা স্কুল',
    'search': ['jamalpur zilla school', 'jamalpur zila school', 'jzs jamalpur'],
  },
  {
    'name': 'নেত্রকোণা আঞ্জুমান সরকারি উচ্চ বিদ্যালয়',
    'search': ['anjuman govt high school', 'anjuman school netrokona'],
  },
  {
    'name': 'শেরপুর সরকারি ভিক্টোরিয়া একাডেমি',
    'search': ['sherpur govt victoria academy', 'victoria academy sherpur'],
  },

  // ─── Cadet Colleges, Madrasahs, Cantonment & Upazila Pilot Schools (Expanded 64 Districts) ───
  {
    'name': 'মির্জাপুর ক্যাডেট কলেজ',
    'search': ['mirzapur cadet college', 'mcc'],
  },
  {
    'name': 'ঝিনাইদহ ক্যাডেট কলেজ',
    'search': ['jhenaidah cadet college', 'jcc'],
  },
  {
    'name': 'সিলেট ক্যাডেট কলেজ',
    'search': ['sylhet cadet college', 'scc'],
  },
  {
    'name': 'রংপুর ক্যাডেট কলেজ',
    'search': ['rangpur cadet college', 'ccr'],
  },
  {
    'name': 'ময়মনসিংহ গার্লস ক্যাডেট কলেজ',
    'search': ['mymensingh girls cadet college', 'mgcc'],
  },
  {
    'name': 'ফেনী গার্লস ক্যাডেট কলেজ',
    'search': ['feni girls cadet college', 'fgcc'],
  },
  {
    'name': 'জয়পুরহাট গার্লস ক্যাডেট কলেজ',
    'search': ['joypurhat girls cadet college', 'jgcc'],
  },
  {
    'name': 'তামীরুল মিল্লাত কামিল মাদ্রাসা (মেইন ক্যাম্পাস, যাত্রাবাড়ী)',
    'search': ['tamirul millat kamil madrasah jatrabari', 'tamirul millat main', 'tmkmd', 'tamirul millat dhaka'],
  },
  {
    'name': 'তামীরুল মিল্লাত কামিল মাদ্রাসা (টঙ্গী ক্যাম্পাস)',
    'search': ['tamirul millat tongi', 'tamirul millat kamil madrasah tongi', 'millat tongi'],
  },
  {
    'name': 'তামীরুল মিল্লাত মহিলা কামিল মাদ্রাসা',
    'search': ['tamirul millat mohila madrasah', 'tamirul millat girls'],
  },
  {
    'name': 'দারুন্নাজাত সিদ্দিকিয়া কামিল মাদ্রাসা',
    'search': ['darunnajat siddikia kamil madrasah', 'darunnajat madrasah', 'darunnajath', 'demra madrasah'],
  },
  {
    'name': 'সরকারি মাদ্রাসা-ই-আলিয়া, ঢাকা',
    'search': ['govt madrasah e alia dhaka', 'dhaka alia madrasah', 'alia madrasah dhaka'],
  },
  {
    'name': 'জামেয়া আহমদিয়া সুন্নিয়া আলিয়া মাদ্রাসা, চট্টগ্রাম',
    'search': ['jamea ahmadia sunnia alia madrasah', 'jamea ahmadia ctg', 'ahmadia sunnia ctg'],
  },
  {
    'name': 'বায়তুশ শরফ আদর্শ কামিল মাদ্রাসা, চট্টগ্রাম',
    'search': ['baitush sharaf ideal kamil madrasah', 'baitush sharaf ctg', 'baitush sharaf'],
  },
  {
    'name': 'ছারছীনা দারুসসুন্নাত কামিল মাদ্রাসা',
    'search': ['sarsina darussunnat kamil madrasah', 'sarsina madrasah', 'sarsina pirojpur'],
  },
  {
    'name': 'সিলেট সরকারি আলিয়া মাদ্রাসা',
    'search': ['sylhet govt alia madrasah', 'sylhet alia madrasah'],
  },
  {
    'name': 'ঝালকাঠি এন এস কামিল মাদ্রাসা',
    'search': ['jhalakathi ns kamil madrasah', 'nesarabad madrasah', 'jhalakathi madrasah'],
  },
  {
    'name': 'পাবনা ইসলামিয়া কামিল মাদ্রাসা',
    'search': ['pabna islamia kamil madrasah', 'pabna islamia madrasah'],
  },
  {
    'name': 'বগুড়া জামিল মাদ্রাসা',
    'search': ['bogra jamil madrasah', 'jamil madrasah bogura'],
  },
  {
    'name': 'চরমোনাই আহসানিয়া কামিল মাদ্রাসা',
    'search': ['charmonai ahsania kamil madrasah', 'charmonai madrasah'],
  },
  {
    'name': 'কাদেরিয়া তৈয়্যেবিয়া আলিয়া কামিল মাদ্রাসা, মোহাম্মদপুর',
    'search': ['quaderia taiyyebia alia madrasah', 'quaderia madrasah'],
  },
  {
    'name': 'সোনাগাজী ইসলামিয়া ফাজিল মাদ্রাসা',
    'search': ['sonagazi islamia fazil madrasah'],
  },
  {
    'name': 'রাজবাড়ী কামিল মাদ্রাসা',
    'search': ['rajbari kamil madrasah'],
  },
  {
    'name': 'কুষ্টিয়া বড় কামিল মাদ্রাসা',
    'search': ['kushtia kamil madrasah'],
  },
  {
    'name': 'নোয়াখালী কারামতিয়া কামিল মাদ্রাসা',
    'search': ['noakhali karamatia kamil madrasah'],
  },
  {
    'name': 'রায়পুর আলিয়া কামিল মাদ্রাসা, লক্ষ্মীপুর',
    'search': ['raipur alia kamil madrasah', 'raipur madrasah'],
  },
  {
    'name': 'ফটিকছড়ি জামেউল উলুম কামিল মাদ্রাসা',
    'search': ['fatickchhari jameul ulum kamil madrasah'],
  },
  {
    'name': 'ওয়াজেদিয়া কামিল মাদ্রাসা, চট্টগ্রাম',
    'search': ['wajedia kamil madrasah ctg'],
  },
  {
    'name': 'গাউছিয়া ফাজিল মাদ্রাসা',
    'search': ['gausia fazil madrasah'],
  },
  {
    'name': 'আল-মারকাজুল ইসলামী মাদ্রাসা',
    'search': ['al markazul islami'],
  },
  {
    'name': 'হবিগঞ্জ দারুচ্ছুন্নাত কামিল মাদ্রাসা',
    'search': ['habiganj darussunnat kamil madrasah'],
  },
  {
    'name': 'কুমিল্লা ইসলামিয়া আলিয়া কামিল মাদ্রাসা',
    'search': ['comilla islamia alia kamil madrasah', 'cumilla alia madrasah'],
  },
  {
    'name': 'রংপুর কারামতিয়া কামিল মাদ্রাসা',
    'search': ['rangpur karamatia kamil madrasah'],
  },
  {
    'name': 'দিনাজপুর জিলা আলিয়া মাদ্রাসা',
    'search': ['dinajpur zilla alia madrasah'],
  },
  {
    'name': 'খুলনা আলিয়া কামিল মাদ্রাসা',
    'search': ['khulna alia kamil madrasah'],
  },
  {
    'name': 'বরিশাল মাহমুদীয়া আলিয়া কামিল মাদ্রাসা',
    'search': ['barisal mahmudia alia madrasah'],
  },
  {
    'name': 'ময়মনসিংহ আলিয়া মাদ্রাসা',
    'search': ['mymensingh alia madrasah'],
  },
  {
    'name': 'শহীদ রমিজ উদ্দিন ক্যান্টনমেন্ট কলেজ',
    'search': ['shaheed ramiz uddin cantonment college', 'ramiz uddin college'],
  },
  {
    'name': 'ঢাকা ক্যান্টনমেন্ট গার্লস পাবলিক স্কুল অ্যান্ড কলেজ',
    'search': ['dhaka cantonment girls public school and college', 'dcgpsc'],
  },
  {
    'name': 'বর্ডার গার্ড পাবলিক স্কুল অ্যান্ড কলেজ, পিলখানা',
    'search': ['border guard public school and college', 'bgpsc', 'pilkhana school'],
  },
  {
    'name': 'ঘাটাইল ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ',
    'search': ['ghatail cantonment public school and college', 'gcpsc'],
  },
  {
    'name': 'জাহানাবাদ ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ, খুলনা',
    'search': ['jahanabad cantonment public school and college', 'jcpsc khulna'],
  },
  {
    'name': 'কাদিরাবাদ ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ, নাটোর',
    'search': ['qadirabad cantonment public school and college', 'qcpsc'],
  },
  {
    'name': 'জালালাবাদ ক্যান্টনমেন্ট বোর্ড হাই স্কুল, সিলেট',
    'search': ['jalalabad cantonment board high school'],
  },
  {
    'name': 'বীর উত্তম শহীদ সামাদ স্কুল অ্যান্ড কলেজ, ময়মনসিংহ ক্যান্টনমেন্ট',
    'search': ['shaheed samad cantonment school', 'samad cantonment mymensingh'],
  },
  {
    'name': 'বাংলাদেশ নৌবাহিনী স্কুল ও কলেজ চট্টগ্রাম',
    'search': ['bangladesh navy school and college chittagong', 'bn college ctg', 'navy school ctg'],
  },
  {
    'name': 'বাংলাদেশ নৌবাহিনী স্কুল ও কলেজ খুলনা',
    'search': ['bangladesh navy school and college khulna', 'bn college khulna', 'navy school khulna'],
  },
  {
    'name': 'বাংলাদেশ নৌবাহিনী স্কুল ও কলেজ কাপ্তাই',
    'search': ['bangladesh navy school and college kaptai', 'navy school kaptai'],
  },
  {
    'name': 'বি এ এফ শাহীন কলেজ যশোর',
    'search': ['baf shaheen college jessore', 'shaheen college jessore'],
  },
  {
    'name': 'বি এ এফ শাহীন কলেজ চট্টগ্রাম',
    'search': ['baf shaheen college chittagong', 'shaheen college ctg'],
  },
  {
    'name': 'বি এ এফ শাহীন কলেজ পাহাড়কাঞ্চনপুর',
    'search': ['baf shaheen paharkanchanpur', 'shaheen paharkanchanpur'],
  },
  {
    'name': 'বি এ এফ শাহীন কলেজ শমশেরনগর',
    'search': ['baf shaheen shamshernagar', 'shaheen shamshernagar'],
  },
  {
    'name': 'বি এ এফ শাহীন কলেজ বগুড়া',
    'search': ['baf shaheen bogra', 'shaheen college bogura'],
  },
  {
    'name': 'বান্দরবান ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ',
    'search': ['bandarban cantonment public school and college', 'bbcpsc'],
  },
  {
    'name': 'খাগড়াছড়ি ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ',
    'search': ['khagrachhari cantonment public school and college', 'kcpsc'],
  },
  {
    'name': 'রামু ক্যান্টনমেন্ট ইংলিশ স্কুল অ্যান্ড কলেজ, কক্সবাজার',
    'search': ['ramu cantonment english school and college', 'ramu cantonment'],
  },
  {
    'name': 'পার্বতীপুর ক্যান্টনমেন্ট পাবলিক স্কুল অ্যান্ড কলেজ',
    'search': ['parbatipur cantonment public school and college', 'busms parbatipur'],
  },
  {
    'name': 'রাজেন্দ্রপুর ক্যান্টনমেন্ট পাবলিক স্কুল ও কলেজ',
    'search': ['rajendrapur cantonment public school and college', 'rcpsc gazipur'],
  },
  {
    'name': 'মানিকগঞ্জ সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['manikganj govt girls high school', 'manikganj girls school'],
  },
  {
    'name': 'কিশোরগঞ্জ সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['kishoreganj govt girls high school', 'kishoreganj girls school'],
  },
  {
    'name': 'কিশোরগঞ্জ আজিম উদ্দিন উচ্চ বিদ্যালয়',
    'search': ['azim uddin high school kishoreganj'],
  },
  {
    'name': 'রাজবাড়ী সরকারি উচ্চ বিদ্যালয়',
    'search': ['rajbari govt high school', 'rajbari boys school'],
  },
  {
    'name': 'রাজবাড়ী সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['rajbari govt girls high school', 'rajbari girls school'],
  },
  {
    'name': 'মাদারীপুর সরকারি ইউনাইটেড ইসলামিয়া উচ্চ বিদ্যালয়',
    'search': ['madaripur govt united islamia high school', 'united islamia madaripur'],
  },
  {
    'name': 'মাদারীপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['madaripur govt girls high school', 'madaripur girls school'],
  },
  {
    'name': 'শরীয়তপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['shariatpur govt girls high school', 'shariatpur girls school'],
  },
  {
    'name': 'পালং তুলাসার গুরুদাস সরকারি উচ্চ বিদ্যালয়, শরীয়তপুর',
    'search': ['tulasar gurudas govt high school', 'palong tulasar high school'],
  },
  {
    'name': 'গোপালগঞ্জ সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['gopalganj govt girls high school', 'gopalganj girls school'],
  },
  {
    'name': 'ফরিদপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['faridpur govt girls high school', 'faridpur girls school'],
  },
  {
    'name': 'চাঁদপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['chandpur govt girls high school', 'chandpur girls school'],
  },
  {
    'name': 'চাঁদপুর মাতৃপীঠ সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['matripith govt girls high school chandpur'],
  },
  {
    'name': 'ব্রাহ্মণবাড়িয়া সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['brahmanbaria govt girls high school', 'brahmanbaria girls school'],
  },
  {
    'name': 'নোয়াখালী সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['noakhali govt girls high school', 'noakhali girls school'],
  },
  {
    'name': 'লক্ষ্মীপুর আদর্শ সামাদ সরকারি উচ্চ বিদ্যালয়',
    'search': ['lakshmipur adarsha samad govt high school', 'samad school lakshmipur'],
  },
  {
    'name': 'লক্ষ্মীপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['lakshmipur govt girls high school', 'lakshmipur girls school'],
  },
  {
    'name': 'ফেনী সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['feni govt girls high school', 'feni girls school'],
  },
  {
    'name': 'কক্সবাজার সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['coxs bazar govt girls high school', 'coxsbazar girls school'],
  },
  {
    'name': 'রাঙ্গামাটি সরকারি উচ্চ বিদ্যালয়',
    'search': ['rangamati govt high school', 'rangamati boys school'],
  },
  {
    'name': 'রাঙ্গামাটি সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['rangamati govt girls high school', 'rangamati girls school'],
  },
  {
    'name': 'বান্দরবান সরকারি উচ্চ বিদ্যালয়',
    'search': ['bandarban govt high school', 'bandarban boys school'],
  },
  {
    'name': 'বান্দরবান সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['bandarban govt girls high school', 'bandarban girls school'],
  },
  {
    'name': 'খাগড়াছড়ি সরকারি উচ্চ বিদ্যালয়',
    'search': ['khagrachhari govt high school', 'khagrachhari boys school'],
  },
  {
    'name': 'খাগড়াছড়ি সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['khagrachhari govt girls high school', 'khagrachhari girls school'],
  },
  {
    'name': 'চাঁপাইনবাবগঞ্জ হরিমোহন সরকারি উচ্চ বিদ্যালয়',
    'search': ['harimohan govt high school chapainawabganj', 'harimohan school'],
  },
  {
    'name': 'চাঁপাইনবাবগঞ্জ সরকারি নবাবগঞ্জ বালিকা উচ্চ বিদ্যালয়',
    'search': ['nawabganj govt girls high school chapai', 'chapai girls school'],
  },
  {
    'name': 'নওগাঁ সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['naogaon govt girls high school', 'naogaon girls school'],
  },
  {
    'name': 'নাটোর সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['natore govt boys high school', 'natore boys school'],
  },
  {
    'name': 'নাটোর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['natore govt girls high school', 'natore girls school'],
  },
  {
    'name': 'জয়পুরহাট সরকারি রামদেও বাজলা উচ্চ বিদ্যালয়',
    'search': ['joypurhat govt rbd high school', 'ramdeo bajla joypurhat'],
  },
  {
    'name': 'জয়পুরহাট সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['joypurhat govt girls high school', 'joypurhat girls school'],
  },
  {
    'name': 'সিরাজগঞ্জ সরকারি সালেহা ইসহাক বালিকা উচ্চ বিদ্যালয়',
    'search': ['saleha ishaq govt girls high school sirajganj', 'saleha ishaq school'],
  },
  {
    'name': 'পাবনা সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['pabna govt girls high school', 'pabna girls school'],
  },
  {
    'name': 'মাগুরা সরকারি উচ্চ বিদ্যালয়',
    'search': ['magura govt high school', 'magura boys school'],
  },
  {
    'name': 'মাগুরা সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['magura govt girls high school', 'magura girls school'],
  },
  {
    'name': 'নড়াইল সরকারি ভিক্টোরিয়া কলেজিয়েট উচ্চ বিদ্যালয়',
    'search': ['narail govt victoria collegiate high school', 'victoria school narail'],
  },
  {
    'name': 'নড়াইল সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['narail govt girls high school', 'narail girls school'],
  },
  {
    'name': 'মেহেরপুর সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['meherpur govt boys high school', 'meherpur boys school'],
  },
  {
    'name': 'মেহেরপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['meherpur govt girls high school', 'meherpur girls school'],
  },
  {
    'name': 'চুয়াডাঙ্গা সরকারি ভি. জে. উচ্চ বিদ্যালয়',
    'search': ['chuadanga govt vj high school', 'vj high school chuadanga'],
  },
  {
    'name': 'চুয়াডাঙ্গা সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['chuadanga govt girls high school', 'chuadanga girls school'],
  },
  {
    'name': 'ঝিনাইদহ সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['jhenaidah govt girls high school', 'jhenaidah girls school'],
  },
  {
    'name': 'কুষ্টিয়া সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['kushtia govt girls high school', 'kushtia girls school'],
  },
  {
    'name': 'সাতক্ষীরা সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['satkhira govt girls high school', 'satkhira girls school'],
  },
  {
    'name': 'বাগেরহাট বহুমুখী সরকারি উচ্চ বিদ্যালয়',
    'search': ['bagerhat govt high school', 'bagerhat boys school'],
  },
  {
    'name': 'বাগেরহাট সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['bagerhat govt girls high school', 'bagerhat girls school'],
  },
  {
    'name': 'বরগুনা সরকারি জিলা স্কুল',
    'search': ['barguna zilla school', 'barguna zila school'],
  },
  {
    'name': 'বরগুনা সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['barguna govt girls high school', 'barguna girls school'],
  },
  {
    'name': 'ভোলা সরকারি উচ্চ বিদ্যালয়',
    'search': ['bhola govt high school', 'bhola boys school'],
  },
  {
    'name': 'ভোলা সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['bhola govt girls high school', 'bhola girls school'],
  },
  {
    'name': 'পিরোজপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['pirojpur govt girls high school', 'pirojpur girls school'],
  },
  {
    'name': 'ঝালকাঠি সরকারি উচ্চ বিদ্যালয়',
    'search': ['jhalakathi govt high school', 'jhalakathi boys school'],
  },
  {
    'name': 'ঝালকাঠি সরকারি হরচন্দ্র বালিকা উচ্চ বিদ্যালয়',
    'search': ['jhalakathi govt horochandra girls high school', 'horochandra girls school'],
  },
  {
    'name': 'পটুয়াখালী সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['patuakhali govt girls high school', 'patuakhali girls school'],
  },
  {
    'name': 'মৌলভীবাজার সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['moulvibazar govt girls high school', 'moulvibazar girls school'],
  },
  {
    'name': 'হবিগঞ্জ সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['habiganj govt girls high school', 'habiganj girls school'],
  },
  {
    'name': 'সুনামগঞ্জ সরকারি সতীশচন্দ্র বালিকা উচ্চ বিদ্যালয়',
    'search': ['sunamganj govt sc girls high school', 'satish chandra girls sunamganj'],
  },
  {
    'name': 'বিয়ানীবাজার সরকারি উচ্চ বিদ্যালয়',
    'search': ['beanibazar govt high school', 'beanibazar school'],
  },
  {
    'name': 'গোলাপগঞ্জ ভাদেশ্বর হাফিজিয়া উচ্চ বিদ্যালয়',
    'search': ['bhadeshwar high school golapganj'],
  },
  {
    'name': 'চুনারুঘাট ডিসিপি হাই স্কুল',
    'search': ['chunarughat dcp high school'],
  },
  {
    'name': 'শ্রীমঙ্গল ভিক্টোরিয়া উচ্চ বিদ্যালয়',
    'search': ['sreemangal victoria high school'],
  },
  {
    'name': 'কুড়িগ্রাম সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['kurigram govt girls high school', 'kurigram girls school'],
  },
  {
    'name': 'লালমনিরহাট সরকারি উচ্চ বিদ্যালয়',
    'search': ['lalmonirhat govt high school', 'lalmonirhat boys school'],
  },
  {
    'name': 'লালমনিরহাট সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['lalmonirhat govt girls high school', 'lalmonirhat girls school'],
  },
  {
    'name': 'নীলফামারী সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['nilphamari govt girls high school', 'nilphamari girls school'],
  },
  {
    'name': 'ঠাকুরগাঁও সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['thakurgaon govt boys high school', 'thakurgaon boys school'],
  },
  {
    'name': 'ঠাকুরগাঁও সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['thakurgaon govt girls high school', 'thakurgaon girls school'],
  },
  {
    'name': 'পঞ্চগড় বিষ্ণু প্রসাদ (বি.পি) সরকারি উচ্চ বিদ্যালয়',
    'search': ['panchagarh bp govt high school', 'bp high school panchagarh'],
  },
  {
    'name': 'পঞ্চগড় সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['panchagarh govt girls high school', 'panchagarh girls school'],
  },
  {
    'name': 'গাইবান্ধা সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['gaibandha govt girls high school', 'gaibandha girls school'],
  },
  {
    'name': 'জামালপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['jamalpur govt girls high school', 'jamalpur girls school'],
  },
  {
    'name': 'শেরপুর সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['sherpur govt girls high school', 'sherpur girls school'],
  },
  {
    'name': 'নেত্রকোণা সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['netrokona govt girls high school', 'netrokona girls school'],
  },
  {
    'name': 'মুক্তাগাছা রামকিশোর সরকারি উচ্চ বিদ্যালয়',
    'search': ['ramkishore govt high school muktagacha', 'rk school muktagacha'],
  },
  {
    'name': 'মুক্তাগাছা নগেন্দ্র নারায়ণ বালিকা উচ্চ বিদ্যালয়',
    'search': ['nagendra narayan girls high school muktagacha'],
  },
  {
    'name': 'নান্দাইল রোড উচ্চ বিদ্যালয়',
    'search': ['nandail road high school'],
  },
  {
    'name': 'গফরগাঁও ইসলামিয়া সরকারি হাই স্কুল',
    'search': ['gafargaon islamia govt high school'],
  },
  {
    'name': 'গৌরীপুর রাজেন্দ্র কিশোর সরকারি উচ্চ বিদ্যালয়',
    'search': ['gauripur rk govt high school'],
  },
  {
    'name': 'কাপাসিয়া পাইলট উচ্চ বিদ্যালয়',
    'search': ['kapasia pilot high school', 'kapasia school'],
  },
  {
    'name': 'কালীগঞ্জ আর আর এন পাইলট সরকারি উচ্চ বিদ্যালয়',
    'search': ['kaliganj rrn pilot high school', 'kaliganj pilot gazipur'],
  },
  {
    'name': 'শ্রীপুর পাইলট উচ্চ বিদ্যালয়',
    'search': ['sreepur pilot high school', 'sripur pilot gazipur'],
  },
  {
    'name': 'ফুলবাড়িয়া পাইলট উচ্চ বিদ্যালয়',
    'search': ['fulbaria pilot high school mymensingh'],
  },
  {
    'name': 'ভালুকা পাইলট উচ্চ বিদ্যালয়',
    'search': ['bhaluka pilot high school'],
  },
  {
    'name': 'ত্রিশাল নজরুল একাডেমি',
    'search': ['trishal nazrul academy', 'nazrul academy trishal'],
  },
  {
    'name': 'ঈশ্বরগঞ্জ বিশ্বেশ্বরী পাইলট উচ্চ বিদ্যালয়',
    'search': ['ishwarganj bisweswari pilot high school'],
  },
  {
    'name': 'বাজিতপুর রাজকুমার সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['bajitpur rajkumar high school'],
  },
  {
    'name': 'ভৈরব কে বি পাইলট মডেল হাই স্কুল',
    'search': ['bhairab kb pilot model high school', 'bhairab kb school'],
  },
  {
    'name': 'কুলিয়ারচর সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['kuliarchar govt pilot high school'],
  },
  {
    'name': 'মির্জাপুর এস কে পাইলট উচ্চ বিদ্যালয়',
    'search': ['mirzapur sk pilot high school tangail'],
  },
  {
    'name': 'সখিপুর পি এম পাইলট মডেল গভ: স্কুল',
    'search': ['sakhipur pm pilot high school'],
  },
  {
    'name': 'মধুপুর রানী ভবানী মডেল উচ্চ বিদ্যালয়',
    'search': ['madhupur rani bhabani high school'],
  },
  {
    'name': 'ঘাটাইল গণ পাইলট উচ্চ বিদ্যালয়',
    'search': ['ghatail gono pilot high school'],
  },
  {
    'name': 'শিবপুর পাইলট উচ্চ বিদ্যালয়',
    'search': ['shibpur pilot high school narsingdi'],
  },
  {
    'name': 'রায়পুরা আর কে আর এম উচ্চ বিদ্যালয়',
    'search': ['raipura rkrm high school'],
  },
  {
    'name': 'মনোহরদী পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['monohardi pilot high school'],
  },
  {
    'name': 'আড়াইহাজার পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['araihazar pilot model high school narayanganj'],
  },
  {
    'name': 'রূপগঞ্জ পাইলট উচ্চ বিদ্যালয়',
    'search': ['rupganj pilot high school'],
  },
  {
    'name': 'বন্দর বি এম ইউনিয়ন মডেল উচ্চ বিদ্যালয়',
    'search': ['bandar bm union high school narayanganj'],
  },
  {
    'name': 'শ্রীনগর সরকারি পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['sreenagar govt pilot model high school munshiganj'],
  },
  {
    'name': 'সিরাজদিখান উচ্চ বিদ্যালয়',
    'search': ['sirajdikhan high school munshiganj'],
  },
  {
    'name': 'লৌহজং পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['louhajang pilot high school'],
  },
  {
    'name': 'শিবচর নন্দকুমার মডেল ইনস্টিটিউশন',
    'search': ['shivchar nanda kumar model institution madaripur'],
  },
  {
    'name': 'রাজৈর গোপালগঞ্জ কে জে এস পাইলট উচ্চ বিদ্যালয়',
    'search': ['rajoir kjs pilot high school madaripur'],
  },
  {
    'name': 'ডামুড্যা মুসলিম উচ্চ বিদ্যালয়',
    'search': ['damudya muslim high school shariatpur'],
  },
  {
    'name': 'নড়িয়া বিহারীলাল পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['naria biharilal pilot high school'],
  },
  {
    'name': 'বোয়ালমারী জর্জ একাডেমি',
    'search': ['boalmari george academy faridpur'],
  },
  {
    'name': 'মধুখালী পাইলট উচ্চ বিদ্যালয়',
    'search': ['modhukhali pilot high school faridpur'],
  },
  {
    'name': 'ভাঙ্গা মডেল পাইলট উচ্চ বিদ্যালয়',
    'search': ['bhanga model pilot high school faridpur'],
  },
  {
    'name': 'কাশিয়ানী জি সি পাইলট উচ্চ বিদ্যালয়',
    'search': ['kashiani gc pilot high school gopalganj'],
  },
  {
    'name': 'কোটালীপাড়া এস এন ইনস্টিটিউশন',
    'search': ['kotalipara sn institution gopalganj'],
  },
  {
    'name': 'পাংশা জর্জ সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['pangsha george govt pilot high school rajbari'],
  },
  {
    'name': 'বালিয়াকান্দি পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['baliakandi pilot high school rajbari'],
  },
  {
    'name': 'মিরসরাই সরকারি মডেল পাইলট উচ্চ বিদ্যালয়',
    'search': ['mirsharai govt model pilot high school ctg'],
  },
  {
    'name': 'সীতাকুণ্ড সরকারি আদর্শ উচ্চ বিদ্যালয়',
    'search': ['sitakunda govt adarsha high school ctg'],
  },
  {
    'name': 'রাঙ্গুনিয়া আদর্শ বহুমুখী উচ্চ বিদ্যালয়',
    'search': ['rangunia adarsha high school ctg'],
  },
  {
    'name': 'পটিয়া সরকারি আদর্শ উচ্চ বিদ্যালয়',
    'search': ['patia govt adarsha high school ctg'],
  },
  {
    'name': 'আনোয়ারা সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['anwara govt model high school ctg'],
  },
  {
    'name': 'বাঁশখালী সরকারি আলাওল কলেজ (স্কুল ও কলেজ)',
    'search': ['banshhali alaol college ctg'],
  },
  {
    'name': 'লোহাগাড়া মোস্তফা বেগম গার্লস হাই স্কুল',
    'search': ['lohagara mostafa begum girls high school'],
  },
  {
    'name': 'সন্দ্বীপ সরকারি কার্গিল উচ্চ বিদ্যালয়',
    'search': ['sandwip govt cargil high school'],
  },
  {
    'name': 'রাউজান আর আর এ সি সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['raozan rrac govt model high school'],
  },
  {
    'name': 'চৌদ্দগ্রাম এইচ জে সরকারি মডেল পাইলট উচ্চ বিদ্যালয়',
    'search': ['chauddagram hj govt model pilot high school comilla'],
  },
  {
    'name': 'চান্দিনা ডা. ফিরোজা পাইলট উচ্চ বিদ্যালয়',
    'search': ['chandina dr firoza pilot high school comilla'],
  },
  {
    'name': 'বুড়িচং আনন্দ পাইলট সরকারি উচ্চ বিদ্যালয়',
    'search': ['burichang ananda pilot govt high school'],
  },
  {
    'name': 'দেবীদ্বার রেয়াজ উদ্দিন পাইলট মডেল সরকারি উচ্চ বিদ্যালয়',
    'search': ['debidwar reyaz uddin pilot model high school'],
  },
  {
    'name': 'হোমনা সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['homna govt girls high school comilla'],
  },
  {
    'name': 'মুরাদনগর ডি আর সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['muradnagar dr govt pilot high school'],
  },
  {
    'name': 'লাকসাম পাইলট উচ্চ বিদ্যালয়',
    'search': ['laksam pilot high school comilla'],
  },
  {
    'name': 'বেগমগঞ্জ সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['begumganj govt pilot high school noakhali'],
  },
  {
    'name': 'চাটখিল পি জি সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['chatkhil pg govt model high school noakhali'],
  },
  {
    'name': 'সোনাইমুড়ী মডেল উচ্চ বিদ্যালয়',
    'search': ['sonaimuri model high school noakhali'],
  },
  {
    'name': 'সেনবাগ সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['senbagh govt girls high school noakhali'],
  },
  {
    'name': 'রায়পুর সরকারি মার্চেন্টস একাডেমি',
    'search': ['raipur govt merchants academy lakshmipur'],
  },
  {
    'name': 'গোলাপগঞ্জ সরকারি এম সি একাডেমি মডেল স্কুল অ্যান্ড কলেজ',
    'search': ['golapganj govt mc academy sylhet'],
  },
  {
    'name': 'জকিগঞ্জ সরকারি উচ্চ বিদ্যালয়',
    'search': ['zakiganj govt high school sylhet'],
  },
  {
    'name': 'কানাইঘাট সরকারি উচ্চ বিদ্যালয়',
    'search': ['kanaighat govt high school sylhet'],
  },
  {
    'name': 'বালাগঞ্জ সরকারি ডি এন উচ্চ বিদ্যালয়',
    'search': ['balaganj govt dn high school sylhet'],
  },
  {
    'name': 'বিশ্বনাথ রামসুন্দর সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['biswanath ramsundar govt model high school'],
  },
  {
    'name': 'ছাতক বহুমুখী মডেল হাই স্কুল',
    'search': ['chhatak model high school sunamganj'],
  },
  {
    'name': 'জগন্নাথপুর সরকারি স্বরূপচন্দ্র পাইলট উচ্চ বিদ্যালয়',
    'search': ['jagannathpur govt swarupchandra pilot high school'],
  },
  {
    'name': 'দিরাই সরকারি উচ্চ বিদ্যালয়',
    'search': ['derai govt high school sunamganj'],
  },
  {
    'name': 'কুলাউড়া নবীনচন্দ্র সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['kulaura nabinchandra govt model high school moulvibazar'],
  },
  {
    'name': 'জুড়ী মডেল উচ্চ বিদ্যালয়',
    'search': ['juri model high school moulvibazar'],
  },
  {
    'name': 'কমলগঞ্জ সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['kamalganj govt model high school moulvibazar'],
  },
  {
    'name': 'নবীগঞ্জ সরকারি জে কে উচ্চ বিদ্যালয়',
    'search': ['nabiganj govt jk high school habiganj'],
  },
  {
    'name': 'মাধবপুর পাইলট উচ্চ বিদ্যালয়',
    'search': ['madhabpur pilot high school habiganj'],
  },
  {
    'name': 'বাহুবল সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['bahubal govt model high school habiganj'],
  },
  {
    'name': 'চারঘাট পাইলট উচ্চ বিদ্যালয়',
    'search': ['charghat pilot high school rajshahi'],
  },
  {
    'name': 'পুঠিয়া পি এন সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['puthia pn govt model high school rajshahi'],
  },
  {
    'name': 'বাগমারা ভবানীগঞ্জ সরকারি উচ্চ বিদ্যালয়',
    'search': ['bagmara bhabaniganj govt high school rajshahi'],
  },
  {
    'name': 'তানোর পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['tanore pilot model high school rajshahi'],
  },
  {
    'name': 'গোদাগাড়ী সরকারি স্কুল অ্যান্ড কলেজ',
    'search': ['godagari govt school and college rajshahi'],
  },
  {
    'name': 'শেরপুর ডি জে হাই স্কুল (বগুড়া)',
    'search': ['sherpur dj high school bogra'],
  },
  {
    'name': 'শিবগঞ্জ সরকারি পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['shibganj govt pilot model high school bogra'],
  },
  {
    'name': 'দুপচাঁচিয়া পাইলট উচ্চ বিদ্যালয়',
    'search': ['dupchanchia pilot high school bogra'],
  },
  {
    'name': 'সাঁথিয়া পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['santhia pilot model high school pabna'],
  },
  {
    'name': 'বেড়া বিপিন বিহারী উচ্চ বিদ্যালয়',
    'search': ['bera bipin bihari high school pabna'],
  },
  {
    'name': 'সুজানগর পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['sujanagar pilot model high school pabna'],
  },
  {
    'name': 'ঈশ্বরদী এস এম মডেল সরকারি উচ্চ বিদ্যালয়',
    'search': ['ishwardi sm model govt high school pabna'],
  },
  {
    'name': 'পাইকগাছা সরকারি উচ্চ বিদ্যালয়',
    'search': ['paikgachha govt high school khulna'],
  },
  {
    'name': 'কয়রা মদিনাবাদ সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['koyra madinabad govt model high school khulna'],
  },
  {
    'name': 'অভয়নগর নওয়াপাড়া শংকরপাশা মডেল সরকারি উচ্চ বিদ্যালয়',
    'search': ['nawapara shankarapasha model high school jessore'],
  },
  {
    'name': 'বাঘারপাড়া পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['bagharpada pilot model high school jessore'],
  },
  {
    'name': 'চৌগাছা ছারা পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['chaugachha pilot model high school jessore'],
  },
  {
    'name': 'শার্শা পাইলট মডেল হাই স্কুল',
    'search': ['sharsha pilot model high school jessore'],
  },
  {
    'name': 'বেনাপোল মরিয়ম মেমোরিয়াল বালিকা উচ্চ বিদ্যালয়',
    'search': ['benapole mariam memorial girls high school'],
  },
  {
    'name': 'কেশবপুর পাইলট উচ্চ বিদ্যালয়',
    'search': ['keshabpur pilot high school jessore'],
  },
  {
    'name': 'মনিরামপুর সরকারি উচ্চ বিদ্যালয়',
    'search': ['manirampur govt high school jessore'],
  },
  {
    'name': 'বাবুগঞ্জ সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['babuganj govt pilot high school barisal'],
  },
  {
    'name': 'উজিরপুর ডব্লিউ বি ইউনিয়ন মডেল ইনস্টিটিউশন',
    'search': ['wazirpur wb union model institution barisal'],
  },
  {
    'name': 'মুলাদী সরকারি মাহমুদ জান মডেল উচ্চ বিদ্যালয়',
    'search': ['muladi govt mahmud jan model high school barisal'],
  },
  {
    'name': 'আগৈলঝাড়া ভেগাই হালদার পাবলিক একাডেমি',
    'search': ['agailjhara bhegai haldar public academy barisal'],
  },
  {
    'name': 'বানারীপাড়া মডেল ইউনিয়ন ইনস্টিটিউশন',
    'search': ['banaripara model union institution barisal'],
  },
  {
    'name': 'গলাচিপা সরকারি মডেল মাধ্যমিক বিদ্যালয়',
    'search': ['galachipa govt model secondary school patuakhali'],
  },
  {
    'name': 'বাউফল সরকারি মডেল মাধ্যমিক বিদ্যালয়',
    'search': ['bauphal govt model secondary school patuakhali'],
  },
  {
    'name': 'কলাপাড়া খেপুপাড়া সরকারি মডেল মাধ্যমিক বিদ্যালয়',
    'search': ['kalapara khepupara govt model school patuakhali'],
  },
  {
    'name': 'পাথরঘাটা কে এম সরকারি মডেল মাধ্যমিক বিদ্যালয়',
    'search': ['patharghata km govt model school barguna'],
  },
  {
    'name': 'আমতলী সরকারি এ কে হাই স্কুল',
    'search': ['amtali govt ak high school barguna'],
  },
  {
    'name': 'বেতাগী সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['betagi govt pilot high school barguna'],
  },
  {
    'name': 'লালমোহন সরকারি মডেল মাধ্যমিক বিদ্যালয়',
    'search': ['lalmohan govt model secondary school bhola'],
  },
  {
    'name': 'চরফ্যাশন সরকারি টি বি স্কুল অ্যান্ড কলেজ',
    'search': ['char fasson govt tb school and college bhola'],
  },
  {
    'name': 'বোরহানউদ্দিন সরকারি উচ্চ বিদ্যালয়',
    'search': ['borhanuddin govt high school bhola'],
  },
  {
    'name': 'মিঠাপুকুর মডেল উচ্চ বিদ্যালয়',
    'search': ['mithapukur model high school rangpur'],
  },
  {
    'name': 'পীরগঞ্জ সরকারি উচ্চ বিদ্যালয়',
    'search': ['pirganj govt high school rangpur'],
  },
  {
    'name': 'কাউনিয়া মোফাজ্জল হোসেন সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['kaunia mofazzal hossain model high school rangpur'],
  },
  {
    'name': 'গঙ্গাচড়া সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['gangachara govt model high school rangpur'],
  },
  {
    'name': 'বীরগঞ্জ সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['birganj govt pilot high school dinajpur'],
  },
  {
    'name': 'বিরামপুর সরকারি পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['birampur govt pilot model high school dinajpur'],
  },
  {
    'name': 'ফুলবাড়ী জি এম পাইলট উচ্চ বিদ্যালয়',
    'search': ['fulbari gm pilot high school dinajpur'],
  },
  {
    'name': 'বোচাগঞ্জ সেতাবগঞ্জ সরকারি পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['bochaganj setabganj govt pilot school dinajpur'],
  },
  {
    'name': 'চিরিরবন্দর পাইলট উচ্চ বিদ্যালয়',
    'search': ['chirirbandar pilot high school dinajpur'],
  },
  {
    'name': 'মিরপুর কলেজ',
    'search': ['mirpur college dhaka'],
  },
  {
    'name': 'তেজগাঁও কলেজ',
    'search': ['tejgaon college dhaka'],
  },
  {
    'name': 'লালমাটিয়া মহিলা কলেজ',
    'search': ['lalmatia mohila college', 'lalmatia womens college'],
  },
  {
    'name': 'হাবিবুল্লাহ বাহার কলেজ',
    'search': ['habibullah bahar college shantinagar'],
  },
  {
    'name': 'শেখ বোরহানুদ্দীন পোস্ট গ্র্যাজুয়েট কলেজ',
    'search': ['sheikh borhanuddin college', 'borhanuddin college dhaka'],
  },
  {
    'name': 'নিউ মডেল ডিগ্রি কলেজ',
    'search': ['new model degree college dhaka'],
  },
  {
    'name': 'সেন্ট্রাল উইমেন্স কলেজ',
    'search': ['central womens college dhaka'],
  },
  {
    'name': 'সিদ্ধেশ্বরী কলেজ',
    'search': ['siddheswari college dhaka'],
  },
  {
    'name': 'তেজগাঁও মহিলা কলেজ',
    'search': ['tejgaon mohila college dhaka'],
  },
  {
    'name': 'আবুজর গিফারী কলেজ',
    'search': ['abuzar gifari college malibagh'],
  },
  {
    'name': 'খিলগাঁও মডেল কলেজ',
    'search': ['khilgaon model college'],
  },
  {
    'name': 'দনিয়া বিশ্ববিদ্যালয় কলেজ',
    'search': ['dania university college jatrabari'],
  },
  {
    'name': 'ডেমরা হাজী এম এ গাফ্ফার কলেজ',
    'search': ['demra haji ma gaffar college'],
  },
  {
    'name': 'রামপাল মহাবিদ্যালয়',
    'search': ['rampal college munshiganj'],
  },
  {
    'name': 'গজারিয়া সরকারি কলেজ',
    'search': ['gajaria govt college munshiganj'],
  },
  {
    'name': 'বেলাব সরকারি কলেজ',
    'search': ['belabo govt college narsingdi'],
  },
  {
    'name': 'পলাশ শিল্পাঞ্চল সরকারি কলেজ',
    'search': ['palash shilpanchal govt college narsingdi'],
  },
  {
    'name': 'শিবপুর সরকারি শহীদ আসাদ কলেজ',
    'search': ['shibpur govt shaheed asad college'],
  },
  {
    'name': 'হোসেনপুর সরকারি কলেজ',
    'search': ['hossainpur govt college kishoreganj'],
  },
  {
    'name': 'কটিয়াদী সরকারি কলেজ',
    'search': ['katiadi govt college kishoreganj'],
  },
  {
    'name': 'নিকলী মুক্তিযোদ্ধা আদর্শ কলেজ',
    'search': ['nikli muktijoddha adarsha college'],
  },
  {
    'name': 'কালীগঞ্জ সরকারি শ্রমিক কলেজ',
    'search': ['kaliganj govt sramik college gazipur'],
  },
  {
    'name': 'শ্রীপুর মুক্তিযোদ্ধা রহমত আলী সরকারি কলেজ',
    'search': ['sreepur rahmat ali govt college gazipur'],
  },
  {
    'name': 'কাপাসিয়া ডিগ্রি কলেজ',
    'search': ['kapasia degree college gazipur'],
  },
  {
    'name': 'সখিপুর আবাসিক মহিলা কলেজ',
    'search': ['sakhipur residential womens college tangail'],
  },
  {
    'name': 'ধনবাড়ী সরকারি কলেজ',
    'search': ['dhanbari govt college tangail'],
  },
  {
    'name': 'গোপালপুর সরকারি কলেজ',
    'search': ['gopalpur govt college tangail'],
  },
  {
    'name': 'ভূঞাপুর ইব্রাহীম খাঁ সরকারি কলেজ',
    'search': ['bhuapur ibrahim khan govt college tangail'],
  },
  {
    'name': 'কালিহাতী লুৎফর রহমান মতিন মহিলা কলেজ',
    'search': ['kalihati lutfar rahman matin college'],
  },
  {
    'name': 'কালকিনি সৈয়দ আবুল হোসেন একাডেমি ও কলেজ',
    'search': ['kalkini syed abul hossain college madaripur'],
  },
  {
    'name': 'শিবচর বরহামগঞ্জ সরকারি কলেজ',
    'search': ['borhamganj govt college shivchar madaripur'],
  },
  {
    'name': 'নড়িয়া সরকারি কলেজ',
    'search': ['naria govt college shariatpur'],
  },
  {
    'name': 'জাজিরা মোহর আলী ডিগ্রি কলেজ',
    'search': ['zajira mohor ali degree college shariatpur'],
  },
  {
    'name': 'ভেদরগঞ্জ এম এ রেজা কলেজ',
    'search': ['bhedarganj ma reza college shariatpur'],
  },
  {
    'name': 'গোসাইরহাট সরকারি শামসুর রহমান কলেজ',
    'search': ['gosairhat govt shamsur rahman college'],
  },
  {
    'name': 'বোয়ালমারী সরকারি কলেজ',
    'search': ['boalmari govt college faridpur'],
  },
  {
    'name': 'মধুখালী সরকারি আইনউদ্দিন কলেজ',
    'search': ['modhukhali govt ainuddin college faridpur'],
  },
  {
    'name': 'ভাঙ্গা সরকারি কাজী মাহবুবউল্লাহ কলেজ',
    'search': ['bhanga govt km college faridpur'],
  },
  {
    'name': 'সদরপুর সরকারি কলেজ',
    'search': ['sadarpur govt college faridpur'],
  },
  {
    'name': 'মুকসুদপুর সরকারি এস জে কলেজ',
    'search': ['muksudpur govt sj college gopalganj'],
  },
  {
    'name': 'কোটালীপাড়া শেখ লুৎফর রহমান আদর্শ সরকারি কলেজ',
    'search': ['kotalipara sheikh lutfar rahman college'],
  },
  {
    'name': 'টুঙ্গিপাড়া সরকারি শেখ মুজিবুর রহমান কলেজ',
    'search': ['tungipara govt sheikh mujibur rahman college'],
  },
  {
    'name': 'পাংশা সরকারি কলেজ',
    'search': ['pangsha govt college rajbari'],
  },
  {
    'name': 'বালিয়াকান্দি সরকারি কলেজ',
    'search': ['baliakandi govt college rajbari'],
  },
  {
    'name': 'গোয়ালন্দ কামরুল ইসলাম সরকারি কলেজ',
    'search': ['gowalando kamrul islam govt college rajbari'],
  },
  {
    'name': 'চন্দনাইশ গাছবাড়িয়া সরকারি কলেজ',
    'search': ['gachbaria govt college ctg'],
  },
  {
    'name': 'সাতকানিয়া সরকারি কলেজ',
    'search': ['satkania govt college ctg'],
  },
  {
    'name': 'হাটহাজারী সরকারি কলেজ',
    'search': ['hathazari govt college ctg'],
  },
  {
    'name': 'ফটিকছড়ি সরকারি কলেজ',
    'search': ['fatikchhari govt college ctg'],
  },
  {
    'name': 'নাজিরহাট কলেজ',
    'search': ['nazirhat college ctg'],
  },
  {
    'name': 'কোম্পানীগঞ্জ সরকারি মুজিব কলেজ',
    'search': ['companiganj govt mujib college noakhali'],
  },
  {
    'name': 'হাতিয়া দ্বীপ সরকারি কলেজ',
    'search': ['hatia dwip govt college noakhali'],
  },
  {
    'name': 'চরজব্বার ডিগ্রি কলেজ',
    'search': ['charjabbar degree college noakhali'],
  },
  {
    'name': 'রামগঞ্জ সরকারি কলেজ',
    'search': ['ramganj govt college lakshmipur'],
  },
  {
    'name': 'রামগতি আ স ম আবদুর রব সরকারি কলেজ',
    'search': ['ramgati asm abdur rab govt college lakshmipur'],
  },
  {
    'name': 'বিয়ানীবাজার সরকারি কলেজ',
    'search': ['beanibazar govt college sylhet'],
  },
  {
    'name': 'বড়লেখা সরকারি ডিগ্রি কলেজ',
    'search': ['barlekha govt degree college moulvibazar'],
  },
  {
    'name': 'বাঘা মোজাহার হোসেন মহিলা ডিগ্রি কলেজ',
    'search': ['bagha mozahar hossain mohila college rajshahi'],
  },
  {
    'name': 'ধুনট সরকারি এন এ ডিগ্রি কলেজ',
    'search': ['dhunat govt na degree college bogra'],
  },
  {
    'name': 'নন্দীগ্রাম মনসুর হোসেন ডিগ্রি কলেজ',
    'search': ['nandigram mansur hossain college bogra'],
  },
  {
    'name': 'ঈশ্বরদী সরকারি কলেজ',
    'search': ['ishwardi govt college pabna'],
  },
  {
    'name': 'ডুমুরিয়া সরকারি ডিগ্রি কলেজ',
    'search': ['dumuria govt degree college khulna'],
  },
  {
    'name': 'রূপসা কাজদিয়া সরকারি কলেজ',
    'search': ['rupsha kazdia govt college khulna'],
  },
  {
    'name': 'হিজলা বি সি ডি ডিগ্রি কলেজ',
    'search': ['hijla bcd degree college barisal'],
  },
  {
    'name': 'দুমকি নাসিমা কেরামত আলী মহিলা কলেজ',
    'search': ['dumki nasima keramat ali college patuakhali'],
  },
  {
    'name': 'তজুমদ্দিন সরকারি ডিগ্রি কলেজ',
    'search': ['tazumuddin govt degree college bhola'],
  },
  {
    'name': 'মনপুরা সরকারি ডিগ্রি কলেজ',
    'search': ['manpura govt degree college bhola'],
  },
  {
    'name': 'বদরগঞ্জ সরকারি কলেজ',
    'search': ['badarganj govt college rangpur'],
  },
  {
    'name': 'তারাগঞ্জ ওয়াক্ফ এস্টেট সরকারি কলেজ',
    'search': ['taraganj waqf estate govt college rangpur'],
  },
  {
    'name': 'হাকিমপুর মহিলা ডিগ্রি কলেজ',
    'search': ['hakimpur mohila degree college dinajpur'],
  },
  {
    'name': 'সিংগাইর সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['singair govt pilot high school manikganj'],
  },
  {
    'name': 'ঘিওর ডি এন পাইলট উচ্চ বিদ্যালয়',
    'search': ['ghior dn pilot high school manikganj'],
  },
  {
    'name': 'শিবালয় সরকারি উচ্চ বিদ্যালয়',
    'search': ['shibaloy govt high school manikganj'],
  },
  {
    'name': 'বেলাবো পাইলট মডার্ন উচ্চ বিদ্যালয়',
    'search': ['belabo pilot modern high school narsingdi'],
  },
  {
    'name': 'পলাশ থানা মডেল উচ্চ বিদ্যালয়',
    'search': ['palash thana model high school narsingdi'],
  },
  {
    'name': 'পাকুন্দিয়া সরকারি উচ্চ বিদ্যালয়',
    'search': ['pakundia govt high school kishoreganj'],
  },
  {
    'name': 'করিমগঞ্জ সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['karimganj govt pilot high school kishoreganj'],
  },
  {
    'name': 'তারাইল পাইলট উচ্চ বিদ্যালয়',
    'search': ['tarail pilot high school kishoreganj'],
  },
  {
    'name': 'মিঠামইন তমিজা খাতুন সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['mithamoin tamiza khatun girls school kishoreganj'],
  },
  {
    'name': 'কালিয়াকৈর গোলাম নবী পাইলট উচ্চ বিদ্যালয়',
    'search': ['kaliakair golam nabi pilot high school gazipur'],
  },
  {
    'name': 'কালীগঞ্জ সেন্ট নিকোলাস স্কুল',
    'search': ['st nicholas school kaliganj gazipur'],
  },
  {
    'name': 'বাসাইল গোবিন্দ সরকারি উচ্চ বিদ্যালয়',
    'search': ['basail gobinda govt high school tangail'],
  },
  {
    'name': 'ধনবাড়ী নওয়াব ইনস্টিটিউশন',
    'search': ['dhanbari nawab institution tangail'],
  },
  {
    'name': 'গোপালপুর সূতী ভি এম পাইলট মডেল হাই স্কুল',
    'search': ['gopalpur suti vm pilot high school tangail'],
  },
  {
    'name': 'নাগরপুর যদুনাথ পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['nagarpur jadunath pilot high school tangail'],
  },
  {
    'name': 'কালকিনি সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['kalkini govt pilot high school madaripur'],
  },
  {
    'name': 'গোসাইরহাট ইদিলপুর পাইলট উচ্চ বিদ্যালয়',
    'search': ['idilpur pilot high school gosairhat shariatpur'],
  },
  {
    'name': 'ভেদরগঞ্জ হেডকোয়ার্টার পাইলট উচ্চ বিদ্যালয়',
    'search': ['bhedarganj hq pilot high school shariatpur'],
  },
  {
    'name': 'টুঙ্গিপাড়া জি টি সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['tungipara gt govt model high school gopalganj'],
  },
  {
    'name': 'মুকসুদপুর পাইলট উচ্চ বিদ্যালয়',
    'search': ['muksudpur pilot high school gopalganj'],
  },
  {
    'name': 'সদরপুর পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['sadarpur pilot model high school faridpur'],
  },
  {
    'name': 'চরভদ্রাসন পাইলট উচ্চ বিদ্যালয়',
    'search': ['charbhadrasan pilot high school faridpur'],
  },
  {
    'name': 'সালথা পাইলট উচ্চ বিদ্যালয়',
    'search': ['saltha pilot high school faridpur'],
  },
  {
    'name': 'গোয়ালন্দ নাজির উদ্দিন পাইলট সরকারি উচ্চ বিদ্যালয়',
    'search': ['goalando nazir uddin pilot high school rajbari'],
  },
  {
    'name': 'ফটিকছড়ি করোনেশন সরকারি আদর্শ উচ্চ বিদ্যালয়',
    'search': ['fatikchhari coronation govt model high school ctg'],
  },
  {
    'name': 'হাটহাজারী পার্বতী সরকারি উচ্চ বিদ্যালয়',
    'search': ['hathazari parbati govt high school ctg'],
  },
  {
    'name': 'বোয়ালখালী কধুরখীল বালিকা উচ্চ বিদ্যালয়',
    'search': ['boalkhali kadhurkhil girls high school ctg'],
  },
  {
    'name': 'সাতকানিয়া আদর্শ উচ্চ বিদ্যালয়',
    'search': ['satkania adarsha high school ctg'],
  },
  {
    'name': 'কর্ণফুলী এ জে চৌধুরী মডেল উচ্চ বিদ্যালয়',
    'search': ['karnafuli aj chowdhury model high school ctg'],
  },
  {
    'name': 'তিতাস সরকারি মডেল পাইলট উচ্চ বিদ্যালয়',
    'search': ['titas govt model pilot high school comilla'],
  },
  {
    'name': 'মেঘনা সরকারি মানিকারচর মডেল হাই স্কুল',
    'search': ['meghna manikarchar model high school comilla'],
  },
  {
    'name': 'মুরাদনগর কোম্পানীগঞ্জ বদিউল আলম উচ্চ বিদ্যালয়',
    'search': ['companiganj badiul alam high school muradnagar'],
  },
  {
    'name': 'মনোহরগঞ্জ সরকারি উচ্চ বিদ্যালয়',
    'search': ['monoharganj govt high school comilla'],
  },
  {
    'name': 'লালমাই সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['lalmai govt model high school comilla'],
  },
  {
    'name': 'রামগঞ্জ এম ইউ সরকারি উচ্চ বিদ্যালয়',
    'search': ['ramganj mu govt high school lakshmipur'],
  },
  {
    'name': 'রায়পুর এল এম পাইলট উচ্চ বিদ্যালয়',
    'search': ['raipur lm pilot high school lakshmipur'],
  },
  {
    'name': 'ছাগলনাইয়া সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['chhagalnaiya govt pilot high school feni'],
  },
  {
    'name': 'ফুলগাজী পাইলট উচ্চ বিদ্যালয়',
    'search': ['fulgazi pilot high school feni'],
  },
  {
    'name': 'পরশুরাম সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['parshuram govt pilot high school feni'],
  },
  {
    'name': 'দাগনভূঞা আতাতুর্ক সরকারি মডেল হাই স্কুল',
    'search': ['daganbhuiyan ataturk govt model high school feni'],
  },
  {
    'name': 'সোনাগাজী মোহাম্মদেরিয়া মডেল উচ্চ বিদ্যালয়',
    'search': ['sonagazi mohammadia model high school feni'],
  },
  {
    'name': 'কসবা সরকারি উচ্চ বিদ্যালয়',
    'search': ['kasba govt high school brahmanbaria'],
  },
  {
    'name': 'নবীনগর সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['nabinagar govt pilot high school brahmanbaria'],
  },
  {
    'name': 'আখাউড়া নাছরীন নবী সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['akhaura nasreen nabi govt model high school'],
  },
  {
    'name': 'বাঞ্ছারামপুর এস এম পাইলট উচ্চ বিদ্যালয়',
    'search': ['bancharampur sm pilot high school brahmanbaria'],
  },
  {
    'name': 'নাসিরনগর আশুতোষ পাইলট উচ্চ বিদ্যালয়',
    'search': ['nasirnagar ashutosh pilot high school brahmanbaria'],
  },
  {
    'name': 'কচুয়া সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['kachua govt pilot high school chandpur'],
  },
  {
    'name': 'মতলব সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['matlab govt pilot high school chandpur'],
  },
  {
    'name': 'ফরিদগঞ্জ এ আর পাইলট সরকারি উচ্চ বিদ্যালয়',
    'search': ['faridganj ar pilot govt high school chandpur'],
  },
  {
    'name': 'চকরিয়া সরকারি উচ্চ বিদ্যালয়',
    'search': ['chakaria govt high school coxs bazar'],
  },
  {
    'name': 'মহেশখালী সরকারি আদর্শ উচ্চ বিদ্যালয়',
    'search': ['maheshkhali govt adarsha high school coxs bazar'],
  },
  {
    'name': 'টেকনাফ সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['teknaf govt pilot high school coxs bazar'],
  },
  {
    'name': 'উখিয়া সরকারি উচ্চ বিদ্যালয়',
    'search': ['ukhiya govt high school coxs bazar'],
  },
  {
    'name': 'শিবগঞ্জ সরকারি মডেল হাই স্কুল (চাঁপাইনবাবগঞ্জ)',
    'search': ['shibganj govt model high school chapai'],
  },
  {
    'name': 'ভোলাহাট রামেশ্বর পাইলট মডেল ইনস্টিটিউশন',
    'search': ['bholahat rameshwar pilot model institution chapai'],
  },
  {
    'name': 'নাচোল খুরশীদ মোল্লা সরকারি উচ্চ বিদ্যালয়',
    'search': ['nachole khurshid molla govt high school chapai'],
  },
  {
    'name': 'গোমস্তাপুর পাইলট উচ্চ বিদ্যালয়',
    'search': ['gomastapur pilot high school chapai'],
  },
  {
    'name': 'বড়াইগ্রাম পাইলট উচ্চ বিদ্যালয়',
    'search': ['baraigram pilot high school natore'],
  },
  {
    'name': 'গুরুদাসপুর পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['gurudaspur pilot model high school natore'],
  },
  {
    'name': 'সিংড়া দমদমা পাইলট স্কুল অ্যান্ড কলেজ',
    'search': ['singra damdama pilot school and college natore'],
  },
  {
    'name': 'লালপুর শ্রী সুন্দরী পাইলট উচ্চ বিদ্যালয়',
    'search': ['lalpur sri sundari pilot high school natore'],
  },
  {
    'name': 'পত্নীতলা সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['patnitala govt model high school naogaon'],
  },
  {
    'name': 'ধামইরহাট সরকারি এম এম উচ্চ বিদ্যালয়',
    'search': ['dhamoirhat govt mm high school naogaon'],
  },
  {
    'name': 'বদলগাছী সরকারি মডেল পাইলট হাই স্কুল',
    'search': ['badalgachhi govt model pilot high school naogaon'],
  },
  {
    'name': 'মহাদেবপুর সর্বমঙ্গলা (পাইলট) উচ্চ বিদ্যালয়',
    'search': ['mohadevpur sarbamangala pilot high school naogaon'],
  },
  {
    'name': 'পাঁচবিবি এল বি পি সরকারি উচ্চ বিদ্যালয়',
    'search': ['panchbibi lbp govt high school joypurhat'],
  },
  {
    'name': 'কালাই ময়েন উদ্দিন সরকারি উচ্চ বিদ্যালয়',
    'search': ['kalai mayen uddin govt high school joypurhat'],
  },
  {
    'name': 'আক্কেলপুর এফ ইউ পাইলট উচ্চ বিদ্যালয়',
    'search': ['akkelpur fu pilot high school joypurhat'],
  },
  {
    'name': 'উল্লাপাড়া মার্চেন্টস পাইলট সরকারি উচ্চ বিদ্যালয়',
    'search': ['ullapara merchants pilot govt high school sirajganj'],
  },
  {
    'name': 'শাহজাদপুর পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['shahjadpur pilot model high school sirajganj'],
  },
  {
    'name': 'বেলকুচি সরকারি বহুমুখী উচ্চ বিদ্যালয়',
    'search': ['belkuchi govt multipurpose high school sirajganj'],
  },
  {
    'name': 'রায়গঞ্জ পাইলট উচ্চ বিদ্যালয়',
    'search': ['raiganj pilot high school sirajganj'],
  },
  {
    'name': 'কাজিপুর মনসুর আলী সরকারি উচ্চ বিদ্যালয়',
    'search': ['kazipur mansur ali govt high school sirajganj'],
  },
  {
    'name': 'চাটমোহর রাজা চন্দ্রনাথ ও বাবু শম্ভুনাথ মডেল সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['chatmohar rcsb model pilot high school pabna'],
  },
  {
    'name': 'ভাঙ্গুড়া জরিনা রহিম বালিকা উচ্চ বিদ্যালয়',
    'search': ['bhangura jarina rahim girls high school pabna'],
  },
  {
    'name': 'মোহাম্মদপুর আর এস কে এইচ ইনস্টিটিউশন',
    'search': ['mohammadpur rskh institution magura'],
  },
  {
    'name': 'শালিখা আড়পাড়া আইডিয়াল উচ্চ বিদ্যালয়',
    'search': ['shalikha arpara ideal high school magura'],
  },
  {
    'name': 'লোহাগড়া সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['lohagara govt pilot high school narail'],
  },
  {
    'name': 'কালিয়া সরকারি পাইলট মডেল মাধ্যমিক বিদ্যালয়',
    'search': ['kalia govt pilot model secondary school narail'],
  },
  {
    'name': 'গাংনী সরকারি পাইলট মাধ্যমিক বিদ্যালয়',
    'search': ['gangni govt pilot secondary school meherpur'],
  },
  {
    'name': 'জীবননগর থানা মডেল পাইলট মাধ্যমিক বিদ্যালয়',
    'search': ['jibannagar thana model pilot school chuadanga'],
  },
  {
    'name': 'মহেশপুর সরকারি পাইলট মডেল মাধ্যমিক বিদ্যালয়',
    'search': ['maheshpur govt pilot model school jhenaidah'],
  },
  {
    'name': 'কোটচাঁদপুর সরকারি মডেল পাইলট মাধ্যমিক বিদ্যালয়',
    'search': ['kotchandpur govt model pilot school jhenaidah'],
  },
  {
    'name': 'শৈলকূপা সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['shailkupa govt pilot high school jhenaidah'],
  },
  {
    'name': 'কুমারখালী এম এন সরকারি পাইলট মডেল মাধ্যমিক বিদ্যালয়',
    'search': ['kumarkhali mn govt pilot secondary school kushtia'],
  },
  {
    'name': 'খোকসা জানীপুর পাইলট উচ্চ বিদ্যালয়',
    'search': ['khoksa janipur pilot high school kushtia'],
  },
  {
    'name': 'মিরপুর সরকারি পাইলট উচ্চ বিদ্যালয় (কুষ্টিয়া)',
    'search': ['mirpur govt pilot high school kushtia'],
  },
  {
    'name': 'ভেড়ামারা সরকারি পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['bheramara govt pilot model high school kushtia'],
  },
  {
    'name': 'দৌলতপুর পাইলট উচ্চ বিদ্যালয় (কুষ্টিয়া)',
    'search': ['daulatpur pilot high school kushtia'],
  },
  {
    'name': 'কলারোয়া সরকারি জিকেএমকে পাইলট হাই স্কুল',
    'search': ['kalaroa govt gkmk pilot high school satkhira'],
  },
  {
    'name': 'কালিগঞ্জ সরকারি পাইলট মডেল মাধ্যমিক বিদ্যালয়',
    'search': ['kaliganj govt pilot model school satkhira'],
  },
  {
    'name': 'শ্যামনগর মহসিন ডিগ্রি কলেজ ও হাই স্কুল',
    'search': ['shyamnagar mohsin college school satkhira'],
  },
  {
    'name': 'তালা বি দে সরকারি উচ্চ বিদ্যালয়',
    'search': ['tala bd govt high school satkhira'],
  },
  {
    'name': 'ফকিরহাট খলিলুর রহমান ডিগ্রি কলেজ ও মাধ্যমিক বিদ্যালয়',
    'search': ['fakirhat khalilur rahman school bagerhat'],
  },
  {
    'name': 'শরণখোলা রায়েন্দা পাইলট মাধ্যমিক বিদ্যালয়',
    'search': ['sharankhola rayenda pilot school bagerhat'],
  },
  {
    'name': 'মোংলা বন্দর মাধ্যমিক বিদ্যালয়',
    'search': ['mongla port secondary school bagerhat'],
  },
  {
    'name': 'গৌরনদী সরকারি পাইলট মাধ্যমিক বিদ্যালয়',
    'search': ['gaurnadi govt pilot secondary school barisal'],
  },
  {
    'name': 'বাকেরগঞ্জ জে এস ইউ মডেল হাই স্কুল',
    'search': ['bakerganj jsu model high school barisal'],
  },
  {
    'name': 'নলছিটি মার্চেন্টস মাধ্যমিক বিদ্যালয়',
    'search': ['nalchity merchants secondary school jhalakathi'],
  },
  {
    'name': 'রাজাপুর সরকারি পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['rajapur govt pilot model high school jhalakathi'],
  },
  {
    'name': 'মঠবাড়িয়া কে এম লতীফ ইনস্টিটিউশন',
    'search': ['mathbaria km latif institution pirojpur'],
  },
  {
    'name': 'ভাণ্ডারিয়া বিহারী লাল পাইলট মাধ্যমিক বিদ্যালয়',
    'search': ['bhandaria bihari lal pilot school pirojpur'],
  },
  {
    'name': 'নাজিরপুর সিরাজুল হক সরকারি মাধ্যমিক বিদ্যালয়',
    'search': ['nazirpur sirajul haq govt school pirojpur'],
  },
  {
    'name': 'নেছারাবাদ স্বরূপকাঠি পাইলট মডেল মাধ্যমিক বিদ্যালয়',
    'search': ['swarupkati pilot model secondary school pirojpur'],
  },
  {
    'name': 'ফেঞ্চুগঞ্জ কাসিম আলী সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['fenchuganj kasim ali govt model high school sylhet'],
  },
  {
    'name': 'কোম্পানীগঞ্জ থানা মডেল উচ্চ বিদ্যালয় (সিলেট)',
    'search': ['companiganj thana model high school sylhet'],
  },
  {
    'name': 'গোয়াইনঘাট সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['gowainghat govt model high school sylhet'],
  },
  {
    'name': 'শান্তিগঞ্জ পাগলা সরকারি হাই স্কুল অ্যান্ড কলেজ',
    'search': ['shantiganj pagla govt high school sunamganj'],
  },
  {
    'name': 'তাহিরপুর সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['tahirpur govt model high school sunamganj'],
  },
  {
    'name': 'জামালগঞ্জ সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['jamalganj govt model high school sunamganj'],
  },
  {
    'name': 'রাজনগর পোর্টিয়াস সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['rajnagar porteous govt model high school moulvibazar'],
  },
  {
    'name': 'বানিয়াচং এ আর সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['baniachong ar govt model high school habiganj'],
  },
  {
    'name': 'হাতীবান্ধা এস এস সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['hatibandha ss govt model high school lalmonirhat'],
  },
  {
    'name': 'পাটগ্রাম তারকনাথ উচ্চ বিদ্যালয়',
    'search': ['patgram taraknath high school lalmonirhat'],
  },
  {
    'name': 'কালীগঞ্জ কে বি আর পাইলট উচ্চ বিদ্যালয় (লালমনিরহাট)',
    'search': ['kaliganj kbr pilot high school lalmonirhat'],
  },
  {
    'name': 'ভূরুঙ্গামারী পাইলট সরকারি উচ্চ বিদ্যালয়',
    'search': ['bhurungamari pilot govt high school kurigram'],
  },
  {
    'name': 'নাগেশ্বরী দয়াময়ী পাইলট একাডেমি',
    'search': ['nageshwari dayamoyee pilot academy kurigram'],
  },
  {
    'name': 'উলিপুর এম এস হাই স্কুল অ্যান্ড কলেজ',
    'search': ['ulipur ms high school kurigram'],
  },
  {
    'name': 'চিলমারী সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['chilmari govt model high school kurigram'],
  },
  {
    'name': 'রৌমারী সি জি জামান সরকারি উচ্চ বিদ্যালয়',
    'search': ['rowmari cg zaman govt high school kurigram'],
  },
  {
    'name': 'ডোমার বহুমুখী উচ্চ বিদ্যালয়',
    'search': ['domar multipurpose high school nilphamari'],
  },
  {
    'name': 'জলঢাকা সরকারি মডেল পাইলট উচ্চ বিদ্যালয়',
    'search': ['jaldhaka govt model pilot high school nilphamari'],
  },
  {
    'name': 'কিশোরগঞ্জ বহুমুখী মডেল উচ্চ বিদ্যালয় (নীলফামারী)',
    'search': ['kishoreganj model high school nilphamari'],
  },
  {
    'name': 'পীরগঞ্জ সরকারি পাইলট উচ্চ বিদ্যালয় (ঠাকুরগাঁও)',
    'search': ['pirganj govt pilot high school thakurgaon'],
  },
  {
    'name': 'রানীশংকৈল মডেল সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['ranisankail model govt pilot high school thakurgaon'],
  },
  {
    'name': 'বোদা পাইলট সরকারি মডেল স্কুল অ্যান্ড কলেজ',
    'search': ['boda pilot govt model school panchagarh'],
  },
  {
    'name': 'দেবীগঞ্জ নৃপেন্দ্র নারায়ণ সরকারি উচ্চ বিদ্যালয়',
    'search': ['debiganj nripendra narayan govt school panchagarh'],
  },
  {
    'name': 'পলাশবাড়ী এস এম পাইলট সরকারি উচ্চ বিদ্যালয়',
    'search': ['palashbari sm pilot govt high school gaibandha'],
  },
  {
    'name': 'গোবিন্দগঞ্জ বহুমুখী উচ্চ বিদ্যালয়',
    'search': ['gobindaganj multipurpose high school gaibandha'],
  },
  {
    'name': 'সুন্দরগঞ্জ আব্দুল মজিদ সরকারি বালক উচ্চ বিদ্যালয়',
    'search': ['sundarganj abdul majid govt high school gaibandha'],
  },
  {
    'name': 'হালুয়াঘাট সেন্ট অ্যান্ড্রুজ উচ্চ বিদ্যালয়',
    'search': ['haluaghat st andrews high school mymensingh'],
  },
  {
    'name': 'ধোবাউড়া বহুমুখী সরকারি মডেল উচ্চ বিদ্যালয়',
    'search': ['dhobaura govt model high school mymensingh'],
  },
  {
    'name': 'তারাকান্দা বহুমুখী উচ্চ বিদ্যালয়',
    'search': ['tarakanda multipurpose high school mymensingh'],
  },
  {
    'name': 'মেলান্দহ উমির উদ্দিন পাইলট উচ্চ বিদ্যালয়',
    'search': ['melandaha umir uddin pilot high school jamalpur'],
  },
  {
    'name': 'ইসলামপুর নেকজাহান সরকারি মডেল পাইলট উচ্চ বিদ্যালয়',
    'search': ['islampur nekjahan govt model high school jamalpur'],
  },
  {
    'name': 'দেওয়ানগঞ্জ সরকারি উচ্চ বিদ্যালয়',
    'search': ['dewanganj govt high school jamalpur'],
  },
  {
    'name': 'বকশীগঞ্জ উলফাতুন্নেছা সরকারি বালিকা উচ্চ বিদ্যালয়',
    'search': ['bakshiganj ulfatunnesa govt girls school jamalpur'],
  },
  {
    'name': 'সরিষাবাড়ী আর ডি পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['sarishabari rd pilot model high school jamalpur'],
  },
  {
    'name': 'নকলা পাইলট মডেল উচ্চ বিদ্যালয়',
    'search': ['nakla pilot model high school sherpur'],
  },
  {
    'name': 'নালিতাবাড়ী তারাগঞ্জ সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['nalitabari taraganj govt pilot high school sherpur'],
  },
  {
    'name': 'ঝিনাইগাতী মডেল পাইলট উচ্চ বিদ্যালয়',
    'search': ['jhenaigati model pilot high school sherpur'],
  },
  {
    'name': 'শ্রীবরদী সরকারি এম এন মডেল উচ্চ বিদ্যালয়',
    'search': ['sreebardi govt mn model high school sherpur'],
  },
  {
    'name': 'দুর্গাপুর সুসঙ্গ সরকারি মহাবিদ্যালয় ও উচ্চ বিদ্যালয়',
    'search': ['durgapur susang govt college school netrokona'],
  },
  {
    'name': 'কলমাকান্দা সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['kalmakanda govt pilot high school netrokona'],
  },
  {
    'name': 'মোহনগঞ্জ সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['mohanganj govt pilot high school netrokona'],
  },
  {
    'name': 'কেন্দুয়া জয়হরি স্প্রাই সরকারি উচ্চ বিদ্যালয়',
    'search': ['kendua joyhari spry govt high school netrokona'],
  },
  {
    'name': 'পূর্বধলা জগৎমণি সরকারি পাইলট উচ্চ বিদ্যালয়',
    'search': ['purbadhala jagatmoni govt pilot high school netrokona'],
  },
];

/// Returns up to 10 canonical college names matching [query].
/// Supports partial, word-split, and phonetic matches.
List<String> searchColleges(String query) {
  final rawQ = cleanBanglaUnicode(query).trim();
  if (rawQ.isEmpty) return [];
  final q = rawQ.toLowerCase();
  final foldedQ = banglaPhoneticFold(q);
  final qTokens = q.split(RegExp(r'\s+')).where((t) => t.isNotEmpty).toList();

  final seen = <String>{};
  final results = <String>[];

  // Pass 1: Direct prefix or containment match on name or aliases
  for (final entry in _collegeData) {
    final name = entry['name'] as String;
    if (seen.contains(name)) continue;

    final lowerName = name.toLowerCase();
    final aliases = (entry['search'] as List<String>);

    // Exact or prefix match
    final isDirectMatch = lowerName.contains(q) ||
        aliases.any((s) => s.contains(q));

    // Multi-token match e.g. "sonargaon college" or "dhaka com"
    final isTokenMatch = qTokens.length > 1 &&
        qTokens.every((token) =>
            lowerName.contains(token) ||
            aliases.any((s) => s.contains(token)));

    if (isDirectMatch || isTokenMatch) {
      seen.add(name);
      results.add(name);
      if (results.length >= 10) return results;
    }
  }

  // Pass 2: Bangla phonetic match
  if (results.length < 10) {
    for (final entry in _collegeData) {
      final name = entry['name'] as String;
      if (seen.contains(name)) continue;

      final foldedName = banglaPhoneticFold(name);
      final foldedAliases = (entry['search'] as List<String>)
          .map((s) => banglaPhoneticFold(s));

      if (foldedName.contains(foldedQ) ||
          foldedAliases.any((s) => s.contains(foldedQ))) {
        seen.add(name);
        results.add(name);
        if (results.length >= 10) return results;
      }
    }
  }

  return results;
}

int _levenshtein(String s, String t) {
  if (s == t) return 0;
  if (s.isEmpty) return t.length;
  if (t.isEmpty) return s.length;

  List<int> v0 = List<int>.filled(t.length + 1, 0);
  List<int> v1 = List<int>.filled(t.length + 1, 0);

  for (int i = 0; i < t.length + 1; i++) {
    v0[i] = i;
  }

  for (int i = 0; i < s.length; i++) {
    v1[0] = i + 1;

    for (int j = 0; j < t.length; j++) {
      int cost = (s[i] == t[j]) ? 0 : 1;
      v1[j + 1] = [v1[j] + 1, v0[j + 1] + 1, v0[j] + cost].reduce((a, b) => a < b ? a : b);
    }

    for (int j = 0; j < t.length + 1; j++) {
      v0[j] = v1[j];
    }
  }

  return v1[t.length];
}

String _toTitleCase(String text) {
  if (text.isEmpty) return text;
  return text.split(' ').map((word) {
    if (word.isEmpty) return word;
    return word[0].toUpperCase() + word.substring(1).toLowerCase();
  }).join(' ');
}

String banglaPhoneticFold(String text) {
  var s = text.trim().toLowerCase().replaceAll(RegExp(r'\s+'), ' ');
  // Handle decomposed nukta (ড + ় -> র, ঢ + ় -> ঢ)
  s = s.replaceAll('ড\u09BC', 'র');
  s = s.replaceAll('ঢ\u09BC', 'ঢ');
  s = s.replaceAll('ড়', 'র');
  s = s.replaceAll('ঢ়', 'ঢ');
  s = s.replaceAll('\u09BC', ''); // remove remaining nuktas
  s = s
      .replaceAll('ণ', 'ন')
      .replaceAll('ষ', 'স')
      .replaceAll('শ', 'স')
      .replaceAll('ী', 'ি')
      .replaceAll('ূ', 'ু')
      .replaceAll('ৎ', 'ত')
      .replaceAll('য়', 'য');
  return s;
}

String cleanBanglaUnicode(String text) {
  var s = text.trim().replaceAll(RegExp(r'\s+'), ' ');
  s = s.replaceAll('ড\u09BC', 'ড়');
  s = s.replaceAll('ঢ\u09BC', 'ঢ়');
  s = s.replaceAll('য\u09BC', 'য়');
  return s;
}

/// Attempts to find the closest official college name for a given raw input.
/// Uses exact matching, alias matching, phonetic folding, and Levenshtein distance for typo tolerance.
String normalizeCollegeName(String input) {
  final raw = cleanBanglaUnicode(input);
  if (raw.isEmpty) return raw;
  final q = raw.toLowerCase().replaceAll(RegExp(r'\s+'), ' ');

  // Direct special pattern checks for common variations
  if (q.contains('murapara') || q.contains('মুরাপাড়া') || q.contains('মুরাপারা') || q.contains('মুড়াপাড়া')) {
    return 'সরকারি মুড়াপাড়া কলেজ';
  }
  if (q == 'ndc' || q.contains('notre dame')) {
    return 'নটর ডেম কলেজ';
  }
  if (q.contains('mohammadpur model')) {
    return 'গভর্নমেন্ট মোহাম্মদপুর মডেল স্কুল অ্যান্ড কলেজ';
  }

  // 1. Check for exact match in name or search aliases
  for (final entry in _collegeData) {
    final name = entry['name'] as String;
    if (name.toLowerCase() == q) return name;
    
    for (final alias in (entry['search'] as List<String>)) {
      if (alias.toLowerCase() == q) return name;
    }
  }

  // 2. Generic Bangla phonetic match
  final foldedQ = banglaPhoneticFold(q);
  for (final entry in _collegeData) {
    final name = entry['name'] as String;
    if (banglaPhoneticFold(name) == foldedQ) return name;
    for (final alias in (entry['search'] as List<String>)) {
      if (banglaPhoneticFold(alias) == foldedQ) return name;
    }
  }

  // 3. Levenshtein fuzzy match
  String? bestMatch;
  int minDistance = 9999;
  
  if (q.length > 4) {
    for (final entry in _collegeData) {
      final name = entry['name'] as String;
      
      for (final alias in (entry['search'] as List<String>)) {
        if ((alias.length - q.length).abs() > 4) continue;
        
        final dist = _levenshtein(q, alias.toLowerCase());
        if (dist < minDistance) {
          minDistance = dist;
          bestMatch = name;
        }
      }
      
      if ((name.length - q.length).abs() <= 4) {
         final dist = _levenshtein(q, name.toLowerCase());
         if (dist < minDistance) {
            minDistance = dist;
            bestMatch = name;
         }
      }
    }
  }

  // For strings ~10 chars, distance 3 is reasonable.
  if (bestMatch != null && minDistance <= 3) {
    return bestMatch;
  }

  // Fallback: clean unicode string, title case if English
  return RegExp(r'[a-zA-Z]').hasMatch(raw) ? _toTitleCase(raw) : raw;
}

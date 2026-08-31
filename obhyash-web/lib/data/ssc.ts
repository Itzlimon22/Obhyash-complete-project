import type { Subject } from '../types';
import {
  BookOpen,
  FlaskConical,
  Atom,
  Sigma,
  Dna,
  Laptop,
  Globe,
  Briefcase,
  BarChart3,
  Landmark,
  History,
} from 'lucide-react';

export const sscSubjects: Subject[] = [
  {
    id: 'ssc-bangla-1',
    name: 'SSC বাংলা ১ম পত্র',
    icon: BookOpen,
    group: 'General',
    chapters: [
      {
        id: 'ssc-bangla-1-ch1',
        name: 'গদ্য',
        topics: [
          { id: 'ssc-bangla-1-ch1-t1', name: 'শুভা - রবীন্দ্রনাথ ঠাকুর', serial: 1 },
          { id: 'ssc-bangla-1-ch1-t2', name: 'বই পড়া - প্রমথ চৌধুরী', serial: 2 },
          { id: 'ssc-bangla-1-ch1-t3', name: 'অভাগীর স্বর্গ - শরৎচন্দ্র চট্টোপাধ্যায়', serial: 3 },
          { id: 'ssc-bangla-1-ch1-t4', name: 'পল্লীসাহিত্য - ড. মুহম্মদ শহীদুল্লাহ', serial: 4 },
          { id: 'ssc-bangla-1-ch1-t5', name: 'মানুষ মুহম্মদ (স.) - মোহাম্মদ ওয়াজেদ আলী', serial: 5 },
          { id: 'ssc-bangla-1-ch1-t6', name: 'নিমগাছ - বনফুল', serial: 6 },
          { id: 'ssc-bangla-1-ch1-t7', name: 'উপেক্ষিতা শক্তির উদ্বোধন - কাজী নজরুল ইসলাম', serial: 7 },
          { id: 'ssc-bangla-1-ch1-t8', name: 'শিক্ষা ও মনুষ্যত্ব - মোতাহের হোসেন চৌধুরী', serial: 8 },
          { id: 'ssc-bangla-1-ch1-t9', name: 'প্রবাস বন্ধু - সৈয়দ মুজতবা আলী', serial: 9 },
          { id: 'ssc-bangla-1-ch1-t10', name: 'মমতাদি - মানিক বন্দ্যোপাধ্যায়', serial: 10 },
          { id: 'ssc-bangla-1-ch1-t11', name: 'একাত্তরের দিনগুলি - জাহানারা ইমাম', serial: 11 },
          { id: 'ssc-bangla-1-ch1-t12', name: 'সাহিত্যের রূপ ও রীতি - হায়াৎ মামুদ', serial: 12 },
          { id: 'ssc-bangla-1-ch1-t13', name: 'নিয়তি - হুমায়ূন আহমেদ', serial: 13 },
          { id: 'ssc-bangla-1-ch1-t14', name: 'পয়লা বৈশাখ - কবীর চৌধুরী', serial: 14 },
          { id: 'ssc-bangla-1-ch1-t15', name: 'আমার সন্তান - ভারতচন্দ্র রায়গুণাকর', serial: 15 },
        ],
      },
      {
        id: 'ssc-bangla-1-ch2',
        name: 'পদ্য',
        topics: [
          { id: 'ssc-bangla-1-ch2-t1', name: 'বঙ্গবাণী - আব্দুল হাকিম', serial: 1 },
          { id: 'ssc-bangla-1-ch2-t2', name: 'কপোতাক্ষ নদ - মাইকেল মধুসূদন দত্ত', serial: 2 },
          { id: 'ssc-bangla-1-ch2-t3', name: 'জীবন-সঙ্গীত - হেমচন্দ্র বন্দ্যোপাধ্যায়', serial: 3 },
          { id: 'ssc-bangla-1-ch2-t4', name: 'জুতো আবিষ্কার - রবীন্দ্রনাথ ঠাকুর', serial: 4 },
          { id: 'ssc-bangla-1-ch2-t5', name: 'ঝিঙে ফুল - কাজী নজরুল ইসলাম', serial: 5 },
          { id: 'ssc-bangla-1-ch2-t6', name: 'উমর ফারুক - কাজী নজরুল ইসলাম', serial: 6 },
          { id: 'ssc-bangla-1-ch2-t7', name: 'সেইদিন এই মাঠ - জীবনানন্দ দাশ', serial: 7 },
          { id: 'ssc-bangla-1-ch2-t8', name: 'পল্লী জননী - জসীমউদ্দীন', serial: 8 },
          { id: 'ssc-bangla-1-ch2-t9', name: 'আশা - সিকান্দার আবু জাফর', serial: 9 },
          { id: 'ssc-bangla-1-ch2-t10', name: 'রানার - সুকান্ত ভট্টাচার্য', serial: 10 },
          { id: 'ssc-bangla-1-ch2-t11', name: 'তোমাকে পাওয়ার জন্যে, হে স্বাধীনতা - শামসুর রাহমান', serial: 11 },
          { id: 'ssc-bangla-1-ch2-t12', name: 'আমার পরিচয় - সৈয়দ শামসুল হক', serial: 12 },
          { id: 'ssc-bangla-1-ch2-t13', name: 'স্বাধীনতা, এ শব্দটি কীভাবে আমাদের হলো - নির্মলেন্দু গুণ', serial: 13 },
          { id: 'ssc-bangla-1-ch2-t14', name: 'সাহসী জননী বাংলা - কামাল চৌধুরী', serial: 14 },
          { id: 'ssc-bangla-1-ch2-t15', name: 'মানুষ - কাজী নজরুল ইসলাম', serial: 15 },
        ],
      },
    ],
  },
  {
    id: 'ssc-bangla-2',
    name: 'SSC বাংলা ২য় পত্র',
    icon: BookOpen,
    group: 'General',
    chapters: [
      {
        id: 'ssc-bangla-2-ch1',
        name: 'ধ্বনিতত্ত্ব',
        topics: [
          { id: 'ssc-bangla-2-ch1-t1', name: 'ধ্বনি ও বর্ণ পরিচয় (স্বরধ্বনি ও ব্যঞ্জনধ্বনি)', serial: 1 },
          { id: 'ssc-bangla-2-ch1-t2', name: 'উচ্চারণ স্থান ও বৈশিষ্ট্য অনুযায়ী ধ্বনির শ্রেণিবিভাগ', serial: 2 },
          { id: 'ssc-bangla-2-ch1-t3', name: 'যুক্তবর্ণ ও বর্ণ বিশ্লেষণ', serial: 3 },
          { id: 'ssc-bangla-2-ch1-t4', name: 'ধ্বনির পরিবর্তন (স্বরভক্তি, অপিনিহিতি, অভিশ্রুতি, সমীভবন)', serial: 4 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch2',
        name: 'ণত্ব ও ষত্ব বিধান',
        topics: [
          { id: 'ssc-bangla-2-ch2-t1', name: 'ণ-ত্ব বিধানের নিয়মাবলী ও উদাহরণ', serial: 1 },
          { id: 'ssc-bangla-2-ch2-t2', name: 'ষ-ত্ব বিধানের নিয়মাবলী ও উদাহরণ', serial: 2 },
          { id: 'ssc-bangla-2-ch2-t3', name: 'স্বভাবতই \'ণ\' ও \'ষ\' এর ব্যবহার ও ব্যতিক্রম', serial: 3 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch3',
        name: 'সন্ধি',
        topics: [
          { id: 'ssc-bangla-2-ch3-t1', name: 'স্বরসন্ধির নিয়ম ও উদাহরণ', serial: 1 },
          { id: 'ssc-bangla-2-ch3-t2', name: 'ব্যঞ্জনসন্ধির নিয়ম ও উদাহরণ', serial: 2 },
          { id: 'ssc-bangla-2-ch3-t3', name: 'বিসর্গ সন্ধি ও নিপাতনে সিদ্ধ সন্ধি', serial: 3 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch4',
        name: 'সমাস',
        topics: [
          { id: 'ssc-bangla-2-ch4-t1', name: 'দ্বন্দ্ব ও দ্বিগু সমাস', serial: 1 },
          { id: 'ssc-bangla-2-ch4-t2', name: 'কর্মধারয় সমাস (সাধারণ, মধ্যপদলোপী, উপমান, উপমিত, রূপক)', serial: 2 },
          { id: 'ssc-bangla-2-ch4-t3', name: 'তৎপুরুষ সমাস (দ্বিতীয়া থেকে সপ্তমী, অলুক, উপপদ)', serial: 3 },
          { id: 'ssc-bangla-2-ch4-t4', name: 'বহুব্রীহি সমাস (সমানাধিকরণ, ব্যাধিকরণ, মধ্যপদলোপী, ব্যতিহার)', serial: 4 },
          { id: 'ssc-bangla-2-ch4-t5', name: 'অব্যয়ীভাব সমাস ও নিত্য সমাস', serial: 5 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch5',
        name: 'উপসর্গ',
        topics: [
          { id: 'ssc-bangla-2-ch5-t1', name: 'বাংলা উপসর্গ (২১টি) ও প্রয়োগ', serial: 1 },
          { id: 'ssc-bangla-2-ch5-t2', name: 'তৎসম বা সংস্কৃত উপসর্গ (২০টি) ও প্রয়োগ', serial: 2 },
          { id: 'ssc-bangla-2-ch5-t3', name: 'বিদেশি উপসর্গ (ফারসি, আরবি, ইংরেজি) ও প্রয়োগ', serial: 3 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch6',
        name: 'প্রত্যয়',
        topics: [
          { id: 'ssc-bangla-2-ch6-t1', name: 'কৃৎ প্রত্যয় ও কৃদন্ত পদ (বাংলা ও সংস্কৃত)', serial: 1 },
          { id: 'ssc-bangla-2-ch6-t2', name: 'তদ্ধিত প্রত্যয় ও তদ্ধিতান্ত পদ (বাংলা, সংস্কৃত ও বিদেশি)', serial: 2 },
          { id: 'ssc-bangla-2-ch6-t3', name: 'শব্দ গঠনের নিয়ম ও অর্থ পরিবর্তন', serial: 3 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch7',
        name: 'শব্দ',
        topics: [
          { id: 'ssc-bangla-2-ch7-t1', name: 'উৎপত্তি অনুসারে শব্দের শ্রেণিবিভাগ (তৎসম, তদ্ভব, অর্ধ-তৎসম, দেশি, বিদেশি)', serial: 1 },
          { id: 'ssc-bangla-2-ch7-t2', name: 'গঠন অনুসারে শব্দ (মৌলিক ও সাধিত শব্দ)', serial: 2 },
          { id: 'ssc-bangla-2-ch7-t3', name: 'অর্থ অনুসারে শব্দ (যৌগিক, রূঢ়ি ও যোগরূঢ় শব্দ)', serial: 3 },
          { id: 'ssc-bangla-2-ch7-t4', name: 'দ্বিরুক্ত শব্দ ও অনুকার অব্যয়', serial: 4 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch8',
        name: 'পদ',
        topics: [
          { id: 'ssc-bangla-2-ch8-t1', name: 'বিশেষ্য পদ ও এর শ্রেণিবিভাগ', serial: 1 },
          { id: 'ssc-bangla-2-ch8-t2', name: 'বিশেষণ পদ ও এর রূপভেদ', serial: 2 },
          { id: 'ssc-bangla-2-ch8-t3', name: 'সর্বনাম পদ ও এর প্রয়োগ', serial: 3 },
          { id: 'ssc-bangla-2-ch8-t4', name: 'অব্যয় পদ ও এর শ্রেণিবিভাগ', serial: 4 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch9',
        name: 'ক্রিয়াপদ',
        topics: [
          { id: 'ssc-bangla-2-ch9-t1', name: 'সমাপিকা ও অসমাপিকা ক্রিয়া', serial: 1 },
          { id: 'ssc-bangla-2-ch9-t2', name: 'সকর্মক, অকর্মক ও দ্বিকর্মক ক্রিয়া', serial: 2 },
          { id: 'ssc-bangla-2-ch9-t3', name: 'প্রযোজক ক্রিয়া ও যৌগিক ক্রিয়া', serial: 3 },
          { id: 'ssc-bangla-2-ch9-t4', name: 'ধাতু ও এর শ্রেণিবিভাগ (মৌলিক, সাধিত, যৌগিক)', serial: 4 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch10',
        name: 'কারক',
        topics: [
          { id: 'ssc-bangla-2-ch10-t1', name: 'কর্তৃকারক ও কর্মকারক (বিভক্তিসহ নির্ণয়)', serial: 1 },
          { id: 'ssc-bangla-2-ch10-t2', name: 'করণ কারক ও সম্প্রদান কারক', serial: 2 },
          { id: 'ssc-bangla-2-ch10-t3', name: 'অপাদান কারক ও অধিকরণ কারক', serial: 3 },
          { id: 'ssc-bangla-2-ch10-t4', name: 'সম্বন্ধ পদ ও সম্বোধন পদ', serial: 4 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch11',
        name: 'বাক্য',
        topics: [
          { id: 'ssc-bangla-2-ch11-t1', name: 'একটি সার্থক বাক্যের গুণ (আকাঙ্ক্ষা, আসত্তি, যোগ্যতা)', serial: 1 },
          { id: 'ssc-bangla-2-ch11-t2', name: 'গঠন অনুসারে বাক্য (সরল, জটিল ও যৌগিক বাক্য)', serial: 2 },
          { id: 'ssc-bangla-2-ch11-t3', name: 'অর্থ অনুসারে বাক্য ও বাক্য রূপান্তর', serial: 3 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch12',
        name: 'বাচ্য',
        topics: [
          { id: 'ssc-bangla-2-ch12-t1', name: 'বাচ্য ও বাচ্যের প্রকারভেদ (কর্তৃবাচ্য, কর্মবাচ্য, ভাববাচ্য, কর্মকর্তৃবাচ্য)', serial: 1 },
          { id: 'ssc-bangla-2-ch12-t2', name: 'বাচ্য পরিবর্তন ও বাক্যের রূপান্তর', serial: 2 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch13',
        name: 'উক্তি',
        topics: [
          { id: 'ssc-bangla-2-ch13-t1', name: 'প্রত্যক্ষ উক্তি ও পরোক্ষ উক্তি', serial: 1 },
          { id: 'ssc-bangla-2-ch13-t2', name: 'উক্তি পরিবর্তনের সাধারণ ও বিশেষ নিয়ম', serial: 2 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch14',
        name: 'বাক্যের যোগ্যতা',
        topics: [
          { id: 'ssc-bangla-2-ch14-t1', name: 'গুরুচণ্ডালী দোষ ও পরিহারের নিয়ম', serial: 1 },
          { id: 'ssc-bangla-2-ch14-t2', name: 'বাগধারার ভুল প্রয়োগ ও শব্দব্যবহারের সতর্কতা', serial: 2 },
          { id: 'ssc-bangla-2-ch14-t3', name: 'উপমার ভুল প্রয়োগ ও বাহুল্য দোষ', serial: 3 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch15',
        name: 'বিরাম চিহ্ন',
        topics: [
          { id: 'ssc-bangla-2-ch15-t1', name: 'বিরাম চিহ্নের পরিচয়, ব্যবহার ও অবস্থান', serial: 1 },
          { id: 'ssc-bangla-2-ch15-t2', name: 'বিরাম চিহ্নের যতি ও থামার সময়সীমা', serial: 2 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch16',
        name: 'ভাষার অপপ্রয়োগ ও শুদ্ধ প্রয়োগ',
        topics: [
          { id: 'ssc-bangla-2-ch16-t1', name: 'বানান ও ধ্বনিগত অপপ্রয়োগ ও শুদ্ধিকরণ', serial: 1 },
          { id: 'ssc-bangla-2-ch16-t2', name: 'বচন ও প্রত্যয়জনিত অপপ্রয়োগ ও শুদ্ধিকরণ', serial: 2 },
          { id: 'ssc-bangla-2-ch16-t3', name: 'বাক্য শুদ্ধিকরণ (Board Question Based Corrections)', serial: 3 },
        ],
      },
      {
        id: 'ssc-bangla-2-ch17',
        name: 'নির্মিতি',
        topics: [
          { id: 'ssc-bangla-2-ch17-t1', name: 'পারিভাষিক শব্দ', serial: 1 },
          { id: 'ssc-bangla-2-ch17-t2', name: 'অনুবাদ (ইংরেজি থেকে বাংলা)', serial: 2 },
          { id: 'ssc-bangla-2-ch17-t3', name: 'প্রতিবেদন রচনা ও দিনলিপি লিখন', serial: 3 },
          { id: 'ssc-bangla-2-ch17-t4', name: 'ভাবসম্প্রসারণ ও সারাংশ/সারমর্ম', serial: 4 },
          { id: 'ssc-bangla-2-ch17-t5', name: 'আবেদনপত্র ও ব্যক্তিগত পত্র', serial: 5 },
        ],
      },
    ],
  },
  {
    id: 'ssc-english-1',
    name: 'SSC English 1st Paper',
    icon: BookOpen,
    group: 'General',
    chapters: [
      {
        id: 'ssc-english-1-ch1',
        name: 'People and Institutions',
        topics: [
          { id: 'ssc-english-1-ch1-t1', name: 'Unit 1: Good Citizens and Family Values', serial: 1 },
          { id: 'ssc-english-1-ch1-t2', name: 'Unit 1: Responsibilities, Rights and Social Ethics', serial: 2 },
          { id: 'ssc-english-1-ch1-t3', name: 'Unit 1: Youth and Community Service', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-1-ch2',
        name: 'Pastimes',
        topics: [
          { id: 'ssc-english-1-ch2-t1', name: 'Unit 2: Traditional and Modern Pastimes', serial: 1 },
          { id: 'ssc-english-1-ch2-t2', name: 'Unit 2: Physical Fitness, Sports and Yoga', serial: 2 },
          { id: 'ssc-english-1-ch2-t3', name: 'Unit 2: Digital Era Hobbies and Gaming', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-1-ch3',
        name: 'Events and Festivals',
        topics: [
          { id: 'ssc-english-1-ch3-t1', name: 'Unit 3: International Mother Language Day (21st February)', serial: 1 },
          { id: 'ssc-english-1-ch3-t2', name: 'Unit 3: Independence Day and Victory Day of Bangladesh', serial: 2 },
          { id: 'ssc-english-1-ch3-t3', name: 'Unit 3: Pahela Baishakh and Traditional Cultural Festivals', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-1-ch4',
        name: 'Are we aware?',
        topics: [
          { id: 'ssc-english-1-ch4-t1', name: 'Unit 4: Environmental Awareness and Tree Plantation', serial: 1 },
          { id: 'ssc-english-1-ch4-t2', name: 'Unit 4: Public Health, Sanitation and Safe Water', serial: 2 },
          { id: 'ssc-english-1-ch4-t3', name: 'Unit 4: Traffic Rules and Road Safety', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-1-ch5',
        name: 'Nature and Environment',
        topics: [
          { id: 'ssc-english-1-ch5-t1', name: 'Unit 5: Climate Change and Global Warming', serial: 1 },
          { id: 'ssc-english-1-ch5-t2', name: 'Unit 5: Deforestation, Floods and Natural Disasters', serial: 2 },
          { id: 'ssc-english-1-ch5-t3', name: 'Unit 5: River Erosion and Environmental Pollution', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-1-ch6',
        name: 'Our Neighbours',
        topics: [
          { id: 'ssc-english-1-ch6-t1', name: 'Unit 6: South Asian Neighbours (India, Nepal, Bhutan)', serial: 1 },
          { id: 'ssc-english-1-ch6-t2', name: 'Unit 6: Sri Lanka and Maldives (Geography and Culture)', serial: 2 },
          { id: 'ssc-english-1-ch6-t3', name: 'Unit 6: Regional Cooperation and SAARC', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-1-ch7',
        name: 'People who stand out',
        topics: [
          { id: 'ssc-english-1-ch7-t1', name: 'Unit 7: Zainul Abedin - Great Art Master', serial: 1 },
          { id: 'ssc-english-1-ch7-t2', name: 'Unit 7: Begum Rokeya and Women Education Pioneers', serial: 2 },
          { id: 'ssc-english-1-ch7-t3', name: 'Unit 7: Mother Teresa and Philanthropy', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-1-ch8',
        name: 'World Heritage',
        topics: [
          { id: 'ssc-english-1-ch8-t1', name: 'Unit 8: The Shat Gombuj Mosque', serial: 1 },
          { id: 'ssc-english-1-ch8-t2', name: 'Unit 8: The Sundarbans - Biodiversity and Mangrove Heritage', serial: 2 },
          { id: 'ssc-english-1-ch8-t3', name: 'Unit 8: Somapura Mahavihara and Ancient Monuments', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-1-ch9',
        name: 'Unconventional Jobs',
        topics: [
          { id: 'ssc-english-1-ch9-t1', name: 'Unit 9: Unconventional Vocations and Creative Careers', serial: 1 },
          { id: 'ssc-english-1-ch9-t2', name: 'Unit 9: Self-employment, Freelancing and Entrepreneurship', serial: 2 },
        ],
      },
      {
        id: 'ssc-english-1-ch10',
        name: 'Dreams',
        topics: [
          { id: 'ssc-english-1-ch10-t1', name: 'Unit 10: I Have a Dream - Martin Luther King Jr.', serial: 1 },
          { id: 'ssc-english-1-ch10-t2', name: 'Unit 10: Youth Aspirations and Achieving Future Dreams', serial: 2 },
        ],
      },
      {
        id: 'ssc-english-1-ch11',
        name: 'Renewable Energy',
        topics: [
          { id: 'ssc-english-1-ch11-t1', name: 'Unit 11: Renewable vs Non-renewable Energy Sources', serial: 1 },
          { id: 'ssc-english-1-ch11-t2', name: 'Unit 11: Solar Power, Wind Energy and Future Clean Fuel', serial: 2 },
        ],
      },
      {
        id: 'ssc-english-1-ch12',
        name: 'Roots',
        topics: [
          { id: 'ssc-english-1-ch12-t1', name: 'Unit 12: Concept of Root, Village Belonging and Heritage', serial: 1 },
          { id: 'ssc-english-1-ch12-t2', name: 'Unit 12: Migration, Urbanization and Alienation', serial: 2 },
        ],
      },
      {
        id: 'ssc-english-1-ch13',
        name: 'Media and Modes of E-communication',
        topics: [
          { id: 'ssc-english-1-ch13-t1', name: 'Unit 13: Mass Media, Television and Radio', serial: 1 },
          { id: 'ssc-english-1-ch13-t2', name: 'Unit 13: Internet, Social Networks and Digital Literacy', serial: 2 },
        ],
      },
      {
        id: 'ssc-english-1-ch14',
        name: 'Bangladeshi Cuisine',
        topics: [
          { id: 'ssc-english-1-ch14-t1', name: 'Unit 14: Traditional Bangladeshi Cuisine, Spices and Sweets', serial: 1 },
          { id: 'ssc-english-1-ch14-t2', name: 'Unit 14: Hospitality, Food Culture and Seasonal Dishes', serial: 2 },
        ],
      },
    ],
  },
  {
    id: 'ssc-english-2',
    name: 'SSC English 2nd Paper',
    icon: BookOpen,
    group: 'General',
    chapters: [
      {
        id: 'ssc-english-2-ch1',
        name: 'Gap filling activities with prepositions',
        topics: [
          { id: 'ssc-english-2-ch1-t1', name: 'Appropriate Prepositions (Board Standard)', serial: 1 },
          { id: 'ssc-english-2-ch1-t2', name: 'Prepositions of Place, Time and Direction', serial: 2 },
          { id: 'ssc-english-2-ch1-t3', name: 'Phrasal Verbs & Dependent Prepositions', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-2-ch2',
        name: 'Gap filling activities without clues',
        topics: [
          { id: 'ssc-english-2-ch2-t1', name: 'Contextual Article Usage (A, An, The, Cross)', serial: 1 },
          { id: 'ssc-english-2-ch2-t2', name: 'Parts of Speech Transformation for Clueless Cloze', serial: 2 },
          { id: 'ssc-english-2-ch2-t3', name: 'Determiners, Quantifiers and Pronoun References', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-2-ch3',
        name: 'Substitution table',
        topics: [
          { id: 'ssc-english-2-ch3-t1', name: 'Sentence Synthesis from Grid Matrix', serial: 1 },
          { id: 'ssc-english-2-ch3-t2', name: 'Subject-Verb Concord Alignment in Tables', serial: 2 },
          { id: 'ssc-english-2-ch3-t3', name: 'Complex and Compound Sentences from Tables', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-2-ch4',
        name: 'Right forms of verbs',
        topics: [
          { id: 'ssc-english-2-ch4-t1', name: 'Subject-Verb Agreement Rules', serial: 1 },
          { id: 'ssc-english-2-ch4-t2', name: 'Tense-based Verb Conjugations (Present, Past, Future)', serial: 2 },
          { id: 'ssc-english-2-ch4-t3', name: 'Modal Auxiliaries, Causatives & Subjunctives', serial: 3 },
          { id: 'ssc-english-2-ch4-t4', name: 'Gerund, Participle, Infinitive & Passive Verb Forms', serial: 4 },
        ],
      },
      {
        id: 'ssc-english-2-ch5',
        name: 'Narrative style',
        topics: [
          { id: 'ssc-english-2-ch5-t1', name: 'Direct to Indirect Speech Rules for Assertive & Interrogative', serial: 1 },
          { id: 'ssc-english-2-ch5-t2', name: 'Imperative, Optative & Exclamatory Sentences in Passage Narration', serial: 2 },
          { id: 'ssc-english-2-ch5-t3', name: 'Passage Narration Conversion Techniques & Pronoun Adjustments', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-2-ch6',
        name: 'Changing sentences',
        topics: [
          { id: 'ssc-english-2-ch6-t1', name: 'Transformation: Affirmative, Negative, Interrogative, Exclamatory', serial: 1 },
          { id: 'ssc-english-2-ch6-t2', name: 'Voice Change: Active to Passive and Vice Versa', serial: 2 },
          { id: 'ssc-english-2-ch6-t3', name: 'Degree of Comparison: Positive, Comparative, Superlative', serial: 3 },
          { id: 'ssc-english-2-ch6-t4', name: 'Sentence Structure: Simple, Complex, Compound', serial: 4 },
        ],
      },
      {
        id: 'ssc-english-2-ch7',
        name: 'Completing sentences',
        topics: [
          { id: 'ssc-english-2-ch7-t1', name: 'Conditional Sentences (Zero, 1st, 2nd, 3rd Conditionals)', serial: 1 },
          { id: 'ssc-english-2-ch7-t2', name: 'Clauses with \'So that\', \'In order that\', \'Lest\', \'Provided that\'', serial: 2 },
          { id: 'ssc-english-2-ch7-t3', name: 'Clauses with \'As if\', \'As though\', \'It is high time\', \'Wish/Fancy\'', serial: 3 },
          { id: 'ssc-english-2-ch7-t4', name: 'Proverbs and Common Idiomatic Expressions', serial: 4 },
        ],
      },
      {
        id: 'ssc-english-2-ch8',
        name: 'Use of suffix and prefix',
        topics: [
          { id: 'ssc-english-2-ch8-t1', name: 'Noun, Adjective, Verb and Adverb Word Formations', serial: 1 },
          { id: 'ssc-english-2-ch8-t2', name: 'Affixes for Opposites, Negation and Degree', serial: 2 },
          { id: 'ssc-english-2-ch8-t3', name: 'Contextual Suffix-Prefix Passage Practices', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-2-ch9',
        name: 'Tag questions',
        topics: [
          { id: 'ssc-english-2-ch9-t1', name: 'Basic Rules of Positive & Negative Tag Questions', serial: 1 },
          { id: 'ssc-english-2-ch9-t2', name: 'Imperative, Suggestive (\'Let\'s\') & Indefinite Pronoun Tags', serial: 2 },
          { id: 'ssc-english-2-ch9-t3', name: 'Tricky Tags (\'Hardly\', \'Scarcely\', \'Neither\', \'None\')', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-2-ch10',
        name: 'Sentence connectors',
        topics: [
          { id: 'ssc-english-2-ch10-t1', name: 'Connectors of Contrast, Addition & Condition', serial: 1 },
          { id: 'ssc-english-2-ch10-t2', name: 'Connectors of Cause, Effect & Conclusion', serial: 2 },
          { id: 'ssc-english-2-ch10-t3', name: 'Chronological & Illustrative Connectors in Paragraphs', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-2-ch11',
        name: 'Punctuation',
        topics: [
          { id: 'ssc-english-2-ch11-t1', name: 'Capitalization Rules & Proper Nouns', serial: 1 },
          { id: 'ssc-english-2-ch11-t2', name: 'Comma, Semicolon, Colon, Quotation Marks & Apostrophe', serial: 2 },
          { id: 'ssc-english-2-ch11-t3', name: 'Passage Punctuation & Dialogue Formatting', serial: 3 },
        ],
      },
      {
        id: 'ssc-english-2-ch12',
        name: 'Writing CV with cover letter',
        topics: [
          { id: 'ssc-english-2-ch12-t1', name: 'Formal Job Application Cover Letter Format', serial: 1 },
          { id: 'ssc-english-2-ch12-t2', name: 'Standard Curriculum Vitae Structure & Key Sections', serial: 2 },
        ],
      },
      {
        id: 'ssc-english-2-ch13',
        name: 'Formal letters',
        topics: [
          { id: 'ssc-english-2-ch13-t1', name: 'Applications to Principal/Headmaster', serial: 1 },
          { id: 'ssc-english-2-ch13-t2', name: 'Official Letters, Complaint Letters & Inquiries', serial: 2 },
        ],
      },
      {
        id: 'ssc-english-2-ch14',
        name: 'Writing paragraphs',
        topics: [
          { id: 'ssc-english-2-ch14-t1', name: 'Descriptive & Narrative Paragraph Writing', serial: 1 },
          { id: 'ssc-english-2-ch14-t2', name: 'Cause and Effect & Problem-Solution Paragraphs', serial: 2 },
        ],
      },
      {
        id: 'ssc-english-2-ch15',
        name: 'Writing compositions',
        topics: [
          { id: 'ssc-english-2-ch15-t1', name: 'Expository & Reflective Essay Formats', serial: 1 },
          { id: 'ssc-english-2-ch15-t2', name: 'Science, Technology & National Heritage Compositions', serial: 2 },
        ],
      },
    ],
  },
  {
    id: 'ssc-math',
    name: 'SSC গণিত',
    icon: Sigma,
    group: 'General',
    chapters: [
      {
        id: 'ssc-math-ch1',
        name: 'বাস্তব সংখ্যা',
        topics: [
          { id: 'ssc-math-ch1-t1', name: 'স্বাভাবিক সংখ্যা, পূর্ণসংখ্যা, ভগ্নাংশ ও মূলদ-অমূলদ সংখ্যা', serial: 1 },
          { id: 'ssc-math-ch1-t2', name: 'আবৃত দশমিক ভগ্নাংশ ও সাধারণ ভগ্নাংশে রূপান্তর', serial: 2 },
          { id: 'ssc-math-ch1-t3', name: 'অমূলদ সংখ্যা প্রমাণ (যেমন $\sqrt{2}, \sqrt{3}$)', serial: 3 },
          { id: 'ssc-math-ch1-t4', name: 'বাস্তব সংখ্যার যোগ, বিয়োগ, গুণ, ভাগ ও আসন্ন মান', serial: 4 },
        ],
      },
      {
        id: 'ssc-math-ch2',
        name: 'সেট ও ফাংশন',
        topics: [
          { id: 'ssc-math-ch2-t1', name: 'সেট প্রকাশের পদ্ধতি (তালিকা ও সেট গঠন পদ্ধতি)', serial: 1 },
          { id: 'ssc-math-ch2-t2', name: 'সেটের প্রকারভেদ (উপসেট, সার্বিক সেট, ফাঁকা সেট, পূরক সেট)', serial: 2 },
          { id: 'ssc-math-ch2-t3', name: 'সংযোগ সেট, ছেদ সেট, অন্তর সেট ও ভেনচিত্র', serial: 3 },
          { id: 'ssc-math-ch2-t4', name: 'শক্তি সেট (Power Set) ও ক্রমজোড়-কার্তেসীয় গুণজ', serial: 4 },
          { id: 'ssc-math-ch2-t5', name: 'ফাংশন, ডোমেন ও রেঞ্জ নির্ণয়', serial: 5 },
        ],
      },
      {
        id: 'ssc-math-ch3',
        name: 'বীজগাণিতিক রাশি',
        topics: [
          { id: 'ssc-math-ch3-t1', name: 'বর্গ সম্পর্কিত সূত্রাবলী ও মান নির্ণয়', serial: 1 },
          { id: 'ssc-math-ch3-t2', name: 'ঘন সম্পর্কিত সূত্রাবলী ও মান নির্ণয়', serial: 2 },
          { id: 'ssc-math-ch3-t3', name: 'উৎপাদকে বিশ্লেষণ (ভাগশেষ উপপাদ্য ও মধ্যপদ বিভাজন)', serial: 3 },
          { id: 'ssc-math-ch3-t4', name: 'বীজগাণিতিক ভগ্নাংশের সরলীকরণ ও গ.সা.গু./ল.সা.গু.', serial: 4 },
        ],
      },
      {
        id: 'ssc-math-ch4',
        name: 'সূচক ও লগারিদম',
        topics: [
          { id: 'ssc-math-ch4-t1', name: 'সূচকের মৌলিক নিয়মাবলী ও সরলীকরণ ($a^m \cdot a^n, (a^m)^n$)', serial: 1 },
          { id: 'ssc-math-ch4-t2', name: 'লগারিদমের ভিত্তি ও মৌলিক সূত্রাবলী', serial: 2 },
          { id: 'ssc-math-ch4-t3', name: 'লগারিদমের মান নির্ণয় ও প্রমাণ', serial: 3 },
          { id: 'ssc-math-ch4-t4', name: 'বৈজ্ঞানিক বা আদর্শ রূপ ও লগারিদমের পূর্ণক ও অংশক', serial: 4 },
        ],
      },
      {
        id: 'ssc-math-ch5',
        name: 'এক চলকবিশিষ্ট সমীকরণ',
        topics: [
          { id: 'ssc-math-ch5-t1', name: 'সমীকরণ ও অভেদ এর পার্থক্য', serial: 1 },
          { id: 'ssc-math-ch5-t2', name: 'এক চলকবিশিষ্ট সরল সমীকরণ সমাধান', serial: 2 },
          { id: 'ssc-math-ch5-t3', name: 'এক ঘাত ও দ্বিঘাত সমীকরণ সমাধান ($ax^2+bx+c=0$)', serial: 3 },
          { id: 'ssc-math-ch5-t4', name: 'বাস্তবভিত্তিক সমীকরণ গঠন ও সমাধান', serial: 4 },
        ],
      },
      {
        id: 'ssc-math-ch6',
        name: 'রেখা, কোণ ও ত্রিভুজ',
        topics: [
          { id: 'ssc-math-ch6-t1', name: 'রেখা, রশ্মি, রেখাংশ ও সন্নিহিত কোণ, বিপ্রতীপ কোণ', serial: 1 },
          { id: 'ssc-math-ch6-t2', name: 'ত্রিভুজের প্রকারভেদ ও ত্রিভুজ সংক্রান্ত মৌলিক উপপাদ্য', serial: 2 },
          { id: 'ssc-math-ch6-t3', name: 'ত্রিভুজের সর্বসমতা ও সদৃশতা', serial: 3 },
          { id: 'ssc-math-ch6-t4', name: 'পিথাগোরাসের উপপাদ্য ও এর ব্যবহার', serial: 4 },
        ],
      },
      {
        id: 'ssc-math-ch7',
        name: 'ব্যবহারিক জ্যামিতি',
        topics: [
          { id: 'ssc-math-ch7-t1', name: 'ত্রিভুজ সংক্রান্ত সম্পাদ্য (বাহু ও কোণ দেওয়া থাকলে ত্রিভুজ অঙ্কন)', serial: 1 },
          { id: 'ssc-math-ch7-t2', name: 'চতুর্ভুজ ও সামান্তরিক সংক্রান্ত সম্পাদ্য', serial: 2 },
          { id: 'ssc-math-ch7-t3', name: 'বর্গ, রম্বস ও ট্রাপিজিয়াম অঙ্কন', serial: 3 },
        ],
      },
      {
        id: 'ssc-math-ch8',
        name: 'বৃত্ত',
        topics: [
          { id: 'ssc-math-ch8-t1', name: 'বৃত্তের কেন্দ্র, ব্যাস, জ্যা ও পরিধি সংক্রান্ত উপপাদ্য', serial: 1 },
          { id: 'ssc-math-ch8-t2', name: 'বৃত্তস্থ কোণ ও কেন্দ্রস্থ কোণের সম্পর্ক', serial: 2 },
          { id: 'ssc-math-ch8-t3', name: 'বৃত্তে অন্তর্লিখিত চতুর্ভুজ ও স্পর্শক সংক্রান্ত উপপাদ্য', serial: 3 },
          { id: 'ssc-math-ch8-t4', name: 'বৃত্ত সংক্রান্ত সম্পাদ্য (পরিবৃত্ত, অন্তর্বৃত্ত ও বহির্বৃত্ত অঙ্কন)', serial: 4 },
        ],
      },
      {
        id: 'ssc-math-ch9',
        name: 'ত্রিকোণমিতিক অনুপাত',
        topics: [
          { id: 'ssc-math-ch9-t1', name: 'সমকোণী ত্রিভুজের বাহু ও সূক্ষ্মকোণের ত্রিকোণমিতিক অনুপাত', serial: 1 },
          { id: 'ssc-math-ch9-t2', name: 'মৌলিক ত্রিকোণমিতিক অভেদাবলী ($\sin^2\theta + \cos^2\theta = 1$ ইত্যাদি)', serial: 2 },
          { id: 'ssc-math-ch9-t3', name: '$0^\circ, 30^\circ, 45^\circ, 60^\circ, 90^\circ$ কোণের ত্রিকোণমিতিক মান', serial: 3 },
          { id: 'ssc-math-ch9-t4', name: 'ত্রিকোণমিতিক সমীকরণ ও অভেদ প্রমাণ', serial: 4 },
        ],
      },
      {
        id: 'ssc-math-ch10',
        name: 'দূরত্ব ও উচ্চতা',
        topics: [
          { id: 'ssc-math-ch10-t1', name: 'উন্নতি কোণ ও অবনতি কোণ এর ধারণা', serial: 1 },
          { id: 'ssc-math-ch10-t2', name: 'সমকোণী ত্রিভুজ ব্যবহার করে উচ্চতা ও দূরত্ব নির্ণয়', serial: 2 },
          { id: 'ssc-math-ch10-t3', name: 'বাস্তবভিত্তিক সমস্যা সমাধান (টাওয়ার, গাছ ও নদীর বিস্তার)', serial: 3 },
        ],
      },
      {
        id: 'ssc-math-ch11',
        name: 'বীজগাণিতিক অনুপাত ও সমানুপাত',
        topics: [
          { id: 'ssc-math-ch11-t1', name: 'অনুপাত ও সমানুপাতের প্রাথমিক ধারণা ও ধর্মাবলী', serial: 1 },
          { id: 'ssc-math-ch11-t2', name: 'যোজন-বিয়োজন, একান্তরকরণ ও ব্যস্তকরণ', serial: 2 },
          { id: 'ssc-math-ch11-t3', name: 'ক্রমিক সমানুপাত ও গাণিতিক সমস্যা সমাধান', serial: 3 },
        ],
      },
      {
        id: 'ssc-math-ch12',
        name: 'দুই চলকবিশিষ্ট সরল সহসমীকরণ',
        topics: [
          { id: 'ssc-math-ch12-t1', name: 'সহসমীকরণের সঙ্গতি, নির্ভরশীলতা ও সমাধান যোগ্যতা যাচাই', serial: 1 },
          { id: 'ssc-math-ch12-t2', name: 'প্রতিস্থাপন ও অপনয়ন পদ্ধতিতে সমাধান', serial: 2 },
          { id: 'ssc-math-ch12-t3', name: 'আড়গুণন (বজ্রগুণন) পদ্ধতি ও লেখচিত্রের সাহায্যে সমাধান', serial: 3 },
          { id: 'ssc-math-ch12-t4', name: 'বাস্তবভিত্তিক দ্বি-চলক সমস্যা ও সমীকরণ গঠন', serial: 4 },
        ],
      },
      {
        id: 'ssc-math-ch13',
        name: 'সসীম ধারা',
        topics: [
          { id: 'ssc-math-ch13-t1', name: 'অনুক্রম ও ধারার প্রাথমিক ধারণা', serial: 1 },
          { id: 'ssc-math-ch13-t2', name: 'সমান্তর ধারা ($n$-তম পদ ও প্রথম $n$ পদের সমষ্টি)', serial: 2 },
          { id: 'ssc-math-ch13-t3', name: 'গুণোত্তর ধারা ($n$-তম পদ ও প্রথম $n$ পদের সমষ্টি)', serial: 3 },
          { id: 'ssc-math-ch13-t4', name: 'স্বাভাবিক সংখ্যার সমষ্টি, বর্গের সমষ্টি ও ঘনের সমষ্টির সূত্র', serial: 4 },
        ],
      },
      {
        id: 'ssc-math-ch14',
        name: 'অনুপাত, সদৃশতা ও প্রতিসমতা',
        topics: [
          { id: 'ssc-math-ch14-t1', name: 'রেখাংশের অনুপাত ও ত্রিভুজের সদৃশকোণী উপপাদ্য', serial: 1 },
          { id: 'ssc-math-ch14-t2', name: 'সদৃশ ত্রিভুজ ও ক্ষেত্রফলের অনুপাত', serial: 2 },
          { id: 'ssc-math-ch14-t3', name: 'রৈখিক প্রতিসমতা ও ঘূর্ণন প্রতিসমতা', serial: 3 },
        ],
      },
      {
        id: 'ssc-math-ch15',
        name: 'ক্ষেত্রফল সম্পর্কিত উপপাদ্য ও সম্পাদ্য',
        topics: [
          { id: 'ssc-math-ch15-t1', name: 'সামান্তরিক ও ত্রিভুজক্ষেত্রের ক্ষেত্রফল সংক্রান্ত উপপাদ্য', serial: 1 },
          { id: 'ssc-math-ch15-t2', name: 'সমান ক্ষেত্রফলবিশিষ্ট ত্রিভুজ ও চতুর্ভুজ অঙ্কনের সম্পাদ্য', serial: 2 },
        ],
      },
      {
        id: 'ssc-math-ch16',
        name: 'পরিমিতি',
        topics: [
          { id: 'ssc-math-ch16-t1', name: 'ত্রিভুজক্ষেত্রের ক্ষেত্রফল (সাধারণ, সমকোণী, সমদ্বিবাহু, সমবাহু)', serial: 1 },
          { id: 'ssc-math-ch16-t2', name: 'চতুর্ভুজক্ষেত্রের ক্ষেত্রফল (আয়ত, বর্গ, সামান্তরিক, রম্বস, ট্রাপিজিয়াম)', serial: 2 },
          { id: 'ssc-math-ch16-t3', name: 'বৃত্ত সংক্রান্ত পরিমিতি (পরিধি, বৃত্তাংশের দৈর্ঘ্য ও বৃত্তকলার ক্ষেত্রফল)', serial: 3 },
          { id: 'ssc-math-ch16-t4', name: 'ঘনবস্তুর সমগ্রতলের ক্ষেত্রফল ও আয়তন (আয়তাকার ঘনবস্তু, ঘনক ও বেলন)', serial: 4 },
        ],
      },
      {
        id: 'ssc-math-ch17',
        name: 'পরিসংখ্যাও',
        topics: [
          { id: 'ssc-math-ch17-t1', name: 'অবিন্যস্ত ও বিন্যস্ত উপাত্ত, গণসংখ্যা নিবেশন সারণি তৈরি', serial: 1 },
          { id: 'ssc-math-ch17-t2', name: 'গড় (প্রত্যক্ষ ও সংক্ষিপ্ত পদ্ধতি)', serial: 2 },
          { id: 'ssc-math-ch17-t3', name: 'মধ্যক ও প্রচুরক নির্ণয়', serial: 3 },
          { id: 'ssc-math-ch17-t4', name: 'আয়তলেখ, গণসংখ্যা বহুভুজ ও অজিভ রেখা অঙ্কন', serial: 4 },
        ],
      },
    ],
  },
  {
    id: 'ssc-bgs',
    name: 'SSC বাংলাদেশ ও বিশ্বপরিচয়',
    icon: Globe,
    group: 'General',
    chapters: [
      {
        id: 'ssc-bgs-ch1',
        name: 'পূর্ব বাংলার আন্দোলন ও জাতীয়তাবাদের উথান',
        topics: [
          { id: 'ssc-bgs-ch1-t1', name: '১৯৪৮-১৯৫২ এর ভাষা আন্দোলন ও পটভূমি', serial: 1 },
          { id: 'ssc-bgs-ch1-t2', name: 'যুক্তফ্রন্ট গঠন ও ১৯৫৪ সালের নির্বাচন', serial: 2 },
          { id: 'ssc-bgs-ch1-t3', name: '১৯৫৮ এর সামরিক শাসন ও ছয় দফা আন্দোলন (১৯৬৬)', serial: 3 },
          { id: 'ssc-bgs-ch1-t4', name: '১৯৬৯ এর গণঅভ্যুত্থান ও ১১ দফা কর্মসূচি', serial: 4 },
        ],
      },
      {
        id: 'ssc-bgs-ch2',
        name: 'স্বাধীন বাংলাদেশ',
        topics: [
          { id: 'ssc-bgs-ch2-t1', name: '১৯৭০ সালের সাধারণ নির্বাচন ও ফলাফল', serial: 1 },
          { id: 'ssc-bgs-ch2-t2', name: '১৯৭১ সালের অসহযোগ আন্দোলন ও ৭ই মার্চের ঐতিহাসিক ভাষণ', serial: 2 },
          { id: 'ssc-bgs-ch2-t3', name: '২৫শে মার্চের কালরাত ও গণহত্যা', serial: 3 },
          { id: 'ssc-bgs-ch2-t4', name: 'মুজিবনগর সরকার গঠন ও মুক্তিযুদ্ধ পরিচালনা', serial: 4 },
          { id: 'ssc-bgs-ch2-t5', name: 'মুক্তিবাহিনীর বীরত্ব ও ১৬ই ডিসেম্বরের চূড়ান্ত বিজয়', serial: 5 },
        ],
      },
      {
        id: 'ssc-bgs-ch3',
        name: 'সৌরজগত ও ভূমণ্ডল',
        topics: [
          { id: 'ssc-bgs-ch3-t1', name: 'সৌরজগতের গ্রহসমূহ ও বৈশিষ্ট্য', serial: 1 },
          { id: 'ssc-bgs-ch3-t2', name: 'পৃথিবীর গতি (আহ্নিক গতি ও বার্ষিক গতি) এবং দিন-রাত্রি ও ঋতু পরিবর্তন', serial: 2 },
          { id: 'ssc-bgs-ch3-t3', name: 'অক্ষরেখা, দ্রাঘিমারেখা ও আন্তর্জাতিক তারিখ রেখা ও সময় গণনা', serial: 3 },
        ],
      },
      {
        id: 'ssc-bgs-ch4',
        name: 'বাংলাদেশের ভূপ্রকৃতি ও জলবায়ু',
        topics: [
          { id: 'ssc-bgs-ch4-t1', name: 'বাংলাদেশের ভূপ্রাকৃতিক অঞ্চল (টারশিয়ারি পাহাড়, প্লাইস্টোসিন সোপান, সাম্প্রতিক প্লাবনভূমি)', serial: 1 },
          { id: 'ssc-bgs-ch4-t2', name: 'বাংলাদেশের জলবায়ু, মৌসুমি বায়ু ও ঋতু বৈচিত্র্য', serial: 2 },
          { id: 'ssc-bgs-ch4-t3', name: 'ভূমিকম্প ও প্রাকৃতিক বিপর্যয় ঝুঁকি', serial: 3 },
        ],
      },
      {
        id: 'ssc-bgs-ch5',
        name: 'বাংলাদেশের নদনদী ও প্রাকৃতিক সম্পদ',
        topics: [
          { id: 'ssc-bgs-ch5-t1', name: 'প্রধান নদনদী ও নদীর অর্থনৈতিক গুরুত্ব', serial: 1 },
          { id: 'ssc-bgs-ch5-t2', name: 'পানি সম্পদ ব্যবস্থাপনা ও নদীর নাব্য সংকট', serial: 2 },
          { id: 'ssc-bgs-ch5-t3', name: 'বনজ, খনিজ ও শক্তি সম্পদ', serial: 3 },
        ],
      },
      {
        id: 'ssc-bgs-ch6',
        name: 'রাষ্ট্র, নাগরিকতা ও আইন',
        topics: [
          { id: 'ssc-bgs-ch6-t1', name: 'রাষ্ট্রের উপাদান ও রাষ্ট্র গঠনের উৎপত্তি মতবাদ', serial: 1 },
          { id: 'ssc-bgs-ch6-t2', name: 'নাগরিকতার ধারণা, অর্জনের উপায় ও সুনাগরিকের গুণাবলী', serial: 2 },
          { id: 'ssc-bgs-ch6-t3', name: 'আইনের উৎস, আইনের শাসন ও মানবাধিকার', serial: 3 },
        ],
      },
      {
        id: 'ssc-bgs-ch7',
        name: 'বাংলাদেশ সরকারের বিভিন্ন অঙ্গ ও প্রশাসন ব্যবস্থা',
        topics: [
          { id: 'ssc-bgs-ch7-t1', name: 'আইন বিভাগ (জাতীয় সংসদ ও আইন প্রণয়ন পদ্ধতি)', serial: 1 },
          { id: 'ssc-bgs-ch7-t2', name: 'শাসন বিভাগ (রাষ্ট্রপতি, প্রধানমন্ত্রী ও মন্ত্রিসভা)', serial: 2 },
          { id: 'ssc-bgs-ch7-t3', name: 'বিচার বিভাগ (সুপ্রিম কোর্ট ও অধস্তন আদালত)', serial: 3 },
          { id: 'ssc-bgs-ch7-t4', name: 'প্রশাসনিক কাঠামো ও আমলাতন্ত্র', serial: 4 },
        ],
      },
      {
        id: 'ssc-bgs-ch8',
        name: 'বাংলাদেশের গণতন্ত্র ও নির্বাচন',
        topics: [
          { id: 'ssc-bgs-ch8-t1', name: 'গণতন্ত্রের রূপ ও মৌলিক নীতিমালা', serial: 1 },
          { id: 'ssc-bgs-ch8-t2', name: 'নির্বাচন কমিশন গঠন ও কার্যাবলী', serial: 2 },
          { id: 'ssc-bgs-ch8-t3', name: 'ভোটাধিকার ও নির্বাচন প্রক্রিয়া', serial: 3 },
        ],
      },
      {
        id: 'ssc-bgs-ch9',
        name: 'জাতিসংঘ ও বাংলাদেশ',
        topics: [
          { id: 'ssc-bgs-ch9-t1', name: 'জাতিসংঘ প্রতিষ্ঠার পটভূমি ও উদ্দেশ্য', serial: 1 },
          { id: 'ssc-bgs-ch9-t2', name: 'জাতিসংঘের প্রধান অঙ্গসংগঠনসমূহ', serial: 2 },
          { id: 'ssc-bgs-ch9-t3', name: 'জাতিসংঘের শান্তি রক্ষা কার্যক্রমে বাংলাদেশের অবদান', serial: 3 },
        ],
      },
      {
        id: 'ssc-bgs-ch10',
        name: 'জাতীয় সম্পদ ও অর্থনৈতিক ব্যবস্থা',
        topics: [
          { id: 'ssc-bgs-ch10-t1', name: 'জাতীয় সম্পদের ধারণা ও সংরক্ষণ', serial: 1 },
          { id: 'ssc-bgs-ch10-t2', name: 'বিভিন্ন অর্থনৈতিক ব্যবস্থা (ধনতান্ত্রিক, সমাজতান্ত্রিক, মিশ্র ও ইসলামিক অর্থনীতি)', serial: 2 },
        ],
      },
      {
        id: 'ssc-bgs-ch11',
        name: 'অর্থনৈতিক নির্দেশকসমূহ ও বাংলাদেশের অর্থনীতির প্রকৃতি',
        topics: [
          { id: 'ssc-bgs-ch11-t1', name: 'মোট দেশজ উৎপাদন (GDP), মোট জাতীয় আয় (GNI) ও মাথাপিছু আয়', serial: 1 },
          { id: 'ssc-bgs-ch11-t2', name: 'বাংলাদেশের অর্থনীতির প্রধান খাতসমূহ (কৃষি, শিল্প, সেবা)', serial: 2 },
        ],
      },
      {
        id: 'ssc-bgs-ch12',
        name: 'বাংলাদেশ সরকারের অর্থ ও ব্যাংক ব্যবস্থা',
        topics: [
          { id: 'ssc-bgs-ch12-t1', name: 'সরকারের আয়ের উৎস ও ব্যয়ের খাতসমূহ', serial: 1 },
          { id: 'ssc-bgs-ch12-t2', name: 'কেন্দ্রীয় ব্যাংক (বাংলাদেশ ব্যাংক) ও বাণিজ্যিক ব্যাংক ব্যবস্থা', serial: 2 },
          { id: 'ssc-bgs-ch12-t3', name: 'মুদ্রাস্ফীতি নিয়ন্ত্রণ ও ঋণনীতি', serial: 3 },
        ],
      },
      {
        id: 'ssc-bgs-ch13',
        name: 'বাংলাদেশের উন্নয়ন ও সরকারের ভূমিকা',
        topics: [
          { id: 'ssc-bgs-ch13-t1', name: 'টেকসই উন্নয়ন লক্ষ্যমাত্রা (SDG) ও ভিশন পরিকল্পনা', serial: 1 },
          { id: 'ssc-bgs-ch13-t2', name: 'অবকাঠামো উন্নয়ন (পদ্মা সেতু, মেট্রোরেল ইত্যাদি)', serial: 2 },
          { id: 'ssc-bgs-ch13-t3', name: 'ডিজিটাল বাংলাদেশ ও মানবসম্পদ উন্নয়ন', serial: 3 },
        ],
      },
      {
        id: 'ssc-bgs-ch14',
        name: 'পারিবারিক কাঠামো ও সামাজিকীকরণ',
        topics: [
          { id: 'ssc-bgs-ch14-t1', name: 'পরিবারের প্রকারভেদ ও পরিবারের কার্যাবলী', serial: 1 },
          { id: 'ssc-bgs-ch14-t2', name: 'সামাজিকীকরণ প্রক্রিয়া ও বিভিন্ন সামাজিক প্রতিষ্ঠানের ভূমিকা', serial: 2 },
        ],
      },
      {
        id: 'ssc-bgs-ch15',
        name: 'বাংলাদেশের সামাজিক পরিবর্তন',
        topics: [
          { id: 'ssc-bgs-ch15-t1', name: 'সামাজিক পরিবর্তনের উপাদান (শিল্পায়ন, নগরায়ণ, শিক্ষা)', serial: 1 },
          { id: 'ssc-bgs-ch15-t2', name: 'নারীর ক্ষমতায়ন ও সামাজিক গতিশীলতা', serial: 2 },
        ],
      },
      {
        id: 'ssc-bgs-ch16',
        name: 'বাংলাদেশের সামাজিক সমস্যা ও এর প্রতিকার',
        topics: [
          { id: 'ssc-bgs-ch16-t1', name: 'দারিদ্র্য, জনসংখ্যা বৃদ্ধি ও নিরক্ষরতা', serial: 1 },
          { id: 'ssc-bgs-ch16-t2', name: 'বাল্যবিয়ে ও যৌতুক প্রথা', serial: 2 },
          { id: 'ssc-bgs-ch16-t3', name: 'কিশোর অপরাধ, মাদকাসক্তি ও সামাজিক প্রতিরোধ', serial: 3 },
        ],
      },
    ],
  },
  {
    id: 'ssc-religion',
    name: 'SSC ধর্ম ও নৈতিক শিক্ষা',
    icon: BookOpen,
    group: 'General',
    chapters: [
      {
        id: 'ssc-religion-ch1',
        name: 'ইসলাম',
        topics: [
          { id: 'ssc-religion-ch1-t1', name: 'আকাইদ: তাওহিদ, রিসালাত ও আখিরাত', serial: 1 },
          { id: 'ssc-religion-ch1-t2', name: 'ইবাদত: সালাত, সাওম, জাকাত ও হজ', serial: 2 },
          { id: 'ssc-religion-ch1-t3', name: 'আখলাক: আখলাকে হামিদাহ (সদাচরণ) ও আখলাকে যামিমাহ (মন্দ স্বভাব পরিহার)', serial: 3 },
          { id: 'ssc-religion-ch1-t4', name: 'আল-কুরআন ও আল-হাদিস পরিচিতি ও শিক্ষা', serial: 4 },
          { id: 'ssc-religion-ch1-t5', name: 'আদর্শ জীবনচরিত: মহানবী (সা.) ও চার খলিফার জীবনী', serial: 5 },
        ],
      },
      {
        id: 'ssc-religion-ch2',
        name: 'হিন্দুধর্ম',
        topics: [
          { id: 'ssc-religion-ch2-t1', name: 'ঈশ্বর ও অবতার তত্ত্ব', serial: 1 },
          { id: 'ssc-religion-ch2-t2', name: 'সনাতন ধর্মের মূল ভিত্তি ও দেব-দেবী', serial: 2 },
          { id: 'ssc-religion-ch2-t3', name: 'ধর্মগ্রন্থ (বেদ, উপনিষদ, গীতা, রামায়ণ ও মহাভারত)', serial: 3 },
          { id: 'ssc-religion-ch2-t4', name: 'পূজা-পার্বণ, সংস্কার ও নৈতিক জীবন', serial: 4 },
        ],
      },
      {
        id: 'ssc-religion-ch3',
        name: 'বৌদ্ধধর্ম',
        topics: [
          { id: 'ssc-religion-ch3-t1', name: 'বুদ্ধের জীবনী ও গৃহত্যাগ', serial: 1 },
          { id: 'ssc-religion-ch3-t2', name: 'চতুরার্য সত্য ও অষ্টাঙ্গিক মার্গ', serial: 2 },
          { id: 'ssc-religion-ch3-t3', name: 'ত্রিপিটক পরিচিতি ও নৈতিক শিক্ষা', serial: 3 },
          { id: 'ssc-religion-ch3-t4', name: 'শীল, সমাধি ও প্রজ্ঞা', serial: 4 },
        ],
      },
      {
        id: 'ssc-religion-ch4',
        name: 'খ্রিষ্টধর্ম',
        topics: [
          { id: 'ssc-religion-ch4-t1', name: 'যিশু খ্রিষ্টের জীবন ও শিক্ষা', serial: 1 },
          { id: 'ssc-religion-ch4-t2', name: 'পবিত্র বাইবেল পরিচিতি', serial: 2 },
          { id: 'ssc-religion-ch4-t3', name: 'দশ আজ্ঞা ও খ্রিষ্টীয় নীতিশিক্ষা', serial: 3 },
          { id: 'ssc-religion-ch4-t4', name: 'প্রেম, সেবা ও ক্ষমার আদর্শ', serial: 4 },
        ],
      },
    ],
  },
  {
    id: 'ssc-ict',
    name: 'SSC তথ্য ও যোগাযোগ প্রযুক্তি',
    icon: Laptop,
    group: 'General',
    chapters: [
      {
        id: 'ssc-ict-ch1',
        name: 'তথ্য ও যোগাযোগ প্রযুক্তি এবং আমাদের বাংলাদেশ',
        topics: [
          { id: 'ssc-ict-ch1-t1', name: 'একুশ শতক এবং তথ্য ও যোগাযোগ প্রযুক্তি', serial: 1 },
          { id: 'ssc-ict-ch1-t2', name: 'তথ্য প্রযুক্তির বিকাশ ও উল্লেখযোগ্য ব্যক্তিত্ব (চার্লস ব্যাবেজ, অ্যাডা লাভলেস, টিম বার্নার্স লি, স্টিভ জবস, বিল গেটস, মার্ক জাকারবার্গ)', serial: 2 },
          { id: 'ssc-ict-ch1-t3', name: 'ই-লার্নিং, ই-গভর্নেন্স, ই-সার্ভিস ও ই-কমার্স', serial: 3 },
          { id: 'ssc-ict-ch1-t4', name: 'বাংলাদেশে কর্মক্ষেত্র ও ক্যারিয়ার হিসেবে আইসিটি', serial: 4 },
        ],
      },
      {
        id: 'ssc-ict-ch2',
        name: 'কম্পিউটার ও কম্পিউটার ব্যবহারকারীর নিরাপত্তা',
        topics: [
          { id: 'ssc-ict-ch2-t1', name: 'সফটওয়্যার ইনস্টলেশন, আনইনস্টল ও সফটওয়্যার আপডেট', serial: 1 },
          { id: 'ssc-ict-ch2-t2', name: 'কম্পিউটার ভাইরাস, ম্যালওয়্যার ও অ্যান্টিভাইরাস সফটওয়্যার', serial: 2 },
          { id: 'ssc-ict-ch2-t3', name: 'পাসওয়ার্ড ও তথ্যের নিরাপত্তা', serial: 3 },
          { id: 'ssc-ict-ch2-t4', name: 'সাইবার অপরাধ, কপিরাইট আইন ও পাইরেসি প্রতিরোধ', serial: 4 },
          { id: 'ssc-ict-ch2-t5', name: 'কম্পিউটার রক্ষণাবেক্ষণে ট্রাবলশুটিং', serial: 5 },
        ],
      },
      {
        id: 'ssc-ict-ch3',
        name: 'আমার শিক্ষায় ইন্টারনেট',
        topics: [
          { id: 'ssc-ict-ch3-t1', name: 'শিক্ষায় ইন্টারনেটের ব্যবহার ও ডিজিটাল কনটেন্ট', serial: 1 },
          { id: 'ssc-ict-ch3-t2', name: 'ই-বুক ও শিক্ষামূলক ওয়েবসাইট', serial: 2 },
          { id: 'ssc-ict-ch3-t3', name: 'ইন্টারনেটে তথ্য অনুসন্ধান ও সার্চ ইঞ্জিনের ব্যবহার', serial: 3 },
          { id: 'ssc-ict-ch3-t4', name: 'কপিরাইট সচেতনতা ও ইন্টারনেটে ব্যক্তিগত নিরাপত্তা', serial: 4 },
        ],
      },
      {
        id: 'ssc-ict-ch4',
        name: 'আমার লেখালেখি ও হিসাব',
        topics: [
          { id: 'ssc-ict-ch4-t1', name: 'ওয়ার্ড প্রসেসরে লেখালেখির সাজসজ্জা ও ফন্ট ফরম্যাটিং', serial: 1 },
          { id: 'ssc-ict-ch4-t2', name: 'টেবিল, ছবি ও ক্লিপআর্ট সংযোজন', serial: 2 },
          { id: 'ssc-ict-ch4-t3', name: 'স্প্রেডশিটের প্রাথমিক পরিচিতি ও সেল রেফারেন্স', serial: 3 },
          { id: 'ssc-ict-ch4-t4', name: 'স্প্রেডশিটে গাণিতিক হিসাব-নিকাশ, যোগ, বিয়োগ, গুণ, ভাগ ও শতকরা সূত্র', serial: 4 },
        ],
      },
      {
        id: 'ssc-ict-ch5',
        name: 'মাল্টিমিডিয়া ও গ্রাফিক্স',
        topics: [
          { id: 'ssc-ict-ch5-t1', name: 'মাল্টিমিডিয়ার ধারণা ও মাধ্যমসমূহ', serial: 1 },
          { id: 'ssc-ict-ch5-t2', name: 'প্রেজেন্টেশন সফটওয়্যার (পাওয়ারপয়েন্ট) দিয়ে স্লাইড তৈরি ও ট্রানজিশন', serial: 2 },
          { id: 'ssc-ict-ch5-t3', name: 'গ্রাফিক্স পরিচিতি ও ফটোশপ/ইলাস্ট্রেটরের প্রাথমিক টুলস', serial: 3 },
          { id: 'ssc-ict-ch5-t4', name: 'ছবি সম্পাদনা ও লেয়ার কনসেপ্ট', serial: 4 },
        ],
      },
      {
        id: 'ssc-ict-ch6',
        name: 'ডেটাবেজ এর ব্যবহার',
        topics: [
          { id: 'ssc-ict-ch6-t1', name: 'ডেটাবেজ ও আরডিবিএমএস (RDBMS) এর প্রাথমিক ধারণা', serial: 1 },
          { id: 'ssc-ict-ch6-t2', name: 'টেবিল তৈরি, ফিল্ড ও ডেটা টাইপ নির্ধারণ', serial: 2 },
          { id: 'ssc-ict-ch6-t3', name: 'প্রাইমারি কি ও record সংযোজন-সম্পাদনা', serial: 3 },
          { id: 'ssc-ict-ch6-t4', name: 'কুয়েরি (Query) তৈরি, রিপোর্ট ও ডেটাবেজ ম্যানেজমেন্ট', serial: 4 },
        ],
      },
    ],
  },
  {
    id: 'ssc-physics',
    name: 'SSC পদার্থবিজ্ঞান',
    icon: Atom,
    group: 'Science',
    chapters: [
      {
        id: 'ssc-physics-ch1',
        name: 'ভৌত রাশি এবং পরিমাপ',
        topics: [
          { id: 'ssc-physics-ch1-t1', name: 'পদার্থবিজ্ঞানের পরিসর ও ক্রমবিকাশ', serial: 1 },
          { id: 'ssc-physics-ch1-t2', name: 'মৌলিক রাশি ও লব্ধ রাশি', serial: 2 },
          { id: 'ssc-physics-ch1-t3', name: 'আন্তর্জাতিক একক পদ্ধতি (SI Units)', serial: 3 },
          { id: 'ssc-physics-ch1-t4', name: 'পরিমাপের যন্ত্রপাতি (ভার্নিয়ার স্কেল, স্ক্রু গজ, স্লাইড ক্যালিপার্স ও ত্রুটি)', serial: 4 },
        ],
      },
      {
        id: 'ssc-physics-ch2',
        name: 'গতি',
        topics: [
          { id: 'ssc-physics-ch2-t1', name: 'স্থিতি, গতি ও গতির প্রকারভেদ', serial: 1 },
          { id: 'ssc-physics-ch2-t2', name: 'দূরত্ব, সরণ, দ্রুতি ও বেগ', serial: 2 },
          { id: 'ssc-physics-ch2-t3', name: 'ত্বরণ ও মন্দন', serial: 3 },
          { id: 'ssc-physics-ch2-t4', name: 'গতির সমীকরণসমূহ ($v = u + at, s = ut + \frac{1}{2}at^2, v^2 = u^2 + 2as$)', serial: 4 },
          { id: 'ssc-physics-ch2-t5', name: 'পরন্ত বস্তুর সূত্র ও গ্যালিলিওর সূত্রাবলী', serial: 5 },
          { id: 'ssc-physics-ch2-t6', name: 'গতির লেখচিত্র ($s-t, v-t$ গ্রাফ)', serial: 6 },
        ],
      },
      {
        id: 'ssc-physics-ch3',
        name: 'বল',
        topics: [
          { id: 'ssc-physics-ch3-t1', name: 'জড়তা ও বলের ধারণা', serial: 1 },
          { id: 'ssc-physics-ch3-t2', name: 'নিউটনের গতির ১ম, ২য় ও ৩য় সূত্র', serial: 2 },
          { id: 'ssc-physics-ch3-t3', name: 'ভরবেগ ও ভরবেগের সংরক্ষণ সূত্র', serial: 3 },
          { id: 'ssc-physics-ch3-t4', name: 'মহাকর্ষ বল ও অভিকর্ষজ ত্বরণ ($g$)', serial: 4 },
          { id: 'ssc-physics-ch3-t5', name: 'ঘর্ষণ বল (স্থিতি, পিছলানো, আবর্ত, প্রবাহী ঘর্ষণ)', serial: 5 },
        ],
      },
      {
        id: 'ssc-physics-ch4',
        name: 'কাজ, ক্ষমতা ও শক্তি',
        topics: [
          { id: 'ssc-physics-ch4-t1', name: 'কাজ ও কাজের প্রকারভেদ ($W = Fs \cos\theta$)', serial: 1 },
          { id: 'ssc-physics-ch4-t2', name: 'শক্তি ও শক্তির বিভিন্ন রূপ (গতিশক্তি $E_k = \frac{1}{2}mv^2$, বিভবশক্তি $E_p = mgh$)', serial: 2 },
          { id: 'ssc-physics-ch4-t3', name: 'শক্তির রূপান্তর ও শক্তির সংরক্ষণশীলতা নীতি', serial: 3 },
          { id: 'ssc-physics-ch4-t4', name: 'ক্ষমতা ও কর্মদক্ষতা ($\\eta = \\frac{\\text{লভ্য কার্যকর শক্তি}}{\\text{মোট প্রদত্ত শক্তি}} \\times 100\\%$)', serial: 4 },
        ],
      },
      {
        id: 'ssc-physics-ch5',
        name: 'পদার্থের অবস্থা ও চাপ',
        topics: [
          { id: 'ssc-physics-ch5-t1', name: 'চাপ ও ঘনত্ব ($P = \frac{F}{A}, P = h\rho g$)', serial: 1 },
          { id: 'ssc-physics-ch5-t2', name: 'প্যাসকেলের সূত্র ও বল বৃদ্ধিকরণ নীতি', serial: 2 },
          { id: 'ssc-physics-ch5-t3', name: 'আর্কিমিডিসের সূত্র ও প্লবতা', serial: 3 },
          { id: 'ssc-physics-ch5-t4', name: 'বস্তুর ভাসন ও নিমজ্জনের শর্ত', serial: 4 },
          { id: 'ssc-physics-ch5-t5', name: 'স্থিতিস্থাপকতা, হুকের সূত্র ও পীড়ন-বিকৃতি', serial: 5 },
        ],
      },
      {
        id: 'ssc-physics-ch6',
        name: 'বস্তুর উপর তাপের প্রভাব',
        topics: [
          { id: 'ssc-physics-ch6-t1', name: 'তাপ ও তাপমাত্রা এবং স্কেল রূপান্তর ($C, F, K$)', serial: 1 },
          { id: 'ssc-physics-ch6-t2', name: 'কঠিন, তরল ও গ্যাসীয় পদার্থের প্রসারণ (দৈর্ঘ্য, ক্ষেত্র ও আয়তন প্রসারণ সহগ)', serial: 2 },
          { id: 'ssc-physics-ch6-t3', name: 'আপেক্ষিক তাপ ও তাপধারণ ক্ষমতা ($Q = ms\Delta\theta$)', serial: 3 },
          { id: 'ssc-physics-ch6-t4', name: 'ক্যালোরিমিতির মূলনীতি ও মিশ্রণের তাপমাত্রা নির্ণয়', serial: 4 },
          { id: 'ssc-physics-ch6-t5', name: 'গলন ও বাষ্পীভবনের সুপ্ততাপ', serial: 5 },
        ],
      },
      {
        id: 'ssc-physics-ch7',
        name: 'তরঙ্গ ও শব্দ',
        topics: [
          { id: 'ssc-physics-ch7-t1', name: 'সরল ছন্দিত স্পন্দন ও পর্যায়বৃত্ত গতি', serial: 1 },
          { id: 'ssc-physics-ch7-t2', name: 'তরঙ্গের বৈশিষ্ট্য ও প্রকারভেদ (অনুদৈর্ঘ্য ও অনুপ্রস্থ তরঙ্গ)', serial: 2 },
          { id: 'ssc-physics-ch7-t3', name: 'তরঙ্গ সংক্রান্ত রাশিমালা ($v = f\lambda$)', serial: 3 },
          { id: 'ssc-physics-ch7-t4', name: 'শব্দের বেগ ও প্রতিধ্বনি', serial: 4 },
          { id: 'ssc-physics-ch7-t5', name: 'শব্দোত্তর ও শব্দেতর তরঙ্গ এবং এর ব্যবহার', serial: 5 },
        ],
      },
      {
        id: 'ssc-physics-ch8',
        name: 'আলোর প্রতিফলন',
        topics: [
          { id: 'ssc-physics-ch8-t1', name: 'আলোর প্রতিফলনের সূত্রাবলী', serial: 1 },
          { id: 'ssc-physics-ch8-t2', name: 'সমতল দর্পণে প্রতিবিম্ব গঠন', serial: 2 },
          { id: 'ssc-physics-ch8-t3', name: 'গোলীয় দর্পণ (অবতল ও উত্তল দর্পণ)', serial: 3 },
          { id: 'ssc-physics-ch8-t4', name: 'দর্পণের সূত্র ($\\frac{1}{u} + \\frac{1}{v} = \\frac{1}{f}$) ও রৈখিক বিবর্ধন ($m = -\\frac{v}{u}$)', serial: 4 },
        ],
      },
      {
        id: 'ssc-physics-ch9',
        name: 'আলোর প্রতিসরণ',
        topics: [
          { id: 'ssc-physics-ch9-t1', name: 'আলোর প্রতিসরণের সূত্র ও স্নেলের সূত্র', serial: 1 },
          { id: 'ssc-physics-ch9-t2', name: 'প্রতিসরাঙ্ক ও আলোর বেগের সম্পর্ক ($n = \frac{c}{v}$)', serial: 2 },
          { id: 'ssc-physics-ch9-t3', name: 'সংকট কোণ ও পূর্ণ অভ্যন্তরীণ প্রতিফলন', serial: 3 },
          { id: 'ssc-physics-ch9-t4', name: 'অপটিক্যাল ফাইবার ও মরিচিকা', serial: 4 },
          { id: 'ssc-physics-ch9-t5', name: 'লেন্স (উত্তল ও অবতল লেন্স) ও লেন্সের ক্ষমতা ($P = \frac{1}{f}$)', serial: 5 },
        ],
      },
      {
        id: 'ssc-physics-ch10',
        name: 'স্থির তড়িৎ',
        topics: [
          { id: 'ssc-physics-ch10-t1', name: 'আধানের প্রকৃতি ও আধানের কোয়ান্টায়ন', serial: 1 },
          { id: 'ssc-physics-ch10-t2', name: 'তড়িৎ আবেশ ও স্বর্ণপাত তড়িৎবীক্ষণ যন্ত্র', serial: 2 },
          { id: 'ssc-physics-ch10-t3', name: 'কুলম্বের সূত্র ($F = \frac{1}{4\pi\varepsilon_0} \frac{q_1 q_2}{r^2}$)', serial: 3 },
          { id: 'ssc-physics-ch10-t4', name: 'তড়িৎ ক্ষেত্র ও তড়িৎ তীব্রতা ($E = \frac{F}{q}$)', serial: 4 },
          { id: 'ssc-physics-ch10-t5', name: 'তড়িৎ বিভব ($V = \frac{W}{q}$)', serial: 5 },
        ],
      },
      {
        id: 'ssc-physics-ch11',
        name: 'চল তড়িৎ',
        topics: [
          { id: 'ssc-physics-ch11-t1', name: 'তড়িৎ প্রবাহ ও ওহমের সূত্র ($V = IR$)', serial: 1 },
          { id: 'ssc-physics-ch11-t2', name: 'রোধের নির্ভরশীলতা ও আপেক্ষিক রোধ ($\rho = \frac{RA}{L}$)', serial: 2 },
          { id: 'ssc-physics-ch11-t3', name: 'রোধের সমবায় (শ্রেণি ও সমান্তরাল তুল্যরোধ)', serial: 3 },
          { id: 'ssc-physics-ch11-t4', name: 'তড়িৎ ক্ষমতা ও তড়িৎ শক্তি পরিমাপ (বিল হিসাব $W = \frac{Pt}{1000}$ kWh)', serial: 4 },
          { id: 'ssc-physics-ch11-t5', name: 'বাসাবাড়িতে নিরাপদ তড়িৎ বর্তনী ও ফিউজ', serial: 5 },
        ],
      },
      {
        id: 'ssc-physics-ch12',
        name: 'তড়িতের চৌম্বক ক্রিয়া',
        topics: [
          { id: 'ssc-physics-ch12-t1', name: 'চৌম্বক ক্ষেত্র ও তড়িৎবাহী তারের চৌম্বক প্রভাব', serial: 1 },
          { id: 'ssc-physics-ch12-t2', name: 'সোলেনয়েড ও তড়িৎ চুম্বক', serial: 2 },
          { id: 'ssc-physics-ch12-t3', name: 'তড়িৎ মোটরের মূলনীতি', serial: 3 },
          { id: 'ssc-physics-ch12-t4', name: 'তাড়িৎচৌম্বক আবেশ ও ফ্যারাডের সূত্র', serial: 4 },
          { id: 'ssc-physics-ch12-t5', name: 'ট্রান্সফরমার ও স্টেপ-আপ/স্টেপ-ডাউন ট্রান্সফরমার সূত্র', serial: 5 },
        ],
      },
      {
        id: 'ssc-physics-ch13',
        name: 'আধুনিক পদার্থবিজ্ঞান ও ইলেকট্রনিক্স',
        topics: [
          { id: 'ssc-physics-ch13-t1', name: 'তেজস্ক্রিয়তা ও তেজস্ক্রিয় রশ্মি ($\\alpha, \\beta, \\gamma$)', serial: 1 },
          { id: 'ssc-physics-ch13-t2', name: 'অর্ধপরিবাহী (p-type, n-type) ও p-n জংশন ডায়োড', serial: 2 },
          { id: 'ssc-physics-ch13-t3', name: 'ট্রানজিস্টর ও অ্যাম্প্লিফায়ার', serial: 3 },
          { id: 'ssc-physics-ch13-t4', name: 'লজিক গেট (AND, OR, NOT, NAND, NOR, XOR)', serial: 4 },
          { id: 'ssc-physics-ch13-t5', name: 'আইসিটি ও টেলিযোগাযোগ ডিভাইস (টেলিফোন, মোবাইল, অপটিক্যাল ফাইবার)', serial: 5 },
        ],
      },
      {
        id: 'ssc-physics-ch14',
        name: 'জীবন বাঁচাতে পদার্থবিজ্ঞান',
        topics: [
          { id: 'ssc-physics-ch14-t1', name: 'চিকিৎসাবিজ্ঞানে পদার্থবিজ্ঞান', serial: 1 },
          { id: 'ssc-physics-ch14-t2', name: 'এক্স-রে (X-ray) ও সিটি স্ক্যান (CT Scan)', serial: 2 },
          { id: 'ssc-physics-ch14-t3', name: 'আল্ট্রাসনোগ্রাফি (Ultrasonography)', serial: 3 },
          { id: 'ssc-physics-ch14-t4', name: 'এমআরআই (MRI) ও ইসিজি (ECG)', serial: 4 },
          { id: 'ssc-physics-ch14-t5', name: 'রেডিওথেরাপি ও আইসোটোপের ব্যবহার', serial: 5 },
        ],
      },
    ],
  },
  {
    id: 'ssc-chemistry',
    name: 'SSC রসায়ন',
    icon: FlaskConical,
    group: 'Science',
    chapters: [
      {
        id: 'ssc-chemistry-ch1',
        name: 'রসায়নের ধারণা',
        topics: [
          { id: 'ssc-chemistry-ch1-t1', name: 'রসায়নের ক্ষেত্র ও বিজ্ঞানের বিভিন্ন শাখার সাথে সম্পর্ক', serial: 1 },
          { id: 'ssc-chemistry-ch1-t2', name: 'পদার্থের পরিবর্তন (ভৌত ও রাসায়নিক পরিবর্তন)', serial: 2 },
          { id: 'ssc-chemistry-ch1-t3', name: 'রসায়নে অনুসন্ধান ও গবেষণা প্রক্রিয়া', serial: 3 },
          { id: 'ssc-chemistry-ch1-t4', name: 'ল্যাবরেটরি ব্যবহারের নিয়মাবলী ও হ্যাজার্ড প্রতীক (Hazard Symbols)', serial: 4 },
        ],
      },
      {
        id: 'ssc-chemistry-ch2',
        name: 'পদার্থের অবস্থা',
        topics: [
          { id: 'ssc-chemistry-ch2-t1', name: 'পদার্থের কণার গতিতত্ত্ব', serial: 1 },
          { id: 'ssc-chemistry-ch2-t2', name: 'পদার্থের কঠিন, তরল ও গ্যাসীয় অবস্থা', serial: 2 },
          { id: 'ssc-chemistry-ch2-t3', name: 'ব্যাপন ও নিঃসরণ (Graham\'s Diffusion Law এর ধারণা)', serial: 3 },
          { id: 'ssc-chemistry-ch2-t4', name: 'গলন, স্ফুটন ও স্ফুটনাঙ্ক', serial: 4 },
          { id: 'ssc-chemistry-ch2-t5', name: 'উর্ধ্বপাতন ও পাতন প্রক্রিয়া', serial: 5 },
        ],
      },
      {
        id: 'ssc-chemistry-ch3',
        name: 'পদার্থের গঠন',
        topics: [
          { id: 'ssc-chemistry-ch3-t1', name: 'মৌলিক ও যৌগিক পদার্থ এবং প্রতীক ও সংকেত', serial: 1 },
          { id: 'ssc-chemistry-ch3-t2', name: 'পরমাণুর মূল কণিকাসমূহ (ইলেকট্রন, প্রোটন, নিউট্রন)', serial: 2 },
          { id: 'ssc-chemistry-ch3-t3', name: 'পারমাণবিক সংখ্যা, ভর সংখ্যা ও আইসোটোপ', serial: 3 },
          { id: 'ssc-chemistry-ch3-t4', name: 'রাদারফোর্ড ও বোর পরমাণু মডেলের তুলনা ও সীমাবদ্ধতা', serial: 4 },
          { id: 'ssc-chemistry-ch3-t5', name: 'শক্তিস্তর ও অরবিটালে ইলেকট্রন বিন্যাস ($2n^2$, আউফবাউ নীতি)', serial: 5 },
        ],
      },
      {
        id: 'ssc-chemistry-ch4',
        name: 'পর্যায় সারণি',
        topics: [
          { id: 'ssc-chemistry-ch4-t1', name: 'পর্যায় সারণির পটভূমি (মেন্ডেলিফের পর্যায় সূত্র ও আধুনিক পর্যায় সূত্র)', serial: 1 },
          { id: 'ssc-chemistry-ch4-t2', name: 'পর্যায় সারণির বৈশিষ্ট্য ও মৌলের অবস্থান নির্ণয়', serial: 2 },
          { id: 'ssc-chemistry-ch4-t3', name: 'পর্যায়বৃত্ত ধর্ম (পারমাণবিক আকার, আয়নীকরণ শক্তি, ইলেকট্রন আসক্তি, তড়িৎ ঋণাত্মকতা)', serial: 3 },
          { id: 'ssc-chemistry-ch4-t4', name: 'ক্ষার ধাতু, মৃৎক্ষার ধাতু, হ্যালোজেন, নিষ্ক্রিয় গ্যাস ও অবস্থান্তর মৌল', serial: 4 },
        ],
      },
      {
        id: 'ssc-chemistry-ch5',
        name: 'রাসায়নিক বন্ধন',
        topics: [
          { id: 'ssc-chemistry-ch5-t1', name: 'যোজ্যতা ইলেকট্রন, যোজ্যতার ধারণা ও পরিবর্তনশীল যোজ্যতা', serial: 1 },
          { id: 'ssc-chemistry-ch5-t2', name: 'যৌগ গঠনের নিয়ম ও যৌগমূলক', serial: 2 },
          { id: 'ssc-chemistry-ch5-t3', name: 'আয়ন সৃষ্টি ও আয়নিক বন্ধন গঠন', serial: 3 },
          { id: 'ssc-chemistry-ch5-t4', name: 'সমযোজী বন্ধন ও সমযোজী যৌগের ধর্ম', serial: 4 },
          { id: 'ssc-chemistry-ch5-t5', name: 'আয়নিক ও সমযোজী যৌগের বৈশিষ্ট্যের তুলনা (গলনাঙ্ক, দ্রবণীয়তা, পরিবাহিতা)', serial: 5 },
          { id: 'ssc-chemistry-ch5-t6', name: 'ধাতব বন্ধন ও ধাতুর বিদ্যুৎ পরিবাহিতা', serial: 6 },
        ],
      },
      {
        id: 'ssc-chemistry-ch6',
        name: 'মোলের ধারণা ও রাসায়নিক গণনা',
        topics: [
          { id: 'ssc-chemistry-ch6-t1', name: 'মোল, অ্যাভোগাড্রো সংখ্যা ও মোলার ভর', serial: 1 },
          { id: 'ssc-chemistry-ch6-t2', name: 'মোলার আয়তন ও প্রমাণ তাপমাত্রা-চাপে গণনা', serial: 2 },
          { id: 'ssc-chemistry-ch6-t3', name: 'দ্রবণের মোলারিটি ও ঘনমাত্রা ($S = \frac{1000w}{MV}$)', serial: 3 },
          { id: 'ssc-chemistry-ch6-t4', name: 'মৌলের শতকরা সংযুতি ও স্থূল/আণবিক সংকেত নির্ণয়', serial: 4 },
          { id: 'ssc-chemistry-ch6-t5', name: 'রাসায়নিক সমীকরণ ও স্টয়কিওমিত্রি', serial: 5 },
          { id: 'ssc-chemistry-ch6-t6', name: 'লিমিটিং বিক্রিয়ক ও উৎপাদের শতকরা পরিমাণ', serial: 6 },
        ],
      },
      {
        id: 'ssc-chemistry-ch7',
        name: 'রাসায়নিক বিক্রিয়া',
        topics: [
          { id: 'ssc-chemistry-ch7-t1', name: 'রাসায়নিক বিক্রিয়া ও সমতাকরণ', serial: 1 },
          { id: 'ssc-chemistry-ch7-t2', name: 'তাপের পরিবর্তন অনুযায়ী বিক্রিয়া (তাপোৎপাদী ও তাপহারী বিক্রিয়া)', serial: 2 },
          { id: 'ssc-chemistry-ch7-t3', name: 'দিক অনুযায়ী বিক্রিয়া (একমুখী ও উভমুখী বিক্রিয়া)', serial: 3 },
          { id: 'ssc-chemistry-ch7-t4', name: 'ইলেকট্রন স্থানান্তর অনুযায়ী বিক্রিয়া (জারণ-বিজারণ/Redox বিক্রিয়া)', serial: 4 },
          { id: 'ssc-chemistry-ch7-t5', name: 'সংযোজন, দহন, প্রতিস্থাপন, বিয়োজন ও প্রশমন বিক্রিয়া', serial: 5 },
          { id: 'ssc-chemistry-ch7-t6', name: 'লা-শাতেলিয়ার নীতি ও সাম্যাবস্থার ওপর প্রভাব', serial: 6 },
        ],
      },
      {
        id: 'ssc-chemistry-ch8',
        name: 'রসায়ন ও শক্তি',
        topics: [
          { id: 'ssc-chemistry-ch8-t1', name: 'রাসায়নিক বন্ধন শক্তি ও বিক্রিয়া তাপ ($\\Delta H = B_1 - B_2$)', serial: 1 },
          { id: 'ssc-chemistry-ch8-t2', name: 'তড়িৎ রাসায়নিক কোষ ও গ্যালভানিক কোষ', serial: 2 },
          { id: 'ssc-chemistry-ch8-t3', name: 'ড্রাই সেল (শুষ্ক কোষ) এর গঠন ও বিক্রিয়া', serial: 3 },
          { id: 'ssc-chemistry-ch8-t4', name: 'তড়িৎ বিশ্লেষণ কোষ ও তড়িৎ বিশ্লেষণের ব্যবহার (ইলেক্ট্রোপ্লেটিং)', serial: 4 },
        ],
      },
      {
        id: 'ssc-chemistry-ch9',
        name: 'এসিড-ক্ষার সমতা',
        topics: [
          { id: 'ssc-chemistry-ch9-t1', name: 'এসিডের বৈশিষ্ট্য, তীব্রতা ও ব্যবহার', serial: 1 },
          { id: 'ssc-chemistry-ch9-t2', name: 'ক্ষারের বৈশিষ্ট্য, তীব্রতা ও ব্যবহার', serial: 2 },
          { id: 'ssc-chemistry-ch9-t3', name: 'pH স্কেল ও pH এর গুরুত্ব', serial: 3 },
          { id: 'ssc-chemistry-ch9-t4', name: 'এসিড বৃষ্টি ও মাটির pH নিয়ন্ত্রণ', serial: 4 },
          { id: 'ssc-chemistry-ch9-t5', name: 'লবণ প্রস্তুতি ও প্রশমন বিক্রিয়া', serial: 5 },
        ],
      },
      {
        id: 'ssc-chemistry-ch10',
        name: 'খনিজ সম্পদ: ধাতু-অধাতু',
        topics: [
          { id: 'ssc-chemistry-ch10-t1', name: 'ধাতু নিষ্কাশনের মৌলিক ধাপসমূহ (আকরিক চূর্ণন, ঘনীভবন, ভস্মীকরণ, বিজারন)', serial: 1 },
          { id: 'ssc-chemistry-ch10-t2', name: 'লোহা, তামা ও অ্যালুমিনিয়াম নিষ্কাশন', serial: 2 },
          { id: 'ssc-chemistry-ch10-t3', name: 'ধাতুর সক্রিয়তা সিরিজ', serial: 3 },
          { id: 'ssc-chemistry-ch10-t4', name: 'ধাতু সংকর (পিতল, ব্রোঞ্জ, স্টেইনলেস স্টিল) ও মরিচা প্রতিরোধ', serial: 4 },
        ],
      },
      {
        id: 'ssc-chemistry-ch11',
        name: 'খনিজ সম্পদ: জীবাশ্ম',
        topics: [
          { id: 'ssc-chemistry-ch11-t1', name: 'জীবাশ্ম জ্বালানি ও পেট্রোলিয়ামের আংশিক পাতন', serial: 1 },
          { id: 'ssc-chemistry-ch11-t2', name: 'হাইড্রোকার্বনের শ্রেণিবিভাগ (অ্যালিফ্যাটিক ও অ্যারোমেটিক)', serial: 2 },
          { id: 'ssc-chemistry-ch11-t3', name: 'অ্যালকেন, অ্যালকিন ও অ্যালকাইন প্রস্তুতি ও বিক্রিয়া', serial: 3 },
          { id: 'ssc-chemistry-ch11-t4', name: 'অ্যালকোহল, অ্যালডিহাইড ও জৈব এসিড', serial: 4 },
          { id: 'ssc-chemistry-ch11-t5', name: 'পলিমারকরণ বিক্রিয়া ও প্লাস্টিক/পলিথিন', serial: 5 },
        ],
      },
      {
        id: 'ssc-chemistry-ch12',
        name: 'আমাদের জীবনে রসায়ন',
        topics: [
          { id: 'ssc-chemistry-ch12-t1', name: 'গৃহস্থালি রসায়ন (লবণ, বেকিং পাউডার, ভিনেগার, ব্লিচিং পাউডার)', serial: 1 },
          { id: 'ssc-chemistry-ch12-t2', name: 'পরিস্কারক সামগ্রী (সাবান ও ডিটারজেন্ট এর প্রস্তুতি ও কার্যপ্রণালী)', serial: 2 },
          { id: 'ssc-chemistry-ch12-t3', name: 'কৃষিতে ও খাদ্য সংরক্ষণে রসায়নের ভূমিকা', serial: 3 },
          { id: 'ssc-chemistry-ch12-t4', name: 'প্রসাধন সামগ্রী ও কোমল পানীয়তে রসায়ন', serial: 4 },
        ],
      },
    ],
  },
  {
    id: 'ssc-biology',
    name: 'SSC জীববিজ্ঞান',
    icon: Dna,
    group: 'Science',
    chapters: [
      {
        id: 'ssc-biology-ch1',
        name: 'জীবন পাঠ',
        topics: [
          { id: 'ssc-biology-ch1-t1', name: 'জীববিজ্ঞানের ধারণা ও শাখাগুলি (ভৌত ও ফলিত জীববিজ্ঞান)', serial: 1 },
          { id: 'ssc-biology-ch1-t2', name: 'জীবের শ্রেণিবিন্যাস ও শ্রেণিবিন্যাসের ধাপসমূহ', serial: 2 },
          { id: 'ssc-biology-ch1-t3', name: 'দ্বিপদ নামকরণ পদ্ধতি ও ক্যারোলাস লিনিয়াস', serial: 3 },
          { id: 'ssc-biology-ch1-t4', name: 'হুইটেকারের পঞ্চজগৎ শ্রেণিবিন্যাস (Monera, Protista, Fungi, Plantae, Animalia)', serial: 4 },
        ],
      },
      {
        id: 'ssc-biology-ch2',
        name: 'জীব কোষ ও টিস্যু',
        topics: [
          { id: 'ssc-biology-ch2-t1', name: 'উদ্ভিদ ও প্রাণীকোষের গঠন ও তুলনা', serial: 1 },
          { id: 'ssc-biology-ch2-t2', name: 'কোষ অঙ্গাণু (মাইটোকন্ড্রিয়া, প্লাস্টিড, রাইবোসোম, গলজি বস্তু, এন্ডোপ্লাজমিক রেটিকুলাম)', serial: 2 },
          { id: 'ssc-biology-ch2-t3', name: 'নিউক্লিয়াস ও ক্রোমোজোমের গঠন', serial: 3 },
          { id: 'ssc-biology-ch2-t4', name: 'উদ্ভিদ টিস্যু (সরল, জটিল - জাইলেম ও ফ্লোয়েম টিস্যু)', serial: 4 },
          { id: 'ssc-biology-ch2-t5', name: 'প্রাণী টিস্যু (আবরণী, যোজক, পেশি ও স্নায়ু টিস্যু)', serial: 5 },
          { id: 'ssc-biology-ch2-t6', name: 'অঙ্গ ও অঙ্গতন্ত্র', serial: 6 },
        ],
      },
      {
        id: 'ssc-biology-ch3',
        name: 'কোষ বিভাজন',
        topics: [
          { id: 'ssc-biology-ch3-t1', name: 'কোষ বিভাজনের প্রকারভেদ (অ্যামাইটোসিস, মাইটোসিস, মায়োসিস)', serial: 1 },
          { id: 'ssc-biology-ch3-t2', name: 'মাইটোসিস কোষ বিভাজনের পর্যায়সমূহ (প্রোফেজ, প্রো-মেটাফেজ, মেটাফেজ, অ্যানাফেজ, টেলোফেজ)', serial: 2 },
          { id: 'ssc-biology-ch3-t3', name: 'সাইটোকাইনেসিস ও মাইটোসিসের গুরুত্ব', serial: 3 },
          { id: 'ssc-biology-ch3-t4', name: 'অনিয়ন্ত্রিত মাইটোসিস, টিউমার ও ক্যান্সার', serial: 4 },
          { id: 'ssc-biology-ch3-t5', name: 'মায়োসিস কোষ বিভাজন ও এর তাৎপর্য', serial: 5 },
        ],
      },
      {
        id: 'ssc-biology-ch4',
        name: 'জীবনী শক্তি',
        topics: [
          { id: 'ssc-biology-ch4-t1', name: 'ATP এবং জৈব মুদ্রা (Biological Currency)', serial: 1 },
          { id: 'ssc-biology-ch4-t2', name: 'সালোকসংশ্লেষণ (আলোক পর্যায় ও অন্ধকার পর্যায় - ক্যালভিন চক্র ও হ্যাচ-স্ল্যাক চক্র)', serial: 2 },
          { id: 'ssc-biology-ch4-t3', name: 'সালোকসংশ্লেষণের প্রভাবকসমূহ ও গুরুত্ব', serial: 3 },
          { id: 'ssc-biology-ch4-t4', name: 'শ্বসন (সবাত শ্বসন - গ্লাইকোলাইসিস, অ্যাসিটাইল Co-A, ক্রেবস চক্র, ETC এবং অবাত শ্বসন)', serial: 4 },
          { id: 'ssc-biology-ch4-t5', name: 'শ্বসনের প্রভাবকসমূহ ও গুরুত্ব', serial: 5 },
        ],
      },
      {
        id: 'ssc-biology-ch5',
        name: 'খাদ্য, পুষ্টি এবং পরিপাক',
        topics: [
          { id: 'ssc-biology-ch5-t1', name: 'উদ্ভিদের খনিজ পুষ্টি (ম্যাক্রো ও মাইক্রো উপাদান)', serial: 1 },
          { id: 'ssc-biology-ch5-t2', name: 'উদ্ভিদের পুষ্টি উপাদানের অভাবজনিত লক্ষণ', serial: 2 },
          { id: 'ssc-biology-ch5-t3', name: 'প্রাণীর খাদ্যের প্রধান উপাদান (শর্করা, আমিষ, স্নেহ, ভিটামিন, খনিজ লবণ ও পানি)', serial: 3 },
          { id: 'ssc-biology-ch5-t4', name: 'পুষ্টির অভাবজনিত রোগ (রিকেটস, স্কার্ভি, গয়টার, অ্যানিমিয়া, কোয়াশিওরকর)', serial: 4 },
          { id: 'ssc-biology-ch5-t5', name: 'মানব পৌষ্টিকতন্ত্র ও পরিপাক গ্রন্থি', serial: 5 },
          { id: 'ssc-biology-ch5-t6', name: 'খাদ্য পরিপাক ও শোষণ প্রক্রিয়া', serial: 6 },
          { id: 'ssc-biology-ch5-t7', name: 'BMI ও BMR হিসাব', serial: 7 },
        ],
      },
      {
        id: 'ssc-biology-ch6',
        name: 'জীবে পরিবহন',
        topics: [
          { id: 'ssc-biology-ch6-t1', name: 'উদ্ভিদে পানি ও খনিজ লবণ শোষণ (ইমবাইবিশন, ব্যাপন ও অভিস্রবণ)', serial: 1 },
          { id: 'ssc-biology-ch6-t2', name: 'প্রস্বেদন (পত্ররন্ধ্রীয়, কিউটিকুলার, লেন্টিকুলার) ও প্রস্বেদনের গুরুত্ব', serial: 2 },
          { id: 'ssc-biology-ch6-t3', name: 'উদ্ভিদে রস উত্তোলন ও পরিবহন', serial: 3 },
          { id: 'ssc-biology-ch6-t4', name: 'মানব রক্তের উপাদান ও কার্যাবলী (প্লাজমা, লোহিত, শ্বেত রক্তকণিকা ও অণুচক্রিকা)', serial: 4 },
          { id: 'ssc-biology-ch6-t5', name: 'রক্তের গ্রুপ ও রক্ত সঞ্চালন', serial: 5 },
          { id: 'ssc-biology-ch6-t6', name: 'হৃদপিণ্ডের গঠন ও রক্ত সংবহনতন্ত্র', serial: 6 },
          { id: 'ssc-biology-ch6-t7', name: 'রক্তচাপ, কোলেস্টেরল, হার্ট অ্যাটাক ও স্ট্রোক', serial: 7 },
        ],
      },
      {
        id: 'ssc-biology-ch7',
        name: 'গ্যাসীয় বিনিময়',
        topics: [
          { id: 'ssc-biology-ch7-t1', name: 'উদ্ভিদে গ্যাসীয় বিনিময় (অক্সিজেন ও কার্বন ডাই-অক্সাইড)', serial: 1 },
          { id: 'ssc-biology-ch7-t2', name: 'মানব শ্বসনতন্ত্রের গঠন (নাসারন্ধ্র, ট্রাকিয়া, ব্রঙ্কাস, ফুসফুস, অ্যালভিওলাই)', serial: 2 },
          { id: 'ssc-biology-ch7-t3', name: 'প্রশ্বাস-নিঃশ্বাস কার্যক্রম ও ফুসফুসে গ্যাসীয় বিনিময়', serial: 3 },
          { id: 'ssc-biology-ch7-t4', name: 'ফুসফুসের বিভিন্ন রোগ (অ্যাজমা, ব্রঙ্কাইটিস, যক্ষ্মা, নিউমোনিয়া ও ফুসফুসের ক্যান্সার)', serial: 4 },
        ],
      },
      {
        id: 'ssc-biology-ch8',
        name: 'মানব রেচন',
        topics: [
          { id: 'ssc-biology-ch8-t1', name: 'রেচন ও রেচনতন্ত্রের গঠন', serial: 1 },
          { id: 'ssc-biology-ch8-t2', name: 'বৃক্ক বা কিডনির গঠন ও নেফ্রনের কার্যপ্রণালী', serial: 2 },
          { id: 'ssc-biology-ch8-t3', name: 'মূত্র তৈরি ও নাইট্রোজেনঘটিত বর্জ্য নিষ্কাশন', serial: 3 },
          { id: 'ssc-biology-ch8-t4', name: 'কিডনি বিকল, ডায়ালিসিস ও কিডনি সংযোজন', serial: 4 },
          { id: 'ssc-biology-ch8-t5', name: 'কিডনিতে পাথর ও সুস্থ থাকার উপায়', serial: 5 },
        ],
      },
      {
        id: 'ssc-biology-ch9',
        name: 'দৃঢ়তা প্রদান ও চলন',
        topics: [
          { id: 'ssc-biology-ch9-t1', name: 'মানব কঙ্কালতন্ত্রের ভূমিকা ও প্রধান অস্থিসমূহ', serial: 1 },
          { id: 'ssc-biology-ch9-t2', name: 'অস্থি ও তরুণাস্থি এর তুলনা', serial: 2 },
          { id: 'ssc-biology-ch9-t3', name: 'অস্থিসন্ধি (সাইনোভিয়াল অস্থিসন্ধি) ও এর প্রকারভেদ', serial: 3 },
          { id: 'ssc-biology-ch9-t4', name: 'পেশির প্রকারভেদ ও চলনে পেশির ভূমিকা', serial: 4 },
          { id: 'ssc-biology-ch9-t5', name: 'টেনডন ও লিগামেন্ট', serial: 5 },
          { id: 'ssc-biology-ch9-t6', name: 'অস্থি সংক্রান্ত রোগ (অস্টিওপোরোসিস, বাতজ্বর)', serial: 6 },
        ],
      },
      {
        id: 'ssc-biology-ch10',
        name: 'সমন্বয় ও নিয়ন্ত্রণ',
        topics: [
          { id: 'ssc-biology-ch10-t1', name: 'উদ্ভিদের হরমোন বা ফাইটোহরমোন (অক্সিন, জিব্বেরেলিন, সাইটোকাইনিন, ইথিলিন)', serial: 1 },
          { id: 'ssc-biology-ch10-t2', name: 'উদ্ভিদের আলো ও অভিকর্ষ চলন (ট্রপিক চলন)', serial: 2 },
          { id: 'ssc-biology-ch10-t3', name: 'মানব স্নায়ুতন্ত্র (মস্তিষ্ক, সুষুম্নাকাণ্ড ও কেন্দ্রীয়/প্রান্তীয় স্নায়ুতন্ত্র)', serial: 3 },
          { id: 'ssc-biology-ch10-t4', name: 'নিউরনের গঠন ও স্নায়ু তাড়না পরিবহন (Synapse)', serial: 4 },
          { id: 'ssc-biology-ch10-t5', name: 'প্রতিবর্ত ক্রিয়া (Reflex Action)', serial: 5 },
          { id: 'ssc-biology-ch10-t6', name: 'অন্তঃক্ষরা গ্রন্থি ও মানবদেহে হরমোনের প্রভাব', serial: 6 },
        ],
      },
      {
        id: 'ssc-biology-ch11',
        name: 'জীবে প্রজনন',
        topics: [
          { id: 'ssc-biology-ch11-t1', name: 'প্রজননের ধারণা ও প্রকারভেদ (যৌন ও অযৌন প্রজনন)', serial: 1 },
          { id: 'ssc-biology-ch11-t2', name: 'একটি আদর্শ ফুলের বিভিন্ন স্তবক ও কাজ', serial: 2 },
          { id: 'ssc-biology-ch11-t3', name: 'পরাগায়ন (স্ব-পরাগায়ন ও পর-পরাগায়ন) ও মাধ্যমসমূহ', serial: 3 },
          { id: 'ssc-biology-ch11-t4', name: 'নিষেক প্রক্রিয়া ও ফল ও বীজ গঠন', serial: 4 },
          { id: 'ssc-biology-ch11-t5', name: 'মানব প্রজননতন্ত্র ও প্রজনন স্বাস্থ্য', serial: 5 },
          { id: 'ssc-biology-ch11-t6', name: 'ভ্রূণের বিকাশ ও অমরার (Placenta) ভূমিকা', serial: 6 },
          { id: 'ssc-biology-ch11-t7', name: 'যৌনবাহিত রোগ (AIDS, সিফিলিস, গনোরিয়া)', serial: 7 },
        ],
      },
      {
        id: 'ssc-biology-ch12',
        name: 'জীবের বংশগতি ও বিবর্তন',
        topics: [
          { id: 'ssc-biology-ch12-t1', name: 'বংশগতি ও বংশগতির উপাদান (DNA, RNA, ক্রোমোজোম ও জিন)', serial: 1 },
          { id: 'ssc-biology-ch12-t2', name: 'DNA রেপ্লিকেশন ও প্রোটিন সংশ্লেষণ', serial: 2 },
          { id: 'ssc-biology-ch12-t3', name: 'মেন্ডেলের সূত্রাবলী ও জিনতত্ত্বের প্রাথমিক ধারণা', serial: 3 },
          { id: 'ssc-biology-ch12-t4', name: 'মানুষের লিঙ্গ নির্ধারণ ও বর্ণান্ধতা/থ্যালাসেমিয়া রোগ', serial: 4 },
          { id: 'ssc-biology-ch12-t5', name: 'ডারউইনের বিবর্তনবাদ ও প্রাকৃতিক নির্বাচন মতবাদ', serial: 5 },
        ],
      },
      {
        id: 'ssc-biology-ch13',
        name: 'জীবের পরিবেশ',
        topics: [
          { id: 'ssc-biology-ch13-t1', name: 'বাস্তুতন্ত্রের উপাদানসমূহ (অজীব ও জীব উপাদান)', serial: 1 },
          { id: 'ssc-biology-ch13-t2', name: 'খাদ্য শৃঙ্খল, খাদ্য জাল ও ট্রফিক লেভেল', serial: 2 },
          { id: 'ssc-biology-ch13-t3', name: 'শক্তি প্রবাহ ও ১০% নীতি', serial: 3 },
          { id: 'ssc-biology-ch13-t4', name: 'পুষ্টি প্রবাহ (কার্বন চক্র ও নাইট্রোজেন চক্র)', serial: 4 },
          { id: 'ssc-biology-ch13-t5', name: 'আন্তঃক্রিয়া (সিমবায়োসিস, মিউচুয়ালিজম, কমেনসালিজম, প্রতিযোগিতা)', serial: 5 },
          { id: 'ssc-biology-ch13-t6', name: 'পরিবেশের ভারসাম্য ও জীববৈচিত্র্য সংরক্ষণ', serial: 6 },
        ],
      },
      {
        id: 'ssc-biology-ch14',
        name: 'জীব প্রযুক্তি',
        topics: [
          { id: 'ssc-biology-ch14-t1', name: 'জীবপ্রযুক্তির ধারণা ও পরিধি', serial: 1 },
          { id: 'ssc-biology-ch14-t2', name: 'টিস্যু কালচার প্রযুক্তি ও এর ধাপসমূহ', serial: 2 },
          { id: 'ssc-biology-ch14-t3', name: 'রিকম্বিনেন্ট DNA প্রযুক্তি (জেনেটিক ইঞ্জিনিয়ারিং)', serial: 3 },
          { id: 'ssc-biology-ch14-t4', name: 'ট্রান্সজেনিক উদ্ভিদ ও প্রাণী (GMO)', serial: 4 },
          { id: 'ssc-biology-ch14-t5', name: 'কৃষি ও চিকিৎসাক্ষেত্রে জীবপ্রযুক্তির ব্যবহার ও সামাজিক প্রভাব', serial: 5 },
        ],
      },
    ],
  },
  {
    id: 'ssc-higher-math',
    name: 'SSC উচ্চতর গণিত',
    icon: Sigma,
    group: 'Science',
    chapters: [
      {
        id: 'ssc-higher-math-ch1',
        name: 'সেট ও ফাংশন',
        topics: [
          { id: 'ssc-higher-math-ch1-t1', name: 'সার্বিক সেট, পূরক সেট ও উপসেট সংক্রান্ত গভীর সমস্যা', serial: 1 },
          { id: 'ssc-higher-math-ch1-t2', name: 'সেটের বীজগণিতীয় সূত্রাবলী ও ভেনচিত্র ভিত্তিক প্রমাণ', serial: 2 },
          { id: 'ssc-higher-math-ch1-t3', name: 'অন্বয়, এক-এক ফাংশন ও সার্বিক (On-to) ফাংশন', serial: 3 },
          { id: 'ssc-higher-math-ch1-t4', name: 'ফাংশনের ডোমেন ও রেঞ্জ নির্ণয়', serial: 4 },
          { id: 'ssc-higher-math-ch1-t5', name: 'বিপরীত ফাংশন (Inverse Function)', serial: 5 },
        ],
      },
      {
        id: 'ssc-higher-math-ch2',
        name: 'বীজগাণিতিক রাশি',
        topics: [
          { id: 'ssc-higher-math-ch2-t1', name: 'বহুপদী, মাত্রা ও সমমাত্রিক-প্রতিসম-চক্র-ক্রমিক রাশি', serial: 1 },
          { id: 'ssc-higher-math-ch2-t2', name: 'উৎপাদক উপপাদ্য ও ভাগশেষ উপপাদ্য', serial: 2 },
          { id: 'ssc-higher-math-ch2-t3', name: 'আংশিক ভগ্নাংশে প্রকাশ (বিভিন্ন শর্তাধীন ৫টি নিয়ম)', serial: 3 },
          { id: 'ssc-higher-math-ch2-t4', name: 'চক্র-ক্রমিক রাশির উৎপাদকে বিশ্লেষণ', serial: 4 },
        ],
      },
      {
        id: 'ssc-higher-math-ch3',
        name: 'জ্যামিতি',
        topics: [
          { id: 'ssc-higher-math-ch3-t1', name: 'অ্যাপোলোনিয়াসের উপপাদ্য ও প্রমাণ', serial: 1 },
          { id: 'ssc-higher-math-ch3-t2', name: 'ব্রহ্মগুপ্তের উপপাদ্য ও টলেমির উপপাদ্য', serial: 2 },
          { id: 'ssc-higher-math-ch3-t3', name: 'ভরকেন্দ্র, পরিকেন্দ্র ও লম্ববিন্দুর সম্পর্ক (অয়লার রেখা)', serial: 3 },
          { id: 'ssc-higher-math-ch3-t4', name: 'নববিন্দু বৃত্ত ও এর ধর্মাবলী', serial: 4 },
        ],
      },
      {
        id: 'ssc-higher-math-ch4',
        name: 'জ্যামিতিক অঙ্কন',
        topics: [
          { id: 'ssc-higher-math-ch4-t1', name: 'ত্রিভুজ সংক্রান্ত বিশেষ সম্পাদ্য (ভূমি, শিরঃকোণ ও অন্তরের সম্পর্ক)', serial: 1 },
          { id: 'ssc-higher-math-ch4-t2', name: 'নির্দিষ্ট ক্ষেত্রফলবিশিষ্ট বৃত্ত ও স্পর্শক অঙ্কন', serial: 2 },
          { id: 'ssc-higher-math-ch4-t3', name: 'বৃত্তে অন্তর্লিখিত ও পরিলিখিত বহুভুজ অঙ্কন', serial: 3 },
        ],
      },
      {
        id: 'ssc-higher-math-ch5',
        name: 'সমীকরণ',
        topics: [
          { id: 'ssc-higher-math-ch5-t1', name: 'দ্বিঘাত সমীকরণ ($ax^2+bx+c=0$) ও মূলের প্রকৃতি যাচাই (পৃথায়ক $D$)', serial: 1 },
          { id: 'ssc-higher-math-ch5-t2', name: 'সূচকীয় সমীকরণ সমাধান', serial: 2 },
          { id: 'ssc-higher-math-ch5-t3', name: 'দুই চলকবিশিষ্ট দ্বিঘাত সহসমীকরণ সমাধান', serial: 3 },
          { id: 'ssc-higher-math-ch5-t4', name: 'বাস্তবভিত্তিক সমীকরণ গঠন ও সমাধান', serial: 4 },
        ],
      },
      {
        id: 'ssc-higher-math-ch6',
        name: 'অসমতা',
        topics: [
          { id: 'ssc-higher-math-ch6-t1', name: 'এক চলকবিশিষ্ট রৈখিক অসমতা', serial: 1 },
          { id: 'ssc-higher-math-ch6-t2', name: 'দুই চলকবিশিষ্ট রৈখিক অসমতা ও এর লেখচিত্র', serial: 2 },
          { id: 'ssc-higher-math-ch6-t3', name: 'পরমমান সম্বলিত অসমতা সমাধান', serial: 3 },
        ],
      },
      {
        id: 'ssc-higher-math-ch7',
        name: 'অসীম ধারা',
        topics: [
          { id: 'ssc-higher-math-ch7-t1', name: 'অনুক্রমের সীমা ও অসীমতক ধারা', serial: 1 },
          { id: 'ssc-higher-math-ch7-t2', name: 'অনন্ত গুণোত্তর ধারা ও এর সমষ্টি ($S_\infty = \frac{a}{1-r}$)', serial: 2 },
          { id: 'ssc-higher-math-ch7-t3', name: 'অসীমতক সমষ্টি থাকার শর্ত ($|r| < 1$)', serial: 3 },
          { id: 'ssc-higher-math-ch7-t4', name: 'আবৃত দশমিক ভগ্নাংশকে সাধারণ ভগ্নাংশে রূপান্তর', serial: 4 },
        ],
      },
      {
        id: 'ssc-higher-math-ch8',
        name: 'ত্রিকোণমিতি',
        topics: [
          { id: 'ssc-higher-math-ch8-t1', name: 'রেডিয়ান কোণ ও বৃত্তীয় পরিমাপ ($s = r\theta, A = \frac{1}{2}r^2\theta$)', serial: 1 },
          { id: 'ssc-higher-math-ch8-t2', name: 'যেকোনো পরিমাপের কোণের ত্রিকোণমিতিক অনুপাত ($n\cdot 90^\circ \pm \theta$)', serial: 2 },
          { id: 'ssc-higher-math-ch8-t3', name: 'ত্রিকোণমিতিক অভেদাবলী ও প্রমাণ', serial: 3 },
          { id: 'ssc-higher-math-ch8-t4', name: 'ত্রিকোণমিতিক সমীকরণ সমাধান ($0^\circ \le \theta \le 360^\circ$)', serial: 4 },
        ],
      },
      {
        id: 'ssc-higher-math-ch9',
        name: 'সূচকীয় ও লগারিদমীয় ফাংশন',
        topics: [
          { id: 'ssc-higher-math-ch9-t1', name: 'সূচকীয় ফাংশন ও এর লেখচিত্র', serial: 1 },
          { id: 'ssc-higher-math-ch9-t2', name: 'লগারিদমীয় ফাংশন ও ডোমেন-রেঞ্জ', serial: 2 },
          { id: 'ssc-higher-math-ch9-t3', name: 'সূচক ও লগারিদমের জটিল মান নির্ণয় ও প্রমাণ', serial: 3 },
        ],
      },
      {
        id: 'ssc-higher-math-ch10',
        name: 'দ্বিপদী বিস্তৃতি',
        topics: [
          { id: 'ssc-higher-math-ch10-t1', name: 'প্যাসকেলের ত্রিভুজ সূত্রের সাহায্যে দ্বিপদী বিস্তৃতি', serial: 1 },
          { id: 'ssc-higher-math-ch10-t2', name: 'দ্বিপদী উপপাদ্য ও $(a+x)^n$ এর সাধারণ পদ ($T_{r+1} = \binom{n}{r} a^{n-r} x^r$)', serial: 2 },
          { id: 'ssc-higher-math-ch10-t3', name: 'মধ্যপদ ও $x$-বর্জিত পদ নির্ণয়', serial: 3 },
          { id: 'ssc-higher-math-ch10-t4', name: 'ঋণাত্মক ও ভগ্নাংশ ঘাতের জন্য দ্বিপদী বিস্তৃতি', serial: 4 },
        ],
      },
      {
        id: 'ssc-higher-math-ch11',
        name: 'স্থানাঙ্ক জ্যামিতি',
        topics: [
          { id: 'ssc-higher-math-ch11-t1', name: 'কার্তেসীয় স্থানাঙ্ক ও দুই বিন্দুর মধ্যবর্তী দূরত্ব', serial: 1 },
          { id: 'ssc-higher-math-ch11-t2', name: 'ত্রিভুজ ও চতুর্ভুজের ক্ষেত্রফল নির্ণয় (স্থানাঙ্ক পদ্ধতিতে)', serial: 2 },
          { id: 'ssc-higher-math-ch11-t3', name: 'সরলরেখার ঢাল ($m = \frac{y_2-y_1}{x_2-x_1}$)', serial: 3 },
          { id: 'ssc-higher-math-ch11-t4', name: 'সরলরেখার সমীকরণ ($y = mx+c, y-y_1 = m(x-x_1)$)', serial: 4 },
          { id: 'ssc-higher-math-ch11-t5', name: 'সমান্তরাল ও লম্ব রেখার শর্ত', serial: 5 },
        ],
      },
      {
        id: 'ssc-higher-math-ch12',
        name: 'সমতলীয় ভেক্টর',
        topics: [
          { id: 'ssc-higher-math-ch12-t1', name: 'দিক নির্দেশক রেখাংশ ও ভেক্টরের সংজ্ঞা', serial: 1 },
          { id: 'ssc-higher-math-ch12-t2', name: 'ভেক্টরের যোগ (ত্রিভুজ বিধি ও সামান্তরিক বিধি)', serial: 2 },
          { id: 'ssc-higher-math-ch12-t3', name: 'অবস্থান ভেক্টর, একক ভেক্টর ও শূন্য ভেক্টর', serial: 3 },
          { id: 'ssc-higher-math-ch12-t4', name: 'ভেক্টর পদ্ধতিতে জ্যামিতিক উপপাদ্য প্রমাণ', serial: 4 },
        ],
      },
      {
        id: 'ssc-higher-math-ch13',
        name: 'ঘন জ্যামিতি',
        topics: [
          { id: 'ssc-higher-math-ch13-t1', name: 'সমতল, সরলরেখা ও ত্রিমাত্রিক দেশের ধারণা', serial: 1 },
          { id: 'ssc-higher-math-ch13-t2', name: 'আয়তাকার ঘনবস্তু, ঘনক ও বেলন (আয়তন ও সমগ্রতলের ক্ষেত্রফল)', serial: 2 },
          { id: 'ssc-higher-math-ch13-t3', name: 'গোলক ও কোনকের ক্ষেত্রফল ও আয়তন', serial: 3 },
        ],
      },
      {
        id: 'ssc-higher-math-ch14',
        name: 'সম্ভাবনা',
        topics: [
          { id: 'ssc-higher-math-ch14-t1', name: 'দৈব পরীক্ষা, ঘটনা, নমুনা ক্ষেত্র ও নমুনা বিন্দু', serial: 1 },
          { id: 'ssc-higher-math-ch14-t2', name: 'সমসম্ভাব্য ঘটনা ও সম্ভাবনার মৌলিক সূত্র ($P(E) = \frac{n(E)}{n(S)}$)', serial: 2 },
          { id: 'ssc-higher-math-ch14-t3', name: 'সম্ভাবনা বৃক্ষ (Probability Tree)', serial: 3 },
          { id: 'ssc-higher-math-ch14-t4', name: 'বাস্তবভিত্তিক সম্ভাবনার সমস্যা সমাধান', serial: 4 },
        ],
      },
    ],
  },
  {
    id: 'ssc-accounting',
    name: 'SSC হিসাববিজ্ঞান',
    icon: BarChart3,
    group: 'Business Studies',
    chapters: [
      {
        id: 'ssc-accounting-ch1',
        name: 'হিসাববিজ্ঞান পরিচিতি',
        topics: [
          { id: 'ssc-accounting-ch1-t1', name: 'হিসাববিজ্ঞানের ধারণা, উদ্দেশ্য ও প্রয়োজনীয়তা', serial: 1 },
          { id: 'ssc-accounting-ch1-t2', name: 'হিসাবতথ্যের ব্যবহারকারী (অভ্যন্তরীণ ও বাহ্যিক)', serial: 2 },
          { id: 'ssc-accounting-ch1-t3', name: 'হিসাববিজ্ঞানের উৎপত্তি ও ক্রমবিকাশ (লুকা প্যাসিওলি)', serial: 3 },
          { id: 'ssc-accounting-ch1-t4', name: 'মূল্যবোধ ও জবাবদিহিতায় হিসাববিজ্ঞান', serial: 4 },
        ],
      },
      {
        id: 'ssc-accounting-ch2',
        name: 'লেনদেন',
        topics: [
          { id: 'ssc-accounting-ch2-t1', name: 'লেনদেনের প্রকৃতি ও বৈশিষ্ট্য', serial: 1 },
          { id: 'ssc-accounting-ch2-t2', name: 'হিসাব সমীকরণ ($A = L + E$) ও লেনদেনের প্রভাব', serial: 2 },
          { id: 'ssc-accounting-ch2-t3', name: 'চালান, ভাউচার, ক্যাশমেমো ও ডেবিট/ক্রেডিট নোট', serial: 3 },
        ],
      },
      {
        id: 'ssc-accounting-ch3',
        name: 'দু\'তরফা দাখিলা পদ্ধতি',
        topics: [
          { id: 'ssc-accounting-ch3-t1', name: 'দু\'তরফা দাখিলা পদ্ধতির মূলনীতি ও বৈশিষ্ট্য', serial: 1 },
          { id: 'ssc-accounting-ch3-t2', name: 'ডেবিট ও ক্রেডিট নির্ণয়ের নিয়মাবলী (সম্পদ, দায়, মূলধন, আয়, ব্যয়)', serial: 2 },
          { id: 'ssc-accounting-ch3-t3', name: 'হিসাবচক্রের বিভিন্ন ধাপ', serial: 3 },
        ],
      },
      {
        id: 'ssc-accounting-ch4',
        name: 'মূলধন ও মুনাফা জাতীয় লেনদেন',
        topics: [
          { id: 'ssc-accounting-ch4-t1', name: 'মূলধন ও মুনাফা জাতীয় লেনদেনের পার্থক্য', serial: 1 },
          { id: 'ssc-accounting-ch4-t2', name: 'মূলধন জাতীয় প্রাপ্তি, আয় ও ব্যয়', serial: 2 },
          { id: 'ssc-accounting-ch4-t3', name: 'মুনাফা জাতীয় প্রাপ্তি, আয় ও ব্যয়', serial: 3 },
          { id: 'ssc-accounting-ch4-t4', name: 'বিলম্বিত মুনাফা জাতীয় ব্যয়', serial: 4 },
        ],
      },
      {
        id: 'ssc-accounting-ch5',
        name: 'হিসাব',
        topics: [
          { id: 'ssc-accounting-ch5-t1', name: 'হিসাবের ধারণা ও শ্রেণিবিভাগ (সনাতন ও আধুনিক পদ্ধতি)', serial: 1 },
          { id: 'ssc-accounting-ch5-t2', name: 'টি-ছক ও চলমান জের ছক', serial: 2 },
        ],
      },
      {
        id: 'ssc-accounting-ch6',
        name: 'জাবেদা',
        topics: [
          { id: 'ssc-accounting-ch6-t1', name: 'জাবেদার গুরুত্ব ও প্রয়োজনীয়তা', serial: 1 },
          { id: 'ssc-accounting-ch6-t2', name: 'সাধারণ জাবেদা ও বিশেষ জাবেদা (ক্রয়, বিক্রয়, ক্রয় ফেরত, বিক্রয় ফেরত, নগদ প্রাপ্তি, নগদ প্রদান জাবেদা)', serial: 2 },
          { id: 'ssc-accounting-ch6-t3', name: 'বাট্টা (কারবারি বাট্টা ও নগদ বাট্টা) সংক্রান্ত জাবেদা', serial: 3 },
        ],
      },
      {
        id: 'ssc-accounting-ch7',
        name: 'খতিয়ান',
        topics: [
          { id: 'ssc-accounting-ch7-t1', name: 'খতিয়ানের ধারণা ও জাবেদা থেকে খতিয়ানে স্থানান্তর (Posting)', serial: 1 },
          { id: 'ssc-accounting-ch7-t2', name: 'খতিয়ানের জের টানা (Balancing)', serial: 2 },
          { id: 'ssc-accounting-ch7-t3', name: 'সহকারী খতিয়ান ও সাধারণ খতিয়ান', serial: 3 },
        ],
      },
      {
        id: 'ssc-accounting-ch8',
        name: 'নগদান বই',
        topics: [
          { id: 'ssc-accounting-ch8-t1', name: 'একঘরা, দুঘরা ও তিনঘরা নগদান বই', serial: 1 },
          { id: 'ssc-accounting-ch8-t2', name: 'কন্ট্রা এন্ট্রি (বিপরীত দাখিলা) ও বাট্টা দাখিলা', serial: 2 },
          { id: 'ssc-accounting-ch8-t3', name: 'খুচরা নগদান বই (অগ্রদত্ত পদ্ধতি)', serial: 3 },
        ],
      },
      {
        id: 'ssc-accounting-ch9',
        name: 'রেওয়ামিল',
        topics: [
          { id: 'ssc-accounting-ch9-t1', name: 'রেওয়ামিলের উদ্দেশ্য ও ছক', serial: 1 },
          { id: 'ssc-accounting-ch9-t2', name: 'রেওয়ামিলে অন্তর্ভুক্ত না হওয়া ভুলসমূহ', serial: 2 },
          { id: 'ssc-accounting-ch9-t3', name: 'অনিশ্চিত হিসাবের মাধ্যমে রেওয়ামিল মিলকরণ', serial: 3 },
        ],
      },
      {
        id: 'ssc-accounting-ch10',
        name: 'আর্থিক বিবরণী',
        topics: [
          { id: 'ssc-accounting-ch10-t1', name: 'বিশদ আয় বিবরণী (মোট লাভ ও নিট লাভ নির্ণয়)', serial: 1 },
          { id: 'ssc-accounting-ch10-t2', name: 'মালিকানাস্বত্ব বিবরণী', serial: 2 },
          { id: 'ssc-accounting-ch10-t3', name: 'আর্থিক অবস্থার বিবরণী (সম্পদ ও দায়ের শ্রেণিবিভাগ)', serial: 3 },
          { id: 'ssc-accounting-ch10-t4', name: 'সমন্বয় দাখিলা ও সমন্বিত জের', serial: 4 },
        ],
      },
      {
        id: 'ssc-accounting-ch11',
        name: 'পণ্য ক্রয়, বিক্রয়, পরিবহন ও ফেরত সংক্রান্ত হিসাব',
        topics: [
          { id: 'ssc-accounting-ch11-t1', name: 'ক্রয় ও বিক্রয় জাবেদা লিখন', serial: 1 },
          { id: 'ssc-accounting-ch11-t2', name: 'আন্তঃপরিবহন ও বহিঃপরিবহন হিসাব', serial: 2 },
          { id: 'ssc-accounting-ch11-t3', name: 'ক্রয় ফেরত ও বিক্রয় ফেরত দাখিলা', serial: 3 },
        ],
      },
      {
        id: 'ssc-accounting-ch12',
        name: 'পারিবারিক ও আত্মকর্মসংস্থানমূলক উদ্যোগের হিসাব',
        topics: [
          { id: 'ssc-accounting-ch12-t1', name: 'পারিবারিক হিসাবের ধারণা ও বাজেট প্রণয়ন', serial: 1 },
          { id: 'ssc-accounting-ch12-t2', name: 'পারিবারিক প্রাপ্তি ও প্রদান হিসাব', serial: 2 },
          { id: 'ssc-accounting-ch12-t3', name: 'আয়-ব্যয় বিবরণী ও পারিবারিক তহবিল গঠন', serial: 3 },
        ],
      },
    ],
  },
  {
    id: 'ssc-business-ent',
    name: 'SSC ব্যবসায় উদ্যোগ',
    icon: Briefcase,
    group: 'Business Studies',
    chapters: [
      {
        id: 'ssc-business-ent-ch1',
        name: 'ব্যবসায় পরিচিতি',
        topics: [
          { id: 'ssc-business-ent-ch1-t1', name: 'ব্যবসায়ের ধারণা, উৎপত্তি ও ক্রমবিকাশ', serial: 1 },
          { id: 'ssc-business-ent-ch1-t2', name: 'ব্যবসায়ের আওতা ও প্রকারভেদ (শিল্প, বাণিজ্য ও প্রত্যক্ষ সেবা)', serial: 2 },
          { id: 'ssc-business-ent-ch1-t3', name: 'ব্যবসায় পরিবেশ ও বাংলাদেশের ব্যবসায়িক পরিবেশের উপাদানসমূহ', serial: 3 },
        ],
      },
      {
        id: 'ssc-business-ent-ch2',
        name: 'ব্যবসায় উদ্যোগ ও উদ্যোক্তা',
        topics: [
          { id: 'ssc-business-ent-ch2-t1', name: 'ব্যবসায় উদ্যোগের ধারণা ও বৈশিষ্ট্য', serial: 1 },
          { id: 'ssc-business-ent-ch2-t2', name: 'সফল উদ্যোক্তার গুণাবলী', serial: 2 },
          { id: 'ssc-business-ent-ch2-t3', name: 'অর্থনৈতিক উন্নয়নে ব্যবসায় উদ্যোগের ভূমিকা', serial: 3 },
        ],
      },
      {
        id: 'ssc-business-ent-ch3',
        name: 'আত্মকর্মসংস্থান',
        topics: [
          { id: 'ssc-business-ent-ch3-t1', name: 'আত্মকর্মসংস্থানের ধারণা ও প্রয়োজনীয়তা', serial: 1 },
          { id: 'ssc-business-ent-ch3-t2', name: 'আত্মকর্মসংস্থানে উপযুক্ত ক্ষেত্র নির্বাচন ও প্রশিক্ষণ প্রতিষ্ঠানের ভূমিকা', serial: 2 },
        ],
      },
      {
        id: 'ssc-business-ent-ch4',
        name: 'মালিকানার ভিত্তিতে ব্যবসায়',
        topics: [
          { id: 'ssc-business-ent-ch4-t1', name: 'একমালিকানা ব্যবসায় ও অংশীদারি ব্যবসায়', serial: 1 },
          { id: 'ssc-business-ent-ch4-t2', name: 'যৌথ মূলধনি কোম্পানি ও এর প্রকারভেদ', serial: 2 },
          { id: 'ssc-business-ent-ch4-t3', name: 'সমবায় সমিতি ও রাষ্ট্রীয় ব্যবসায়', serial: 3 },
        ],
      },
      {
        id: 'ssc-business-ent-ch5',
        name: 'ব্যবসায়ের আইনগত দিক',
        topics: [
          { id: 'ssc-business-ent-ch5-t1', name: 'ট্রেড লাইসেন্স ও ট্রেডমার্ক', serial: 1 },
          { id: 'ssc-business-ent-ch5-t2', name: 'কপিরাইট, পেটেন্ট ও বিমা চুক্তি', serial: 2 },
          { id: 'ssc-business-ent-ch5-t3', name: 'পরিবেশ দূষণমুক্ত ছাড়পত্র ও ভোক্তা অধিকার সংরক্ষণ', serial: 3 },
        ],
      },
      {
        id: 'ssc-business-ent-ch6',
        name: 'ব্যবসায় পরিকল্পনা',
        topics: [
          { id: 'ssc-business-ent-ch6-t1', name: 'ব্যবসায় পরিকল্পনার ধারণা ও গুরুত্ব', serial: 1 },
          { id: 'ssc-business-ent-ch6-t2', name: 'প্রকল্প নির্বাচন ও সম্ভাব্যতা যাচাই (Feasibility Study)', serial: 2 },
          { id: 'ssc-business-ent-ch6-t3', name: 'ম্যাক্রো ও মাইক্রো স্ক্রিনিং', serial: 3 },
        ],
      },
      {
        id: 'ssc-business-ent-ch7',
        name: 'বাংলাদেশের শিল্প',
        topics: [
          { id: 'ssc-business-ent-ch7-t1', name: 'শিল্পের শ্রেণিবিভাগ (বৃহৎ, মাঝারি, ক্ষুদ্র ও কুটির শিল্প)', serial: 1 },
          { id: 'ssc-business-ent-ch7-t2', name: 'কুটির ও ক্ষুদ্র শিল্পের গুরুত্ব এবং সমস্যা সমাধানের উপায়', serial: 2 },
        ],
      },
      {
        id: 'ssc-business-ent-ch8',
        name: 'ব্যবসায় প্রতিষ্ঠানের ব্যবস্থাপনা',
        topics: [
          { id: 'ssc-business-ent-ch8-t1', name: 'ব্যবস্থাপনার ধারণা ও মূল কার্যাবলী (পরিকল্পনা, সংগঠন, কর্মীসংস্থান, নির্দেশনা, প্রেষণা, সমন্বয়, নিয়ন্ত্রণ)', serial: 1 },
          { id: 'ssc-business-ent-ch8-t2', name: 'নেতৃত্ব ও নেতৃত্বের প্রকারভেদ', serial: 2 },
        ],
      },
      {
        id: 'ssc-business-ent-ch9',
        name: 'বিপণন',
        topics: [
          { id: 'ssc-business-ent-ch9-t1', name: 'বিপণন বা মার্কেটিং এর ধারণা ও কার্যাবলী', serial: 1 },
          { id: 'ssc-business-ent-ch9-t2', name: 'বিজ্ঞাপন ও প্রচারের মাধ্যম', serial: 2 },
          { id: 'ssc-business-ent-ch9-t3', name: 'বিক্রয়িকতা ও আদর্শ বিক্রয়কর্মীর গুণাবলী', serial: 3 },
        ],
      },
      {
        id: 'ssc-business-ent-ch10',
        name: 'ব্যবসায় উদ্যোগ উন্নয়নে সহায়ক সেবা',
        topics: [
          { id: 'ssc-business-ent-ch10-t1', name: 'সহায়ক সেবার ধারণা ও সরকারি-বেসরকারি প্রতিষ্ঠানসমূহ (BSCIC, যুব উন্নয়ন অধিদপ্তর, ব্যাংক)', serial: 1 },
          { id: 'ssc-business-ent-ch10-t2', name: 'ঋণ সহায়তা ও উদ্যোক্তা প্রশিক্ষণ', serial: 2 },
        ],
      },
      {
        id: 'ssc-business-ent-ch11',
        name: 'ব্যবসায়ে নৈতিকতা ও সামাজিক দায়বদ্ধতা',
        topics: [
          { id: 'ssc-business-ent-ch11-t1', name: 'ব্যবসায়িক মূল্যবোধ ও নৈতিকতা', serial: 1 },
          { id: 'ssc-business-ent-ch11-t2', name: 'ভোক্তা ও সমাজের প্রতি ব্যবসায়ের দায়িত্ব', serial: 2 },
          { id: 'ssc-business-ent-ch11-t3', name: 'পরিবেশ সংরক্ষণে ব্যবসায়ের দায়বদ্ধতা', serial: 3 },
        ],
      },
      {
        id: 'ssc-business-ent-ch12',
        name: 'সফল উদ্যোক্তাদের জীবনীর থেকে শিক্ষণীয়',
        topics: [
          { id: 'ssc-business-ent-ch12-t1', name: 'আমেরিকান ও ইউরোপিয়ান সফল উদ্যোক্তা', serial: 1 },
          { id: 'ssc-business-ent-ch12-t2', name: 'বাংলাদেশের সফল উদ্যোক্তা ও শিল্পগোষ্ঠীর ইতিহাস', serial: 2 },
          { id: 'ssc-business-ent-ch12-t3', name: 'উদ্যোক্তা হিসেবে ব্যর্থতা কাটিয়ে ওঠার কৌশল', serial: 3 },
        ],
      },
    ],
  },
  {
    id: 'ssc-finance-banking',
    name: 'SSC ফিন্যাও্স ও ব্যাংকিং',
    icon: Landmark,
    group: 'Business Studies',
    chapters: [
      {
        id: 'ssc-finance-banking-ch1',
        name: 'অর্থায়ন ও ব্যবসায় অর্থায়ন',
        topics: [
          { id: 'ssc-finance-banking-ch1-t1', name: 'অর্থায়নের ধারণা ও ক্রমবিকাশ', serial: 1 },
          { id: 'ssc-finance-banking-ch1-t2', name: 'অর্থায়নের শ্রেণিবিভাগ ও নীতিসমূহ (তারল্য বনাম মুনাফা নীতি, উপযুক্ততার নীতি, বৈচিত্র্যায়নের নীতি)', serial: 2 },
          { id: 'ssc-finance-banking-ch1-t3', name: 'অর্থায়নের উৎস (অভ্যন্তরীণ ও বহিস্থ উৎস)', serial: 3 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch2',
        name: 'অর্থের সময়ের মূল্য',
        topics: [
          { id: 'ssc-finance-banking-ch2-t1', name: 'অর্থের সময়ের মূল্যের ধারণা ও সুযোগ ব্যয় (Opportunity Cost)', serial: 1 },
          { id: 'ssc-finance-banking-ch2-t2', name: 'বর্তমান মূল্য ও ভবিষ্যৎ মূল্য নির্ণয় ($FV = PV(1+i)^n$)', serial: 2 },
          { id: 'ssc-finance-banking-ch2-t3', name: 'বছরে একাধিকবার চক্রবৃদ্ধিকরণ ($FV = PV(1+\frac{i}{m})^{n \cdot m}$)', serial: 3 },
          { id: 'ssc-finance-banking-ch2-t4', name: 'প্রকৃত সুদের হার (EAR) নির্ণয়', serial: 4 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch3',
        name: 'ঝুঁকি ও অনিশ্চয়তা',
        topics: [
          { id: 'ssc-finance-banking-ch3-t1', name: 'ঝুঁকি ও অনিশ্চয়তার মধ্যে পার্থক্য', serial: 1 },
          { id: 'ssc-finance-banking-ch3-t2', name: 'ব্যবসায়িক ঝুঁকি ও আর্থিক ঝুঁকি', serial: 2 },
          { id: 'ssc-finance-banking-ch3-t3', name: 'ঝুঁকি পরিমাপের পদ্ধতি (আদর্শ বিচ্যুতি $\sigma$ নির্ণয়)', serial: 3 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch4',
        name: 'মূলধন ব্যয়',
        topics: [
          { id: 'ssc-finance-banking-ch4-t1', name: 'মূলধন ব্যয়ের ধারণা ও গুরুত্ব', serial: 1 },
          { id: 'ssc-finance-banking-ch4-t2', name: 'ঋণ মূলধন ব্যয় ও অগ্রাধিকার শেয়ার ব্যয়', serial: 2 },
          { id: 'ssc-finance-banking-ch4-t3', name: 'সাধারণ শেয়ার মূলধন ব্যয় ও সংরক্ষিত আয়ের ব্যয়', serial: 3 },
          { id: 'ssc-finance-banking-ch4-t4', name: 'গড় মূলধন ব্যয় (WACC) নির্ণয়', serial: 4 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch5',
        name: 'মূলধনী আয়-ব্যয় প্রাক্কলন',
        topics: [
          { id: 'ssc-finance-banking-ch5-t1', name: 'মূলধন বাজেটিং এর ধারণা ও গুরুত্ব', serial: 1 },
          { id: 'ssc-finance-banking-ch5-t2', name: 'গড় মুনাফার হার (ARR) পদ্ধতি', serial: 2 },
          { id: 'ssc-finance-banking-ch5-t3', name: 'পে-ব্যাক সময় (PBP) পদ্ধতি ও সিদ্ধান্ত গ্রহণ', serial: 3 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch6',
        name: 'শেয়ার, বন্ড ও ডিবেঞ্চার',
        topics: [
          { id: 'ssc-finance-banking-ch6-t1', name: 'সাধারণ শেয়ার ও অগ্রাধিকার শেয়ার', serial: 1 },
          { id: 'ssc-finance-banking-ch6-t2', name: 'বন্ড ও ডিবেঞ্চারের ধারণা ও বৈশিষ্ট্য', serial: 2 },
          { id: 'ssc-finance-banking-ch6-t3', name: 'শেয়ার বাজার ও বিনিয়োগ ঝুঁকি', serial: 3 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch7',
        name: 'ব্যাংক ব্যবস্থার প্রাথমিক ধারণা',
        topics: [
          { id: 'ssc-finance-banking-ch7-t1', name: 'ব্যাংকের উৎপত্তি ও ইতিহাস', serial: 1 },
          { id: 'ssc-finance-banking-ch7-t2', name: 'ব্যাংকের উদ্দেশ্য ও কার্যাবলী', serial: 2 },
          { id: 'ssc-finance-banking-ch7-t3', name: 'ব্যাংকার ও গ্রাহকের সম্পর্ক', serial: 3 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch8',
        name: 'কেন্দ্রীয় ব্যাংক',
        topics: [
          { id: 'ssc-finance-banking-ch8-t1', name: 'কেন্দ্রীয় ব্যাংকের ধারণা ও উদ্দেশ্য', serial: 1 },
          { id: 'ssc-finance-banking-ch8-t2', name: 'বাংলাদেশ ব্যাংকের কার্যাবলী ও নোট ইস্যু', serial: 2 },
          { id: 'ssc-finance-banking-ch8-t3', name: 'ঋণ নিয়ন্ত্রণ পদ্ধতিসমূহ ও নিকাশঘর (Clearing House)', serial: 3 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch9',
        name: 'বাণিজ্যিক ব্যাংক',
        topics: [
          { id: 'ssc-finance-banking-ch9-t1', name: 'বাণিজ্যিক ব্যাংকের উদ্দেশ্য ও কার্যাবলী', serial: 1 },
          { id: 'ssc-finance-banking-ch9-t2', name: 'বাণিজ্যিক ব্যাংকের আয়ের উৎস ও তহবিলের ব্যবহার', serial: 2 },
          { id: 'ssc-finance-banking-ch9-t3', name: 'ঋণ আমানত সৃষ্টি প্রক্রিয়া', serial: 3 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch10',
        name: 'ইলেকট্রনিক ব্যাংকিং',
        topics: [
          { id: 'ssc-finance-banking-ch10-t1', name: 'অনলাইন ব্যাংকিং, এটিএম (ATM) ও ডেবিট/ক্রেডিট কার্ড', serial: 1 },
          { id: 'ssc-finance-banking-ch10-t2', name: 'মোবাইল ব্যাংকিং (বিকাশ, নগদ ইত্যাদি) ও ইন্টারনেট ব্যাংকিং', serial: 2 },
          { id: 'ssc-finance-banking-ch10-t3', name: 'ইলেকট্রনিক ফান্ড ট্রান্সফার (EFT) ও আরটিজিএস (RTGS)', serial: 3 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch11',
        name: 'ব্যাংকের আমানত',
        topics: [
          { id: 'ssc-finance-banking-ch11-t1', name: 'ব্যাংক হিসাবের প্রকারভেদ (চলতি, সঞ্চয়ী ও স্থায়ী হিসাব)', serial: 1 },
          { id: 'ssc-finance-banking-ch11-t2', name: 'হিসাব খোলার নিয়মাবলী ও চেক (বাহক চেক, হুকুম চেক, দাগকাটা চেক)', serial: 2 },
          { id: 'ssc-finance-banking-ch11-t3', name: 'চেক প্রত্যাখ্যানের কারণ', serial: 3 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch12',
        name: 'বৈদেশিক বিনিময় ও বৈদেশিক মুদ্রা',
        topics: [
          { id: 'ssc-finance-banking-ch12-t1', name: 'বৈদেশিক বাণিজ্যে ব্যাংকের ভূমিকা', serial: 1 },
          { id: 'ssc-finance-banking-ch12-t2', name: 'লেটার অব ক্রেডিট (Letter of Credit - L/C) ও বিনিময় বিল', serial: 2 },
        ],
      },
      {
        id: 'ssc-finance-banking-ch13',
        name: 'বিমা সম্পর্কে প্রাথমিক ধারণা',
        topics: [
          { id: 'ssc-finance-banking-ch13-t1', name: 'বিমা চুক্তির ধারণা ও মূলনীতি', serial: 1 },
          { id: 'ssc-finance-banking-ch13-t2', name: 'জীবন বিমা, নৌ বিমা, অগ্নি বিমা ও দুর্ঘটনা বিমা', serial: 2 },
        ],
      },
    ],
  },
  {
    id: 'ssc-history-bd',
    name: 'SSC বাংলাদেশের ইতিহাস ও বিশ্ব সভ্যতা',
    icon: History,
    group: 'Humanities',
    chapters: [
      {
        id: 'ssc-history-bd-ch1',
        name: 'ইতিহাস পরিচিতি',
        topics: [
          { id: 'ssc-history-bd-ch1-t1', name: 'ইতিহাস ও ঐতিহ্যের ধারণা', serial: 1 },
          { id: 'ssc-history-bd-ch1-t2', name: 'ইতিহাসের উপাদান (লিখিত ও অলিখিত উপাদান)', serial: 2 },
          { id: 'ssc-history-bd-ch1-t3', name: 'ইতিহাসের প্রকারভেদ ও ইতিহাস পাঠের গুরুত্ব', serial: 3 },
        ],
      },
      {
        id: 'ssc-history-bd-ch2',
        name: 'বিশ্ব সভ্যতা',
        topics: [
          { id: 'ssc-history-bd-ch2-t1', name: 'মিশরীয় সভ্যতা ও সিন্ধু সভ্যতা', serial: 1 },
          { id: 'ssc-history-bd-ch2-t2', name: 'গ্রিক সভ্যতা ও রোমান সভ্যতা', serial: 2 },
          { id: 'ssc-history-bd-ch2-t3', name: 'বিশ্ব সভ্যতায় বিজ্ঞানের অবদান', serial: 3 },
        ],
      },
      {
        id: 'ssc-history-bd-ch3',
        name: 'প্রাচীন বাংলার জনপদ',
        topics: [
          { id: 'ssc-history-bd-ch3-t1', name: 'প্রাচীন বাংলার ভূপ্রকৃতি ও জনপদসমূহ (গৌড়, বঙ্গ, পুণ্ড্র, হরিকেল, সমতট, বরেন্দ্র)', serial: 1 },
          { id: 'ssc-history-bd-ch3-t2', name: 'জনপদগুলোর ভৌগোলিক অবস্থান ও বৈশিষ্ট্য', serial: 2 },
        ],
      },
      {
        id: 'ssc-history-bd-ch4',
        name: 'প্রাচীন বাংলার রাজনৈতিক ইতিহাস',
        topics: [
          { id: 'ssc-history-bd-ch4-t1', name: 'মৌর্য ও গুপ্ত যুগে বাংলা', serial: 1 },
          { id: 'ssc-history-bd-ch4-t2', name: 'শশাঙ্কের রাজত্ব ও মাৎস্যন্যায় যুগ', serial: 2 },
          { id: 'ssc-history-bd-ch4-t3', name: 'পাল বংশ ও সেন বংশের রাজত্বকাল', serial: 3 },
        ],
      },
      {
        id: 'ssc-history-bd-ch5',
        name: 'মধ্যযুগের বাংলার রাজনৈতিক ইতিহাস',
        topics: [
          { id: 'ssc-history-bd-ch5-t1', name: 'ইখতিয়ার উদ্দিন মুহাম্মদ বখতিয়ার খলজির বাংলা বিজয়', serial: 1 },
          { id: 'ssc-history-bd-ch5-t2', name: 'সুলতানি আমল ও ফখরুদ্দীন মুবারক শাহ', serial: 2 },
          { id: 'ssc-history-bd-ch5-t3', name: 'ইলিয়াস শাহী ও হোসেন শাহী আমল', serial: 3 },
        ],
      },
      {
        id: 'ssc-history-bd-ch6',
        name: 'মধ্যযুগের বাংলার সামাজিক, অর্থনৈতিক ও সাংস্কৃতিক ইতিহাস',
        topics: [
          { id: 'ssc-history-bd-ch6-t1', name: 'মধ্যযুগের সমাজব্যবস্থা ও ধর্মীয় সম্প্রীতি', serial: 1 },
          { id: 'ssc-history-bd-ch6-t2', name: 'কৃষি, তাঁতশিল্প ও আন্তর্জাতিক বাণিজ্য', serial: 2 },
          { id: 'ssc-history-bd-ch6-t3', name: 'বাংলা ভাষা ও সাহিত্যের বিকাশ', serial: 3 },
        ],
      },
      {
        id: 'ssc-history-bd-ch7',
        name: 'মুঘল আমল',
        topics: [
          { id: 'ssc-history-bd-ch7-t1', name: 'মুঘল সাম্রাজ্য প্রতিষ্ঠা ও বারো ভূঁইয়াদের প্রতিরোধ', serial: 1 },
          { id: 'ssc-history-bd-ch7-t2', name: 'সুবেদারি ও নবাবী আমল (শায়েস্তা খান, নবাব সিরাজউদ্দৌলা)', serial: 2 },
          { id: 'ssc-history-bd-ch7-t3', name: 'মুঘল স্থাপত্য ও চিত্রকলা', serial: 3 },
        ],
      },
      {
        id: 'ssc-history-bd-ch8',
        name: 'ঔপনিবেশিক যুগ ও বাংলার স্বাধীনতা সংগ্রাম',
        topics: [
          { id: 'ssc-history-bd-ch8-t1', name: 'পলাশীর যুদ্ধ (১৭৫৭) ও বকচারের যুদ্ধ (১৭৬৪)', serial: 1 },
          { id: 'ssc-history-bd-ch8-t2', name: 'ইস্ট ইন্ডিয়া কোম্পানির দেওয়ানি লাভ ও দ্বৈত শাসন', serial: 2 },
          { id: 'ssc-history-bd-ch8-t3', name: 'ছিয়াত্তরের মন্বন্তর ও চিরস্থায়ী বন্দোবস্ত (১৭৯৩)', serial: 3 },
        ],
      },
      {
        id: 'ssc-history-bd-ch9',
        name: 'ইংরেজ শাসনামলে বাংলার প্রতিরোধ, স্বাধিকার ও স্বাধীনতা আন্দোলন',
        topics: [
          { id: 'ssc-history-bd-ch9-t1', name: 'ফকির-সন্ন্যাসী বিদ্রোহ ও তিতুমীরের বাঁশের কেল্লা', serial: 1 },
          { id: 'ssc-history-bd-ch9-t2', name: 'ফরায়েজি আন্দোলন ও নীল বিদ্রোহ', serial: 2 },
          { id: 'ssc-history-bd-ch9-t3', name: '১৮৫৭ সালের সিপাহি বিদ্রোহ ও বঙ্গভঙ্গ (১৯০৫)', serial: 3 },
        ],
      },
      {
        id: 'ssc-history-bd-ch10',
        name: 'স্বাধীন বাংলাদেশ',
        topics: [
          { id: 'ssc-history-bd-ch10-t1', name: '১৯৪৭ এর দেশভাগ ও পাকিস্তান সৃষ্টি', serial: 1 },
          { id: 'ssc-history-bd-ch10-t2', name: 'পূর্ব ও পশ্চিম পাকিস্তানের মধ্যকার বৈষম্য', serial: 2 },
        ],
      },
      {
        id: 'ssc-history-bd-ch11',
        name: 'ভাষা আন্দোলন ও পরবর্তী রাজনৈতিক ঘটনাপ্রবাহ',
        topics: [
          { id: 'ssc-history-bd-ch11-t1', name: '১৯৫২ সালের মহান ভাষা আন্দোলন', serial: 1 },
          { id: 'ssc-history-bd-ch11-t2', name: 'যুক্তফ্রন্ট সরকার ও ১৯৫৮ এর সামরিক আইন', serial: 2 },
        ],
      },
      {
        id: 'ssc-history-bd-ch12',
        name: 'সামরিক শাসন এবং স্বাধিকার আন্দোলন',
        topics: [
          { id: 'ssc-history-bd-ch12-t1', name: 'আইয়ুব খানের সামরিক শাসন ও মৌলিক গণতন্ত্র', serial: 1 },
          { id: 'ssc-history-bd-ch12-t2', name: 'বঙ্গবন্ধুর ঐতিহাসিক ৬ দফা কর্মসূচি (১৯৬৬)', serial: 2 },
          { id: 'ssc-history-bd-ch12-t3', name: 'আগরতলা ষড়যন্ত্র মামলা ও ১৯৬৯-এর গণঅভ্যুত্থান', serial: 3 },
        ],
      },
      {
        id: 'ssc-history-bd-ch13',
        name: 'সত্তরের নির্বাচন এবং মুক্তিযুদ্ধ',
        topics: [
          { id: 'ssc-history-bd-ch13-t1', name: '১৯৭০ সালের সাধারণ নির্বাচন', serial: 1 },
          { id: 'ssc-history-bd-ch13-t2', name: '৭ই মার্চের ভাষণ ও স্বাধীনতার ঘোষণা', serial: 2 },
          { id: 'ssc-history-bd-ch13-t3', name: 'মুক্তিযুদ্ধের সেক্টর ও বীরশ্রেষ্ঠদের অবদান', serial: 3 },
        ],
      },
      {
        id: 'ssc-history-bd-ch14',
        name: 'বঙ্গবন্ধু শেখ মুজিবুর রহমানের শাসনকাল',
        topics: [
          { id: 'ssc-history-bd-ch14-t1', name: 'যুদ্ধবিধ্বস্ত দেশ পুনর্গঠন (১৯৭২-১৯৭৫)', serial: 1 },
          { id: 'ssc-history-bd-ch14-t2', name: '১৯৭২ এর সংবিধান প্রণয়ন ও পররাষ্ট্রনীতি', serial: 2 },
          { id: 'ssc-history-bd-ch14-t3', name: '১৫ই আগস্টের ট্র্যাজেডি ও জাতীয় চার নেতার হত্যাকাণ্ড', serial: 3 },
        ],
      },
    ],
  },
  {
    id: 'ssc-geography',
    name: 'SSC ভূগোল ও পরিবেশ',
    icon: Globe,
    group: 'Humanities',
    chapters: [
      {
        id: 'ssc-geography-ch1',
        name: 'ভূগোল ও পরিবেশ',
        topics: [
          { id: 'ssc-geography-ch1-t1', name: 'ভূগোলের ধারণা ও শাখা-প্রশাখা', serial: 1 },
          { id: 'ssc-geography-ch1-t2', name: 'পরিবেশের উপাদান ও পরিবেশের প্রকারভেদ', serial: 2 },
          { id: 'ssc-geography-ch1-t3', name: 'ভূগোল ও পরিবেশ পাঠের গুরুত্ব', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch2',
        name: 'মহাবিশ্ব ও আমাদের পৃথিবী',
        topics: [
          { id: 'ssc-geography-ch2-t1', name: 'নক্ষত্র, ছায়াপথ, নীহারিকা ও ধূমকেতু', serial: 1 },
          { id: 'ssc-geography-ch2-t2', name: 'সৌরজগতের গ্রহসমূহ ও বৈশিষ্ট্য', serial: 2 },
          { id: 'ssc-geography-ch2-t3', name: 'পৃথিবীর আকার ও গতি (আহ্নিক ও বার্ষিক গতি)', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch3',
        name: 'মানচিত্র পঠন ও ব্যবহার',
        topics: [
          { id: 'ssc-geography-ch3-t1', name: 'মানচিত্রের ধারণা, প্রকারভেদ ও স্কেল', serial: 1 },
          { id: 'ssc-geography-ch3-t2', name: 'মানচিত্রের দিক ও প্রতীক চিহ্ন', serial: 2 },
          { id: 'ssc-geography-ch3-t3', name: 'GPS ও GIS এর ধারণা ও আধুনিক ব্যবহার', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch4',
        name: 'পৃথিবীর অভ্যন্তরীণ ও বাহ্যিক গঠন',
        topics: [
          { id: 'ssc-geography-ch4-t1', name: 'পৃথিবীর অভ্যন্তরীণ স্তর (অশ্মমণ্ডল, গুরুমণ্ডল, কেন্দ্রমণ্ডল)', serial: 1 },
          { id: 'ssc-geography-ch4-t2', name: 'শিলা ও খনিজ (আগ্নেয়, পাললিক ও রূপান্তরিত শিলা)', serial: 2 },
          { id: 'ssc-geography-ch4-t3', name: 'ভূমিকম্প ও আগ্নেয়গিরির অগ্ন্যুৎপাত', serial: 3 },
          { id: 'ssc-geography-ch4-t4', name: 'নদী, বায়ু ও হিমবাহের ক্ষয় ও সঞ্চয় কাজ', serial: 4 },
        ],
      },
      {
        id: 'ssc-geography-ch5',
        name: 'বায়ুমণ্ডল',
        topics: [
          { id: 'ssc-geography-ch5-t1', name: 'বায়ুমণ্ডলের উপাদান ও স্তরবিন্যাস (ট্রপোস্ফিয়ার, স্ট্র্যাটোস্ফিয়ার, মেসোস্ফিয়ার, থার্মোস্ফিয়ার)', serial: 1 },
          { id: 'ssc-geography-ch5-t2', name: 'বায়ুর চাপ, বায়ুপ্রবাহ ও নিয়ত বায়ু', serial: 2 },
          { id: 'ssc-geography-ch5-t3', name: 'আর্দ্রতা, বৃষ্টিপাত ও বৃষ্টিপাতের প্রকারভেদ', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch6',
        name: 'বারিমণ্ডল',
        topics: [
          { id: 'ssc-geography-ch6-t1', name: 'বারিমণ্ডলের ধারণা ও মহাসাগরসমূহের পরিচয়', serial: 1 },
          { id: 'ssc-geography-ch6-t2', name: 'সমুদ্র তলদেশের ভূপ্রকৃতি (মহীসোপান, মহীঢাল, গভীর সমুদ্রের সমভূমি)', serial: 2 },
          { id: 'ssc-geography-ch6-t3', name: 'সমুদ্রস্রোত ও জোয়ার-ভাটার কারণ ও প্রভাব', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch7',
        name: 'জনসংখ্যা',
        topics: [
          { id: 'ssc-geography-ch7-t1', name: 'জনসংখ্যার ঘনত্ব ও বণ্টন', serial: 1 },
          { id: 'ssc-geography-ch7-t2', name: 'জনসংখ্যা বৃদ্ধির কারণ ও প্রভাব', serial: 2 },
          { id: 'ssc-geography-ch7-t3', name: 'জনসংখ্যার স্থানান্তর (অভ্যন্তরীণ ও আন্তর্জাতিক)', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch8',
        name: 'মানব বসতি',
        topics: [
          { id: 'ssc-geography-ch8-t1', name: 'গ্রামীণ বসতি ও এর প্রকারভেদ', serial: 1 },
          { id: 'ssc-geography-ch8-t2', name: 'নগরায়ণ ও নগর বসতির বৈশিষ্ট্য', serial: 2 },
          { id: 'ssc-geography-ch8-t3', name: 'বসতি স্থাপনের নিয়ামকসমূহ', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch9',
        name: 'সম্পদ ও অর্থনৈতিক কার্যাবলি',
        topics: [
          { id: 'ssc-geography-ch9-t1', name: 'সম্পদের ধারণা ও শ্রেণিবিভাগ', serial: 1 },
          { id: 'ssc-geography-ch9-t2', name: 'অর্থনৈতিক কার্যাবলির স্তর (প্রাথমিক, মাধ্যমিক, টারশিয়ারি)', serial: 2 },
          { id: 'ssc-geography-ch9-t3', name: 'কৃষি ও কৃষির প্রকারভেদ', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch10',
        name: 'বাংলাদেশের ভৌগোলিক বিবরণ',
        topics: [
          { id: 'ssc-geography-ch10-t1', name: 'বাংলাদেশের অবস্থান, সীমানা ও আয়তন', serial: 1 },
          { id: 'ssc-geography-ch10-t2', name: 'বাংলাদেশের ভূপ্রকৃতি ও নদনদী', serial: 2 },
          { id: 'ssc-geography-ch10-t3', name: 'বাংলাদেশের জলবায়ু ও ঋতু বৈচিত্র্য', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch11',
        name: 'বাংলাদেশের সম্পদ ও শিল্প',
        topics: [
          { id: 'ssc-geography-ch11-t1', name: 'কৃষিজ সম্পদ ও বনজ সম্পদ', serial: 1 },
          { id: 'ssc-geography-ch11-t2', name: 'খনিজ সম্পদ (প্রাকৃতিক গ্যাস, কয়লা, চুনাপাথর)', serial: 2 },
          { id: 'ssc-geography-ch11-t3', name: 'প্রধান প্রধান শিল্প (গার্মেন্টস, পাট, চামড়া, চা)', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch12',
        name: 'বাংলাদেশের যোগাযোগ ব্যবস্থা ও বাণিজ্য',
        topics: [
          { id: 'ssc-geography-ch12-t1', name: 'সড়কপথ, রেলপথ, নৌপথ ও আকাশপথ', serial: 1 },
          { id: 'ssc-geography-ch12-t2', name: 'বাংলাদেশের অভ্যন্তরীণ ও বৈদেশিক বাণিজ্য', serial: 2 },
          { id: 'ssc-geography-ch12-t3', name: 'প্রধান আমদানি ও রপ্তানি পণ্য', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch13',
        name: 'বাংলাদেশের উন্নয়ন কর্মকাণ্ড ও পরিবেশের ভারসাম্য',
        topics: [
          { id: 'ssc-geography-ch13-t1', name: 'পরিবেশ দূষণ (বায়ু, পানি, মাটি ও শব্দ দূষণ)', serial: 1 },
          { id: 'ssc-geography-ch13-t2', name: 'জলবায়ু পরিবর্তন, গ্রিনহাউস প্রভাব ও সমুদ্রপৃষ্ঠের উচ্চতা বৃদ্ধি', serial: 2 },
          { id: 'ssc-geography-ch13-t3', name: 'পরিবেশ সংরক্ষণে করণীয়', serial: 3 },
        ],
      },
      {
        id: 'ssc-geography-ch14',
        name: 'বাংলাদেশের প্রাকৃতিক দুর্যোগ',
        topics: [
          { id: 'ssc-geography-ch14-t1', name: 'বন্যা, খরা ও নদীভাঙন', serial: 1 },
          { id: 'ssc-geography-ch14-t2', name: 'ঘূর্ণিঝড় ও জলোচ্ছ্বাস', serial: 2 },
          { id: 'ssc-geography-ch14-t3', name: 'দুর্যোগ ব্যবস্থাপনা ও দুর্যোগ প্রস্তুতি', serial: 3 },
        ],
      },
    ],
  },
  {
    id: 'ssc-civics',
    name: 'SSC পৌরনীতি ও নাগরিকতা',
    icon: Landmark,
    group: 'Humanities',
    chapters: [
      {
        id: 'ssc-civics-ch1',
        name: 'পৌরনীতি ও নাগরিকতা',
        topics: [
          { id: 'ssc-civics-ch1-t1', name: 'পৌরনীতির ধারণা ও বিষয়বস্তু', serial: 1 },
          { id: 'ssc-civics-ch1-t2', name: 'পৌরনীতি পাঠের প্রয়োজনীয়তা', serial: 2 },
          { id: 'ssc-civics-ch1-t3', name: 'পরিবার ও পরিবারের প্রকারভেদ', serial: 3 },
        ],
      },
      {
        id: 'ssc-civics-ch2',
        name: 'নাগরিক ও নাগরিকতা',
        topics: [
          { id: 'ssc-civics-ch2-t1', name: 'নাগরিক ও নাগরিকতার ধারণা', serial: 1 },
          { id: 'ssc-civics-ch2-t2', name: 'নাগরিকতা অর্জনের উপায় (জন্মসূত্রে ও অনুমোদন সূত্রে)', serial: 2 },
          { id: 'ssc-civics-ch2-t3', name: 'সুনাগরিকের গুণাবলী ও নাগরিকের অধিকার-কর্তব্য', serial: 3 },
        ],
      },
      {
        id: 'ssc-civics-ch3',
        name: 'আইন, স্বাধীনতা ও সাম্য',
        topics: [
          { id: 'ssc-civics-ch3-t1', name: 'আইনের ধারণা ও উৎসসমূহ', serial: 1 },
          { id: 'ssc-civics-ch3-t2', name: 'স্বাধীনতার রূপ ও আইন-স্বাধীনতার সম্পর্ক', serial: 2 },
          { id: 'ssc-civics-ch3-t3', name: 'সাম্যের ধারণা ও বিভিন্ন রূপ', serial: 3 },
        ],
      },
      {
        id: 'ssc-civics-ch4',
        name: 'রাষ্ট্র ও সরকার ব্যবস্থা',
        topics: [
          { id: 'ssc-civics-ch4-t1', name: 'রাষ্ট্রের ধারণা ও উৎপত্তি মতবাদ', serial: 1 },
          { id: 'ssc-civics-ch4-t2', name: 'সরকারের প্রকারভেদ (গণতন্ত্র বনাম একনায়কতন্ত্র, সংসদীয় বনাম রাষ্ট্রপতিশাসিত)', serial: 2 },
          { id: 'ssc-civics-ch4-t3', name: 'গণতান্ত্রিক সরকারের গুণ ও দোষ', serial: 3 },
        ],
      },
      {
        id: 'ssc-civics-ch5',
        name: 'সংবিধান',
        topics: [
          { id: 'ssc-civics-ch5-t1', name: 'সংবিধানের ধারণা ও প্রণয়ন পদ্ধতি', serial: 1 },
          { id: 'ssc-civics-ch5-t2', name: 'উত্তম সংবিধানের বৈশিষ্ট্য', serial: 2 },
          { id: 'ssc-civics-ch5-t3', name: '১৯৭২ সালের বাংলাদেশের সংবিধানের মূল বৈশিষ্ট্যসমূহ ও সংশোধনী', serial: 3 },
        ],
      },
      {
        id: 'ssc-civics-ch6',
        name: 'বাংলাদেশের সরকার ব্যবস্থা',
        topics: [
          { id: 'ssc-civics-ch6-t1', name: 'আইন বিভাগ (জাতীয় সংসদ)', serial: 1 },
          { id: 'ssc-civics-ch6-t2', name: 'শাসন বিভাগ (রাষ্ট্রপতি ও প্রধানমন্ত্রী)', serial: 2 },
          { id: 'ssc-civics-ch6-t3', name: 'বিচার বিভাগ ও বিচার বিভাগের স্বাধীনতা', serial: 3 },
        ],
      },
      {
        id: 'ssc-civics-ch7',
        name: 'গণতন্ত্রে রাজনৈতিক দল ও নির্বাচন',
        topics: [
          { id: 'ssc-civics-ch7-t1', name: 'রাজনৈতিক দলের ভূমিকা ও কার্যাবলী', serial: 1 },
          { id: 'ssc-civics-ch7-t2', name: 'নির্বাচন কমিশন ও নির্বাচন পদ্ধতি', serial: 2 },
          { id: 'ssc-civics-ch7-t3', name: 'জনমত ও প্রচার মাধ্যমের ভূমিকা', serial: 3 },
        ],
      },
      {
        id: 'ssc-civics-ch8',
        name: 'বাংলাদেশের স্থানীয় সরকার ব্যবস্থা',
        topics: [
          { id: 'ssc-civics-ch8-t1', name: 'স্থানীয় সরকারের ধারণা ও কাঠামো', serial: 1 },
          { id: 'ssc-civics-ch8-t2', name: 'ইউনিয়ন পরিষদ, উপজেলা পরিষদ ও জেলা পরিষদ', serial: 2 },
          { id: 'ssc-civics-ch8-t3', name: 'পৌরসভা ও সিটি কর্পোরেশন', serial: 3 },
        ],
      },
      {
        id: 'ssc-civics-ch9',
        name: 'নাগরিক সমস্যা ও আমাদের করণীয়',
        topics: [
          { id: 'ssc-civics-ch9-t1', name: 'নিরক্ষরতা, বেকারত্ব ও দারিদ্র্য', serial: 1 },
          { id: 'ssc-civics-ch9-t2', name: 'নারী নির্যাতন ও যৌতুক প্রথা প্রতিরোধ', serial: 2 },
          { id: 'ssc-civics-ch9-t3', name: 'দুর্নীতি প্রতিরোধে নাগরিক সচেতনতা', serial: 3 },
        ],
      },
      {
        id: 'ssc-civics-ch10',
        name: 'স্বাধীন বাংলাদেশের অভ্যুদয়ে নাগরিক চেতনা',
        topics: [
          { id: 'ssc-civics-ch10-t1', name: 'ভাষা আন্দোলন ও জাতীয়তাবোধের উন্মেষ', serial: 1 },
          { id: 'ssc-civics-ch10-t2', name: '১৯৬৬ এর ছয় দফা ও স্বাধীনতা সংগ্রাম', serial: 2 },
          { id: 'ssc-civics-ch10-t3', name: 'মহান মুক্তিযুদ্ধ ও মুক্তিকামী জনতার অবদান', serial: 3 },
        ],
      },
      {
        id: 'ssc-civics-ch11',
        name: 'বাংলাদেশ ও আন্তর্জাতিক সংগঠন',
        topics: [
          { id: 'ssc-civics-ch11-t1', name: 'জাতিসংঘ ও এর অঙ্গসংগঠনসমূহ (UNESCO, UNICEF, WHO)', serial: 1 },
          { id: 'ssc-civics-ch11-t2', name: 'সার্ক (SAARC) ও কমনওয়েলথ', serial: 2 },
          { id: 'ssc-civics-ch11-t3', name: 'ওআইসি (OIC) ও আন্তর্জাতিক সহযোগিতা', serial: 3 },
        ],
      },
    ],
  },
  {
    id: 'ssc-economics',
    name: 'SSC অর্থনীতি',
    icon: BarChart3,
    group: 'Humanities',
    chapters: [
      {
        id: 'ssc-economics-ch1',
        name: 'অর্থনীতি পরিচয়',
        topics: [
          { id: 'ssc-economics-ch1-t1', name: 'অর্থনীতির উৎপত্তি ও সংজ্ঞা (অ্যাডাম স্মিথ, মার্শাল, রবিন্স)', serial: 1 },
          { id: 'ssc-economics-ch1-t2', name: 'দুষ্প্রাপ্যতা ও অসীম অভাব', serial: 2 },
          { id: 'ssc-economics-ch1-t3', name: 'সুযোগ ব্যয় (Opportunity Cost) ও নির্বাচন সমস্যা', serial: 3 },
        ],
      },
      {
        id: 'ssc-economics-ch2',
        name: 'অর্থনীতির গুরুত্বপূর্ণ ধারণাসমূহ',
        topics: [
          { id: 'ssc-economics-ch2-t1', name: 'অর্থনৈতিক সম্পদ ও এর বৈশিষ্ট্য', serial: 1 },
          { id: 'ssc-economics-ch2-t2', name: 'দ্রব্য ও দ্রব্যের প্রকারভেদ (অর্থনৈতিক ও অবাধলব্ধ দ্রব্য)', serial: 2 },
          { id: 'ssc-economics-ch2-t3', name: 'আয়, সঞ্চয়, বিনিয়োগ ও মূলধন', serial: 3 },
        ],
      },
      {
        id: 'ssc-economics-ch3',
        name: 'উপযোগ, চাহিদা, জোগান ও ভারসাম্য',
        topics: [
          { id: 'ssc-economics-ch3-t1', name: 'উপযোগ (মোট ও প্রান্তিক উপযোগ) এবং ক্রমহ্রাসমান প্রান্তিক উপযোগ বিধি', serial: 1 },
          { id: 'ssc-economics-ch3-t2', name: 'চাহিদা বিধি ও চাহিদা রেখা অঙ্কন', serial: 2 },
          { id: 'ssc-economics-ch3-t3', name: 'জোগান বিধি ও জোগান রেখা অঙ্কন', serial: 3 },
          { id: 'ssc-economics-ch3-t4', name: 'ভারসাম্য দাম ও পরিমাণ নির্ধারণ', serial: 4 },
        ],
      },
      {
        id: 'ssc-economics-ch4',
        name: 'উৎপাদন ও সংগঠন',
        topics: [
          { id: 'ssc-economics-ch4-t1', name: 'উৎপাদনের ধারণা ও উৎপাদনের উপাদানসমূহ (ভূমি, শ্রম, মূলধন, সংগঠন)', serial: 1 },
          { id: 'ssc-economics-ch4-t2', name: 'উৎপাদন ব্যয় (স্থির ব্যয় ও পরিবর্তনশীল ব্যয়)', serial: 2 },
          { id: 'ssc-economics-ch4-t3', name: 'উৎপাদন বিধি (ক্রমহ্রাসমান প্রান্তিক উৎপাদন বিধি)', serial: 3 },
        ],
      },
      {
        id: 'ssc-economics-ch5',
        name: 'বাজার',
        topics: [
          { id: 'ssc-economics-ch5-t1', name: 'অর্থনীতিতে বাজারের ধারণা ও প্রকারভেদ', serial: 1 },
          { id: 'ssc-economics-ch5-t2', name: 'পূর্ণ প্রতিযোগিতামূলক বাজার ও এর বৈশিষ্ট্য', serial: 2 },
          { id: 'ssc-economics-ch5-t3', name: 'একচেটিয়া বাজার ও অলিগোপলি বাজার', serial: 3 },
        ],
      },
      {
        id: 'ssc-economics-ch6',
        name: 'জাতীয় আয় ও এর পরিমাপ',
        topics: [
          { id: 'ssc-economics-ch6-t1', name: 'মোট দেশজ উৎপাদন (GDP) ও মোট জাতীয় আয় (GNI)', serial: 1 },
          { id: 'ssc-economics-ch6-t2', name: 'মাথাপিছু আয় নির্ণয়', serial: 2 },
          { id: 'ssc-economics-ch6-t3', name: 'জাতীয় আয় পরিমাপের পদ্ধতিসমূহ (উৎপাদন, আয় ও ব্যয় পদ্ধতি)', serial: 3 },
        ],
      },
      {
        id: 'ssc-economics-ch7',
        name: 'অর্থনীতিতে সরকারি অর্থব্যবস্থা',
        topics: [
          { id: 'ssc-economics-ch7-t1', name: 'সরকারি অর্থব্যবস্থার ধারণা ও গুরুত্ব', serial: 1 },
          { id: 'ssc-economics-ch7-t2', name: 'সরকারের রাজস্ব আয়ের উৎসসমূহ (প্রত্যক্ষ ও পরোক্ষ কর)', serial: 2 },
          { id: 'ssc-economics-ch7-t3', name: 'সরকারি ব্যয়ের প্রধান খাতসমূহ', serial: 3 },
        ],
      },
      {
        id: 'ssc-economics-ch8',
        name: 'মুদ্রা, ব্যাংক ও বিমা',
        topics: [
          { id: 'ssc-economics-ch8-t1', name: 'মুদ্রার উৎপত্তি ও কার্যাবলী', serial: 1 },
          { id: 'ssc-economics-ch8-t2', name: 'মুদ্রাস্ফীতি (কারণ, প্রভাব ও প্রতিকার)', serial: 2 },
          { id: 'ssc-economics-ch8-t3', name: 'বাণিজ্যিক ও কেন্দ্রীয় ব্যাংক', serial: 3 },
          { id: 'ssc-economics-ch8-t4', name: 'বিমার প্রয়োজনীয়তা', serial: 4 },
        ],
      },
      {
        id: 'ssc-economics-ch9',
        name: 'বাংলাদেশের অর্থনীতি',
        topics: [
          { id: 'ssc-economics-ch9-t1', name: 'বাংলাদেশের অর্থনীতির প্রধান প্রধান বৈশিষ্ট্য', serial: 1 },
          { id: 'ssc-economics-ch9-t2', name: 'কৃষি, শিল্প ও সেবা খাতের অবদান', serial: 2 },
          { id: 'ssc-economics-ch9-t3', name: 'মানবসম্পদ উন্নয়ন ও রেমিট্যান্স', serial: 3 },
        ],
      },
      {
        id: 'ssc-economics-ch10',
        name: 'বাংলাদেশের অর্থনৈতিক উন্নয়ন',
        topics: [
          { id: 'ssc-economics-ch10-t1', name: 'অর্থনৈতিক প্রবৃদ্ধি ও উন্নয়নের সূচকসমূহ', serial: 1 },
          { id: 'ssc-economics-ch10-t2', name: 'দারিদ্র্য বিমোচন ও কর্মসংস্থান সৃষ্টি', serial: 2 },
          { id: 'ssc-economics-ch10-t3', name: 'টেকসই উন্নয়ন লক্ষ্যমাত্রা (SDG)', serial: 3 },
        ],
      },
    ],
  },
];

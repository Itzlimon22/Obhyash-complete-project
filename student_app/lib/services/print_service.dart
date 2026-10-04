import 'dart:convert';
import 'package:pdf/pdf.dart';
import 'package:printing/printing.dart';
import '../models/exam_types.dart';

class PdfTheme {
  final String name;
  final String primary;
  final String secondary;
  final String accent;
  final String qbBg;
  final String exBg;
  final String border;

  const PdfTheme({
    required this.name,
    required this.primary,
    required this.secondary,
    required this.accent,
    required this.qbBg,
    required this.exBg,
    required this.border,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 100+ Curated, Non-Boring Color Palettes
// ─────────────────────────────────────────────────────────────────────────────
const List<PdfTheme> kCuratedThemes = [
  PdfTheme(
    name: 'রয়্যাল নেভি অ্যাম্বার',
    primary: '#0e2742',
    secondary: '#173d66',
    accent: '#f05a22',
    qbBg: '#edf4fa',
    exBg: '#fff8f0',
    border: '#13385c',
  ),
  PdfTheme(
    name: 'মিডনাইট স্যাফায়ার গোল্ড',
    primary: '#0a192f',
    secondary: '#172a45',
    accent: '#d97706',
    qbBg: '#f0f7ff',
    exBg: '#fffbeb',
    border: '#1e3a8a',
  ),
  PdfTheme(
    name: 'ডিপ ওশান সায়ান',
    primary: '#0c2340',
    secondary: '#16385e',
    accent: '#0891b2',
    qbBg: '#ecfeff',
    exBg: '#f0fdfa',
    border: '#0e7490',
  ),
  PdfTheme(
    name: 'অক্সফোর্ড ব্লু ক্রিমসন',
    primary: '#002147',
    secondary: '#0d386b',
    accent: '#be123c',
    qbBg: '#f1f5f9',
    exBg: '#fff1f2',
    border: '#0f172a',
  ),
  PdfTheme(
    name: 'কোবাল্ট সানসেট',
    primary: '#172554',
    secondary: '#1e40af',
    accent: '#ea580c',
    qbBg: '#eff6ff',
    exBg: '#fff7ed',
    border: '#1d4ed8',
  ),
  PdfTheme(
    name: 'স্টিল ব্লু কোরাল',
    primary: '#1e293b',
    secondary: '#334155',
    accent: '#e11d48',
    qbBg: '#f8fafc',
    exBg: '#fff1f2',
    border: '#334155',
  ),
  PdfTheme(
    name: 'প্রুশিয়ান ব্লু গোল্ড',
    primary: '#003153',
    secondary: '#084c7d',
    accent: '#ca8a04',
    qbBg: '#f0f9ff',
    exBg: '#fefce8',
    border: '#0369a1',
  ),
  PdfTheme(
    name: 'এজিয়ান সি কপার',
    primary: '#142d4c',
    secondary: '#204975',
    accent: '#b45309',
    qbBg: '#e8f1f5',
    exBg: '#fef3c7',
    border: '#1f4068',
  ),
  PdfTheme(
    name: 'ইন্ডিগো ব্লেজ',
    primary: '#1e1b4b',
    secondary: '#312e81',
    accent: '#ea580c',
    qbBg: '#eef2ff',
    exBg: '#fff7ed',
    border: '#3730a3',
  ),
  PdfTheme(
    name: 'আর্কটিক নেভি আইস',
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#0284c7',
    qbBg: '#f0f9ff',
    exBg: '#f8fafc',
    border: '#0284c7',
  ),
  PdfTheme(
    name: 'সেলেস্টিয়াল ব্লু সিট্রন',
    primary: '#172554',
    secondary: '#1e3a8a',
    accent: '#65a30d',
    qbBg: '#eff6ff',
    exBg: '#f7fee7',
    border: '#1e40af',
  ),
  PdfTheme(
    name: 'ডিপ ডেনিম ট্যাঞ্জারিন',
    primary: '#1b2a4a',
    secondary: '#2c4270',
    accent: '#e8590c',
    qbBg: '#f2f5fa',
    exBg: '#fff4ed',
    border: '#2c4270',
  ),
  PdfTheme(
    name: 'আল্ট্রামেরিন রোজ',
    primary: '#181842',
    secondary: '#29296e',
    accent: '#e11d48',
    qbBg: '#f1f1fc',
    exBg: '#fff1f2',
    border: '#312e81',
  ),
  PdfTheme(
    name: 'স্পেস ক্যাডেট মিন্ট',
    primary: '#1d2a44',
    secondary: '#2f4369',
    accent: '#059669',
    qbBg: '#f3f6f9',
    exBg: '#ecfdf5',
    border: '#2b3e63',
  ),
  PdfTheme(
    name: 'আটলান্টিক এবিস গোল্ড',
    primary: '#0b1d3a',
    secondary: '#163666',
    accent: '#b8860b',
    qbBg: '#edf3fa',
    exBg: '#fffdf0',
    border: '#15325b',
  ),
  PdfTheme(
    name: 'মেডিকেল এমারেল্ড টিল',
    primary: '#244f5d',
    secondary: '#0f4c5c',
    accent: '#d62839',
    qbBg: '#e6f1f1',
    exBg: '#fdf0ec',
    border: '#0f4c5c',
  ),
  PdfTheme(
    name: 'ফরেস্ট এমারেল্ড অ্যাম্বার',
    primary: '#0f3d24',
    secondary: '#165b36',
    accent: '#b45309',
    qbBg: '#f0fdf4',
    exBg: '#fefce8',
    border: '#14532d',
  ),
  PdfTheme(
    name: 'নর্ডিক পাইন মিন্ট',
    primary: '#064e3b',
    secondary: '#047857',
    accent: '#059669',
    qbBg: '#ecfdf5',
    exBg: '#f0fdf4',
    border: '#065f46',
  ),
  PdfTheme(
    name: 'ডিপ জেড কোরাল',
    primary: '#064439',
    secondary: '#0d6e5d',
    accent: '#e11d48',
    qbBg: '#edfbf7',
    exBg: '#fff1f2',
    border: '#0a5c4e',
  ),
  PdfTheme(
    name: 'অ্যালপাইন স্প্রুস গোল্ড',
    primary: '#133e36',
    secondary: '#1f5e53',
    accent: '#d97706',
    qbBg: '#f2faf7',
    exBg: '#fffbeb',
    border: '#1c5248',
  ),
  PdfTheme(
    name: 'অ্যামাজন ক্যানোপি অরেঞ্জ',
    primary: '#0c3823',
    secondary: '#175739',
    accent: '#c2410c',
    qbBg: '#effaf3',
    exBg: '#fff7ed',
    border: '#155235',
  ),
  PdfTheme(
    name: 'সিফোম ডিপ স্লেট',
    primary: '#134e4a',
    secondary: '#115e59',
    accent: '#0f766e',
    qbBg: '#f0fdfa',
    exBg: '#f8fafc',
    border: '#115e59',
  ),
  PdfTheme(
    name: 'ভেরিডিয়ান ব্রোঞ্জ',
    primary: '#1b4332',
    secondary: '#2d6a4f',
    accent: '#b45309',
    qbBg: '#ebf7f0',
    exBg: '#fefce8',
    border: '#2d6a4f',
  ),
  PdfTheme(
    name: 'সাইপ্রেস টেরাকোটা',
    primary: '#1a3c34',
    secondary: '#2b5e52',
    accent: '#c85036',
    qbBg: '#f1f7f5',
    exBg: '#fdf2f0',
    border: '#265247',
  ),
  PdfTheme(
    name: 'ইউক্যালিপটাস রোজ',
    primary: '#1e4640',
    secondary: '#306c64',
    accent: '#be123c',
    qbBg: '#f0f7f5',
    exBg: '#fff1f2',
    border: '#2c5e57',
  ),
  PdfTheme(
    name: 'জঙ্গল এমারেল্ড সিট্রন',
    primary: '#064e3b',
    secondary: '#047857',
    accent: '#65a30d',
    qbBg: '#ecfdf5',
    exBg: '#f7fee7',
    border: '#065f46',
  ),
  PdfTheme(
    name: 'এভারগ্রিন গোল্ড',
    primary: '#0f281e',
    secondary: '#1e4737',
    accent: '#ca8a04',
    qbBg: '#eef8f3',
    exBg: '#fefce8',
    border: '#1b4333',
  ),
  PdfTheme(
    name: 'মালাকাইট স্কারলেট',
    primary: '#0b3c2c',
    secondary: '#15634b',
    accent: '#dc2626',
    qbBg: '#ebfaf4',
    exBg: '#fef2f2',
    border: '#12563f',
  ),
  PdfTheme(
    name: 'বোটানিক্যাল ফার্ন অ্যাম্বার',
    primary: '#1e3f20',
    secondary: '#2f6133',
    accent: '#d97706',
    qbBg: '#f2f9f2',
    exBg: '#fffbeb',
    border: '#2d5a30',
  ),
  PdfTheme(
    name: 'অ্যাকোয়ামেরিন এবিস',
    primary: '#083344',
    secondary: '#0e4e66',
    accent: '#0891b2',
    qbBg: '#ecfeff',
    exBg: '#f0fdfa',
    border: '#0e7490',
  ),
  PdfTheme(
    name: 'অক্সফোর্ড ইম্পেরিয়াল মেরুন',
    primary: '#420d18',
    secondary: '#701a2b',
    accent: '#b45309',
    qbBg: '#fff7ed',
    exBg: '#fefce8',
    border: '#701a2b',
  ),
  PdfTheme(
    name: 'বার্গান্ডি অ্যান্টিক গোল্ড',
    primary: '#4a0e17',
    secondary: '#751a28',
    accent: '#ca8a04',
    qbBg: '#fdf2f4',
    exBg: '#fefce8',
    border: '#801827',
  ),
  PdfTheme(
    name: 'ক্রিমসন ভেলভেট নেভি',
    primary: '#500717',
    secondary: '#7d1028',
    accent: '#0369a1',
    qbBg: '#fdf2f4',
    exBg: '#f0f9ff',
    border: '#881337',
  ),
  PdfTheme(
    name: 'বোরদো রোজ গোল্ড',
    primary: '#3b0713',
    secondary: '#631224',
    accent: '#e11d48',
    qbBg: '#fdf4f6',
    exBg: '#fff1f2',
    border: '#6b1124',
  ),
  PdfTheme(
    name: 'ইম্পেরিয়াল রুবি অ্যাম্বার',
    primary: '#4c0519',
    secondary: '#881337',
    accent: '#ea580c',
    qbBg: '#fff1f2',
    exBg: '#fff7ed',
    border: '#9f1239',
  ),
  PdfTheme(
    name: 'স্যাংরিয়া টাস্কান গোল্ড',
    primary: '#43101b',
    secondary: '#6b1d2e',
    accent: '#b45309',
    qbBg: '#fcf2f4',
    exBg: '#fefce8',
    border: '#6b1d2e',
  ),
  PdfTheme(
    name: 'ক্যাবারনেট কপার',
    primary: '#3f121d',
    secondary: '#661e2f',
    accent: '#a16207',
    qbBg: '#fcf3f5',
    exBg: '#fef9c3',
    border: '#661e2f',
  ),
  PdfTheme(
    name: 'গার্নেট ফ্লেম',
    primary: '#4e0d1d',
    secondary: '#821932',
    accent: '#e02424',
    qbBg: '#fdf2f4',
    exBg: '#fff5f5',
    border: '#821932',
  ),
  PdfTheme(
    name: 'স্কারলেট নাইট টিল',
    primary: '#450a0a',
    secondary: '#7f1d1d',
    accent: '#0f766e',
    qbBg: '#fef2f2',
    exBg: '#f0fdfa',
    border: '#7f1d1d',
  ),
  PdfTheme(
    name: 'পার্সিয়ান রোজ স্লেট',
    primary: '#4a0d24',
    secondary: '#7e1d44',
    accent: '#0284c7',
    qbBg: '#fdf2f8',
    exBg: '#f8fafc',
    border: '#7e1d44',
  ),
  PdfTheme(
    name: 'চেরি নোয়ার গোল্ড',
    primary: '#360914',
    secondary: '#5c1325',
    accent: '#d97706',
    qbBg: '#fdf3f5',
    exBg: '#fffbeb',
    border: '#5c1325',
  ),
  PdfTheme(
    name: 'মেহগনি ব্লেজ',
    primary: '#3d1414',
    secondary: '#632424',
    accent: '#ea580c',
    qbBg: '#faf2f2',
    exBg: '#fff7ed',
    border: '#632424',
  ),
  PdfTheme(
    name: 'মারলো শ্যাম্পেন',
    primary: '#3a0c18',
    secondary: '#5e172a',
    accent: '#b45309',
    qbBg: '#fdf3f6',
    exBg: '#fffbeb',
    border: '#5e172a',
  ),
  PdfTheme(
    name: 'ড্যামসন প্লাম কোরাল',
    primary: '#3c0d29',
    secondary: '#661b48',
    accent: '#e11d48',
    qbBg: '#fdf2f9',
    exBg: '#fff1f2',
    border: '#661b48',
  ),
  PdfTheme(
    name: 'কারমাইন রয়্যাল গোল্ড',
    primary: '#540d1a',
    secondary: '#87192d',
    accent: '#b45309',
    qbBg: '#fdf3f5',
    exBg: '#fefce8',
    border: '#87192d',
  ),
  PdfTheme(
    name: 'রিগাল ইন্ডিগো পার্পল',
    primary: '#261f5e',
    secondary: '#3e3294',
    accent: '#7c3aed',
    qbBg: '#eef2ff',
    exBg: '#faf5ff',
    border: '#312e81',
  ),
  PdfTheme(
    name: 'বাইজেন্টাইন পার্পল গোল্ড',
    primary: '#3b0764',
    secondary: '#581c87',
    accent: '#d97706',
    qbBg: '#faf5ff',
    exBg: '#fffbeb',
    border: '#581c87',
  ),
  PdfTheme(
    name: 'ডিপ অ্যামেথিস্ট সায়ান',
    primary: '#2e1065',
    secondary: '#4c1d95',
    accent: '#0891b2',
    qbBg: '#faf5ff',
    exBg: '#ecfeff',
    border: '#4c1d95',
  ),
  PdfTheme(
    name: 'রয়্যাল প্লাম অ্যাম্বার',
    primary: '#36123d',
    secondary: '#582063',
    accent: '#ea580c',
    qbBg: '#fbf5fd',
    exBg: '#fff7ed',
    border: '#582063',
  ),
  PdfTheme(
    name: 'ভেলভেট ভায়োলেট রোজ',
    primary: '#38114f',
    secondary: '#5b1e7e',
    accent: '#e11d48',
    qbBg: '#faf4fd',
    exBg: '#fff1f2',
    border: '#5b1e7e',
  ),
  PdfTheme(
    name: 'নাইটশেড লাইম',
    primary: '#240d3b',
    secondary: '#421b68',
    accent: '#65a30d',
    qbBg: '#f8f3fc',
    exBg: '#f7fee7',
    border: '#421b68',
  ),
  PdfTheme(
    name: 'ওবার্গিন ব্রাস',
    primary: '#301032',
    secondary: '#542057',
    accent: '#a16207',
    qbBg: '#faf3fa',
    exBg: '#fefce8',
    border: '#542057',
  ),
  PdfTheme(
    name: 'মালবেরি ট্যাঞ্জারিন',
    primary: '#38142d',
    secondary: '#5a234a',
    accent: '#e8590c',
    qbBg: '#fbf4f9',
    exBg: '#fff4ed',
    border: '#5a234a',
  ),
  PdfTheme(
    name: 'ডার্ক অর্কিড টিল',
    primary: '#2a1447',
    secondary: '#482575',
    accent: '#0f766e',
    qbBg: '#f7f4fc',
    exBg: '#f0fdfa',
    border: '#482575',
  ),
  PdfTheme(
    name: 'ব্ল্যাকবেরি সানসেট',
    primary: '#28102d',
    secondary: '#472050',
    accent: '#ea580c',
    qbBg: '#f9f3fb',
    exBg: '#fff7ed',
    border: '#472050',
  ),
  PdfTheme(
    name: 'মিডনাইট লাইলাক গোল্ড',
    primary: '#221638',
    secondary: '#3c295e',
    accent: '#d97706',
    qbBg: '#f6f3fb',
    exBg: '#fffbeb',
    border: '#3c295e',
  ),
  PdfTheme(
    name: 'টিরিয়ান পার্পল কোরাল',
    primary: '#3b092b',
    secondary: '#63154b',
    accent: '#e11d48',
    qbBg: '#fdf3fa',
    exBg: '#fff1f2',
    border: '#63154b',
  ),
  PdfTheme(
    name: 'ডিপ আইরিস অ্যাম্বার',
    primary: '#1d1a44',
    secondary: '#332f70',
    accent: '#d97706',
    qbBg: '#f2f1fb',
    exBg: '#fffbeb',
    border: '#332f70',
  ),
  PdfTheme(
    name: 'গ্রেপ নোয়ার এমারেল্ড',
    primary: '#280f2d',
    secondary: '#461e4e',
    accent: '#059669',
    qbBg: '#f9f3fa',
    exBg: '#ecfdf5',
    border: '#461e4e',
  ),
  PdfTheme(
    name: 'রয়্যাল ভায়োলেট গোল্ড',
    primary: '#320b57',
    secondary: '#52178b',
    accent: '#ca8a04',
    qbBg: '#faf4ff',
    exBg: '#fefce8',
    border: '#52178b',
  ),
  PdfTheme(
    name: 'সাইবার স্লেট ব্লু',
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#0284c7',
    qbBg: '#f1f5f9',
    exBg: '#f8fafc',
    border: '#1e293b',
  ),
  PdfTheme(
    name: 'অবসিডিয়ান অ্যারোস্পেস ক্রিমসন',
    primary: '#070b14',
    secondary: '#141d2e',
    accent: '#ff4d4f',
    qbBg: '#f4f6fb',
    exBg: '#fff5f5',
    border: '#141d2e',
  ),
  PdfTheme(
    name: 'গ্রাফাইট ইলেকট্রিক অ্যাম্বার',
    primary: '#18181b',
    secondary: '#27272a',
    accent: '#d97706',
    qbBg: '#f4f4f5',
    exBg: '#fffbeb',
    border: '#27272a',
  ),
  PdfTheme(
    name: 'কার্বন নিয়ন টিল',
    primary: '#111827',
    secondary: '#1f2937',
    accent: '#0d9488',
    qbBg: '#f3f4f6',
    exBg: '#f0fdfa',
    border: '#1f2937',
  ),
  PdfTheme(
    name: 'চারকোল ব্লেজ',
    primary: '#1c1917',
    secondary: '#292524',
    accent: '#ea580c',
    qbBg: '#f5f5f4',
    exBg: '#fff7ed',
    border: '#292524',
  ),
  PdfTheme(
    name: 'টাইটানিয়াম স্যাফায়ার',
    primary: '#161b26',
    secondary: '#252e40',
    accent: '#1d4ed8',
    qbBg: '#f2f4f8',
    exBg: '#eff6ff',
    border: '#252e40',
  ),
  PdfTheme(
    name: 'ভলকানিক অ্যাশ রেড',
    primary: '#191516',
    secondary: '#2e2528',
    accent: '#dc2626',
    qbBg: '#f7f4f5',
    exBg: '#fef2f2',
    border: '#2e2528',
  ),
  PdfTheme(
    name: 'স্লেট ম্যাট্রিক্স গ্রিন',
    primary: '#0d1717',
    secondary: '#1b2e2e',
    accent: '#059669',
    qbBg: '#edf7f6',
    exBg: '#ecfdf5',
    border: '#1b2e2e',
  ),
  PdfTheme(
    name: 'ব্যাসাল্ট গোল্ড',
    primary: '#1a1918',
    secondary: '#2e2c29',
    accent: '#ca8a04',
    qbBg: '#f7f6f4',
    exBg: '#fefce8',
    border: '#2e2c29',
  ),
  PdfTheme(
    name: 'ডিপ গানমেটাল সায়ান',
    primary: '#111c24',
    secondary: '#1f313d',
    accent: '#0891b2',
    qbBg: '#eef6f9',
    exBg: '#ecfeff',
    border: '#1f313d',
  ),
  PdfTheme(
    name: 'টাংস্টেন পার্পল',
    primary: '#181524',
    secondary: '#2b243d',
    accent: '#7c3aed',
    qbBg: '#f4f2f9',
    exBg: '#faf5ff',
    border: '#2b243d',
  ),
  PdfTheme(
    name: 'ব্ল্যাক পার্ল কোরাল',
    primary: '#0e161c',
    secondary: '#1c2b36',
    accent: '#e11d48',
    qbBg: '#eff5f8',
    exBg: '#fff1f2',
    border: '#1c2b36',
  ),
  PdfTheme(
    name: 'আয়রন ওর অরেঞ্জ',
    primary: '#1c1815',
    secondary: '#332b25',
    accent: '#ea580c',
    qbBg: '#f7f4f2',
    exBg: '#fff7ed',
    border: '#332b25',
  ),
  PdfTheme(
    name: 'ডার্ক ম্যাটার ভায়োলেট',
    primary: '#110e1c',
    secondary: '#221c36',
    accent: '#7c3aed',
    qbBg: '#f4f2f9',
    exBg: '#faf5ff',
    border: '#221c36',
  ),
  PdfTheme(
    name: 'স্লেট ফ্রস্ট আইস',
    primary: '#0f172a',
    secondary: '#1e293b',
    accent: '#0284c7',
    qbBg: '#f0f9ff',
    exBg: '#f8fafc',
    border: '#1e293b',
  ),
  PdfTheme(
    name: 'এসপ্রেসো গোল্ড',
    primary: '#2b1810',
    secondary: '#4a2c20',
    accent: '#b45309',
    qbBg: '#faf5f2',
    exBg: '#fefce8',
    border: '#4a2c20',
  ),
  PdfTheme(
    name: 'টাস্কান টেরাকোটা টিল',
    primary: '#381c15',
    secondary: '#572e24',
    accent: '#0f766e',
    qbBg: '#faf3f1',
    exBg: '#f0fdfa',
    border: '#572e24',
  ),
  PdfTheme(
    name: 'ডার্ক অ্যাম্বার ব্রোঞ্জ',
    primary: '#331d08',
    secondary: '#543212',
    accent: '#b45309',
    qbBg: '#faf5ef',
    exBg: '#fffbeb',
    border: '#543212',
  ),
  PdfTheme(
    name: 'কাকাও নোয়ার মিন্ট',
    primary: '#261512',
    secondary: '#422520',
    accent: '#059669',
    qbBg: '#f9f4f3',
    exBg: '#ecfdf5',
    border: '#422520',
  ),
  PdfTheme(
    name: 'চেস্টনাট কপার',
    primary: '#331812',
    secondary: '#542a20',
    accent: '#c2410c',
    qbBg: '#faf3f1',
    exBg: '#fff7ed',
    border: '#542a20',
  ),
  PdfTheme(
    name: 'রোস্টেড কফি গোল্ড',
    primary: '#21130d',
    secondary: '#3d241a',
    accent: '#ca8a04',
    qbBg: '#f9f5f3',
    exBg: '#fefce8',
    border: '#3d241a',
  ),
  PdfTheme(
    name: 'আম্বার স্কারলেট',
    primary: '#2e1919',
    secondary: '#4d2d2d',
    accent: '#dc2626',
    qbBg: '#faf3f3',
    exBg: '#fef2f2',
    border: '#4d2d2d',
  ),
  PdfTheme(
    name: 'দারুচিনি অ্যাম্বার',
    primary: '#3b1f15',
    secondary: '#5c3325',
    accent: '#d97706',
    qbBg: '#fbf5f2',
    exBg: '#fffbeb',
    border: '#5c3325',
  ),
  PdfTheme(
    name: 'সিয়েনা সানসেট',
    primary: '#3d1c10',
    secondary: '#612f1d',
    accent: '#ea580c',
    qbBg: '#fcf5f2',
    exBg: '#fff7ed',
    border: '#612f1d',
  ),
  PdfTheme(
    name: 'হHazelnut নেভি',
    primary: '#2e1f18',
    secondary: '#4f362c',
    accent: '#0369a1',
    qbBg: '#faf6f4',
    exBg: '#f0f9ff',
    border: '#4f362c',
  ),
  PdfTheme(
    name: 'রাস্টিক কপার টিল',
    primary: '#381e14',
    secondary: '#593223',
    accent: '#0d9488',
    qbBg: '#fbf5f3',
    exBg: '#f0fdfa',
    border: '#593223',
  ),
  PdfTheme(
    name: 'ডার্ক ক্যারামেল রোজ',
    primary: '#38210f',
    secondary: '#59361b',
    accent: '#e11d48',
    qbBg: '#faf5f1',
    exBg: '#fff1f2',
    border: '#59361b',
  ),
  PdfTheme(
    name: 'সেপিয়া অ্যান্টিক গোল্ড',
    primary: '#291c14',
    secondary: '#473224',
    accent: '#a16207',
    qbBg: '#f8f5f2',
    exBg: '#fefce8',
    border: '#473224',
  ),
  PdfTheme(
    name: 'লেদার ক্রিমসন',
    primary: '#361c16',
    secondary: '#573027',
    accent: '#be123c',
    qbBg: '#faf4f3',
    exBg: '#fff1f2',
    border: '#573027',
  ),
  PdfTheme(
    name: 'ওক সিট্রন',
    primary: '#2b2014',
    secondary: '#473724',
    accent: '#65a30d',
    qbBg: '#f8f6f2',
    exBg: '#f7fee7',
    border: '#473724',
  ),
  PdfTheme(
    name: 'নর্ডিক টোয়াইলাইট',
    primary: '#15222e',
    secondary: '#24394c',
    accent: '#0284c7',
    qbBg: '#f0f6fa',
    exBg: '#f0f9ff',
    border: '#24394c',
  ),
  PdfTheme(
    name: 'সেজ শ্যাডো অ্যাম্বার',
    primary: '#1e2924',
    secondary: '#32443d',
    accent: '#d97706',
    qbBg: '#f3f7f5',
    exBg: '#fffbeb',
    border: '#32443d',
  ),
  PdfTheme(
    name: 'আর্কটিক মিডনাইট কোরাল',
    primary: '#101c26',
    secondary: '#1d3142',
    accent: '#e11d48',
    qbBg: '#eef5fa',
    exBg: '#fff1f2',
    border: '#1d3142',
  ),
  PdfTheme(
    name: 'গ্লাসিয়াল ফজর্ড গোল্ড',
    primary: '#14252e',
    secondary: '#233e4c',
    accent: '#ca8a04',
    qbBg: '#eff6f9',
    exBg: '#fefce8',
    border: '#233e4c',
  ),
  PdfTheme(
    name: 'বোরিয়াল ফরেস্ট ফ্লেম',
    primary: '#11261d',
    secondary: '#1f4133',
    accent: '#ea580c',
    qbBg: '#eef7f3',
    exBg: '#fff7ed',
    border: '#1f4133',
  ),
  PdfTheme(
    name: 'ড্যানিশ স্লেট মিন্ট',
    primary: '#182329',
    secondary: '#293942',
    accent: '#059669',
    qbBg: '#f1f6f8',
    exBg: '#ecfdf5',
    border: '#293942',
  ),
  PdfTheme(
    name: 'সুইডিশ স্টিল অ্যাম্বার',
    primary: '#18212b',
    secondary: '#283645',
    accent: '#d97706',
    qbBg: '#f1f5f9',
    exBg: '#fffbeb',
    border: '#283645',
  ),
  PdfTheme(
    name: 'আইসল্যান্ডিক মস রোজ',
    primary: '#1c261e',
    secondary: '#2e3d31',
    accent: '#e11d48',
    qbBg: '#f2f7f3',
    exBg: '#fff1f2',
    border: '#2e3d31',
  ),
  PdfTheme(
    name: 'বাল্টিক সি গোল্ড',
    primary: '#0e1f2b',
    secondary: '#19354a',
    accent: '#d97706',
    qbBg: '#edf5fb',
    exBg: '#fffbeb',
    border: '#19354a',
  ),
  PdfTheme(
    name: 'ফজর্ড অবসিডিয়ান সায়ান',
    primary: '#0c1922',
    secondary: '#162c3b',
    accent: '#0891b2',
    qbBg: '#eef6fa',
    exBg: '#ecfeff',
    border: '#162c3b',
  ),
];

class PrintService {
  // --- Bengali Number Conversion ---
  String _toBn(dynamic n) {
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return n.toString().replaceAllMapped(RegExp(r'\d'), (m) => bn[int.parse(m[0]!)]);
  }

  // --- Dynamic Random & Seeded Theme Resolver ---
  PdfTheme _resolveTheme(String subject, String examType, [int? customSeed]) {
    if (kCuratedThemes.isEmpty) {
      return const PdfTheme(
        name: 'Default',
        primary: '#244f5d',
        secondary: '#0f4c5c',
        accent: '#c64040',
        qbBg: '#e6f1f1',
        exBg: '#fdf0ec',
        border: '#0f4c5c',
      );
    }
    if (customSeed != null) {
      return kCuratedThemes[customSeed.abs() % kCuratedThemes.length];
    }
    // Dynamic random selection based on current time + subject hash
    final seedString = '$subject $examType ${DateTime.now().millisecondsSinceEpoch}';
    final hash = seedString.codeUnits.fold<int>(0, (prev, elem) => (prev * 31 + elem) & 0x7fffffff);
    return kCuratedThemes[hash % kCuratedThemes.length];
  }

  // --- LaTeX Preprocessor ---
  String _renderLatex(String? text) {
    if (text == null || text.isEmpty) return '';
    var s = text;
    // Fix Chemistry \ce{...}
    s = s.replaceAllMapped(RegExp(r'\\ce\{([^{}]*)\}'), (m) {
      final inner = m[1] ?? '';
      return inner.replaceAllMapped(RegExp(r'([A-Za-z\)])_?(\d+)'), (m2) => '${m2[1]}_${m2[2]}');
    });
    // Temperatures & degrees
    s = s.replaceAll(RegExp(r'\^\{?\\circ\}?\s*(?:\\text\{C\}|C)'), r'^{\circ}\text{C}');
    s = s.replaceAll(RegExp(r'\^\{?\\circ\}?\s*(?:\\text\{F\}|F)'), r'^{\circ}\text{F}');
    s = s.replaceAll(RegExp(r'\^\{?\\circ\}?'), r'^{\circ}');
    s = s.replaceAll(r'\degree', r'^{\circ}');
    return s;
  }

  // ----------------------------------------------------------------------
  // 1. PRINT QUESTION PAPER (Zero-Gap 2-Column Standard)
  // ----------------------------------------------------------------------
  Future<void> printQuestionPaper(
    ExamDetails details,
    List<Question> questions,
  ) async {
    final theme = _resolveTheme(details.subject, details.examType);
    final labels = ['ক', 'খ', 'গ', 'ঘ'];

    final htmlContent = '''
      <!DOCTYPE html>
      <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <title>${details.subject} - প্রশ্নপত্র</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
              onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false, strict: 'ignore'});"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600;700;800&family=Tinos:ital,wght@0,400;0,700;1,400&display=swap');
            
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }

            * { box-sizing: border-box; }

            body { 
              font-family: 'Noto Serif Bengali', 'Tinos', serif; 
              font-size: 9.5pt; 
              color: #111827;
              line-height: 1.35;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .header-container {
              text-align: center;
              border-bottom: 2.5px solid ${theme.primary};
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .brand-name {
              font-size: 17pt;
              font-weight: 800;
              color: ${theme.primary};
              margin: 0 0 2px 0;
              letter-spacing: 0.5px;
            }
            .exam-badge {
              font-size: 10pt;
              font-weight: 700;
              margin: 3px 0 6px 0;
              border: 1px solid ${theme.border};
              display: inline-block;
              padding: 2px 14px;
              border-radius: 4px;
              background: ${theme.qbBg};
              color: ${theme.primary};
            }
            
            .meta-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 4px;
              border-top: 0.5px solid #cbd5e1;
              padding-top: 4px;
            }
            .meta-table td {
              padding: 3px 2px;
              font-weight: 600;
              font-size: 8.5pt;
              color: #1f2937;
              vertical-align: middle;
            }

            .content-wrapper {
              column-count: 2;
              column-gap: 20px;
              column-rule: 0.5px solid #d1d5db;
              -webkit-column-count: 2;
              -webkit-column-gap: 20px;
              -webkit-column-rule: 0.5px solid #d1d5db;
            }

            .question-card {
              break-inside: avoid; 
              -webkit-column-break-inside: avoid;
              page-break-inside: avoid;
              margin-bottom: 9px;
              padding: 4px 6px;
              border-bottom: 0.5px dashed #e2e8f0;
            }
            .q-header {
              display: flex;
              align-items: baseline;
              font-weight: 600;
              margin-bottom: 3px;
              font-size: 9.5pt;
            }
            .q-num {
              font-weight: 800;
              min-width: 20px;
              flex-shrink: 0;
              color: ${theme.primary};
            }
            .q-text {
              flex: 1;
              line-height: 1.35;
            }
            .q-marks {
              font-size: 8pt;
              color: #64748b;
              margin-left: 4px;
              white-space: nowrap;
            }

            .options-list {
              list-style-type: none;
              padding: 0;
              margin: 3px 0 2px 16px;
              display: flex;
              flex-wrap: wrap;
            }
            .option-item {
              width: 50%;
              min-width: 100px;
              box-sizing: border-box;
              padding-right: 4px;
              margin-bottom: 2px;
              font-size: 9pt;
              display: flex;
              align-items: flex-start;
            }
            .opt-label {
              font-weight: 700;
              margin-right: 3px;
              color: ${theme.primary};
            }

            .footer-row {
              margin-top: 14px;
              padding-top: 6px;
              border-top: 1px solid #cbd5e1;
              font-size: 8pt;
              color: #64748b;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1 class="brand-name">অভ্যাস • Obhyash</h1>
            <div class="exam-badge">${details.subject} — প্রশ্নপত্র</div>
            
            <table class="meta-table">
              <tr>
                <td style="text-align: left; width: 33%;">
                  সময়: ${_toBn(details.durationMinutes)} মিনিট
                </td>
                <td style="text-align: center; width: 34%;">
                  অধ্যায়: ${details.chapters.isEmpty ? 'সম্পূর্ণ' : details.chapters}
                </td>
                <td style="text-align: right; width: 33%;">
                  পূর্ণমান: ${_toBn(details.totalMarks)}
                </td>
              </tr>
            </table>
          </div>

          <div class="content-wrapper">
            ${questions.asMap().entries.map((entry) {
              final idx = entry.key;
              final q = entry.value;

              return '''
                <div class="question-card">
                  <div class="q-header">
                    <span class="q-num">(${_toBn(idx + 1)})</span>
                    <span class="q-text">${_renderLatex(q.text)}</span>
                    <span class="q-marks">[${_toBn(q.points)}]</span>
                  </div>
                  <ul class="options-list">
                    ${q.options.asMap().entries.map((optEntry) {
                      final oIdx = optEntry.key;
                      final opt = optEntry.value;
                      final lbl = oIdx < labels.length ? labels[oIdx] : 'ক';
                      return '''
                        <li class="option-item">
                          <span class="opt-label">($lbl)</span>
                          <span>${_renderLatex(opt)}</span>
                        </li>
                      ''';
                    }).join('')}
                  </ul>
                </div>
              ''';
            }).join('')}
          </div>

          <div class="footer-row">
            <span>অভ্যাস — www.obhyash.com</span>
            <span>স্মার্ট প্রস্তুতি ও আনলিমিটেড প্র্যাকটিস</span>
          </div>
        </body>
      </html>
    ''';

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async =>
          await Printing.convertHtml(format: format, html: htmlContent),
    );
  }

  // ----------------------------------------------------------------------
  // 2. PRINT OMR SHEET
  // ----------------------------------------------------------------------
  Future<void> printOMRSheet(ExamDetails details, int totalQuestions) async {
    const QUESTIONS_PER_COL = 25;
    const COLS_PER_PAGE = 4;
    const QUESTIONS_PER_PAGE = QUESTIONS_PER_COL * COLS_PER_PAGE;
    final totalPages = (totalQuestions / QUESTIONS_PER_PAGE).ceil();

    String renderQuestionColumn(int startIdx, int endIdx) {
      String html = '';
      for (int i = startIdx; i < endIdx; i++) {
        final qNum = i + 1;
        final exists = i < totalQuestions;
        final opacity = exists ? 1 : 0.15;

        html += '''
            <div class="omr-row" style="opacity: $opacity">
                <span class="q-num">$qNum</span>
                <div class="bubbles-group">
                    <div class="bubble">A</div>
                    <div class="bubble">B</div>
                    <div class="bubble">C</div>
                    <div class="bubble">D</div>
                </div>
            </div>
        ''';
      }
      return '<div class="q-column">$html</div>';
    }

    String pagesHtml = '';
    for (int page = 0; page < totalPages; page++) {
      final pageStartQ = page * QUESTIONS_PER_PAGE;
      final qrDataMap = {
        "app": "obhyash",
        "sub": details.subject.length > 15 ? details.subject.substring(0, 15) : details.subject,
        "pg": page + 1,
        "tot": totalPages,
      };
      final qrData = jsonEncode(qrDataMap);
      final qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${Uri.encodeComponent(qrData)}";

      String columnsHtml = '';
      for (int c = 0; c < COLS_PER_PAGE; c++) {
        final colStart = pageStartQ + (c * QUESTIONS_PER_COL);
        final colEnd = colStart + QUESTIONS_PER_COL;
        columnsHtml += renderQuestionColumn(colStart, colEnd);
      }

      pagesHtml += '''
        <div class="page-container">
            <div class="fiducial tl"></div>
            <div class="fiducial tr"></div>
            <div class="fiducial bl"></div>
            <div class="fiducial br"></div>

            <div class="header">
                <div class="header-left">
                    <h1>OBHYASH OMR ANSWER SHEET</h1>
                    <div class="exam-meta">
                        <div><strong>বিষয়:</strong> ${details.subject}</div>
                        <div><strong>পরীক্ষার ধরন:</strong> ${details.examType}</div>
                    </div>
                </div>
                <div class="header-right">
                    <img src="$qrUrl" class="qr-code" alt="QR" />
                    <div class="page-info">Page ${page + 1} of $totalPages</div>
                </div>
            </div>

            <div class="sheet-body">
                $columnsHtml
            </div>

            <div class="footer">
                <div class="sig-box">Student Signature</div>
                <div class="sig-box">Invigilator Signature</div>
            </div>
        </div>
      ''';
    }

    final htmlContent = '''
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Obhyash OMR Sheet</title>
          <style>
              @page { size: A4 portrait; margin: 10mm; }
              * { box-sizing: border-box; }
              body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
              .page-container {
                  position: relative; width: 100%; height: 100%;
                  page-break-after: always; display: flex; flex-direction: column;
              }
              .fiducial { width: 6mm; height: 6mm; background: #000; position: absolute; }
              .tl { top: 0; left: 0; } .tr { top: 0; right: 0; }
              .bl { bottom: 0; left: 0; } .br { bottom: 0; right: 0; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding: 6px 12px 10px 12px; margin-bottom: 15px; }
              .header h1 { font-size: 16pt; margin: 0; font-weight: 900; }
              .exam-meta { font-size: 9pt; margin-top: 4px; }
              .qr-code { width: 45px; height: 45px; }
              .page-info { font-size: 8pt; font-weight: bold; }
              .sheet-body { display: flex; justify-content: space-between; flex: 1; padding: 0 10px; }
              .q-column { width: 23%; }
              .omr-row { display: flex; align-items: center; margin-bottom: 5px; height: 18px; }
              .q-num { width: 20px; font-size: 10px; font-weight: bold; text-align: right; margin-right: 6px; }
              .bubbles-group { display: flex; gap: 5px; }
              .bubble { width: 16px; height: 16px; border: 1.2px solid #000; border-radius: 50%; font-size: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; }
              .footer { display: flex; justify-content: space-between; margin-top: 15px; padding: 0 20px; }
              .sig-box { width: 35%; border-top: 1px solid #000; text-align: center; font-size: 8pt; padding-top: 3px; }
          </style>
        </head>
        <body>
          $pagesHtml
        </body>
      </html>
    ''';

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async =>
          await Printing.convertHtml(format: format, html: htmlContent),
    );
  }

  // ----------------------------------------------------------------------
  // 3. PRINT RESULTS WITH EXPLANATIONS (Zero-Gap Flexible Architecture)
  // ----------------------------------------------------------------------
  Future<void> printResultWithExplanations(
    ExamDetails details,
    List<Question> questions,
    Map<int, int> userAnswers,
  ) async {
    final theme = _resolveTheme(details.subject, details.examType);
    final labels = ['ক', 'খ', 'গ', 'ঘ'];

    int correctCount = 0;
    int wrongCount = 0;
    for (var q in questions) {
      final ua = userAnswers[q.id];
      if (ua != null) {
        if (ua == q.correctAnswerIndex) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    }

    final htmlContent = '''
      <!DOCTYPE html>
      <html lang="bn">
        <head>
          <meta charset="UTF-8">
          <title>${details.subject} - ফলাফল ও সমাধান</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
              onload="renderMathInElement(document.body, {delimiters: [{left: '$$', right: '$$', display: true}, {left: '$', right: '$', display: false}], throwOnError: false, strict: 'ignore'});"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600;700;800&family=Tinos:ital,wght@0,400;0,700;1,400&display=swap');
            
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }

            * { box-sizing: border-box; }

            body { 
              font-family: 'Noto Serif Bengali', 'Tinos', serif; 
              font-size: 9.5pt; 
              color: #111827;
              line-height: 1.35;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .header-container {
              text-align: center;
              border-bottom: 2.5px solid ${theme.primary};
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .brand-name {
              font-size: 17pt;
              font-weight: 800;
              color: ${theme.primary};
              margin: 0 0 2px 0;
            }
            .exam-badge {
              font-size: 10pt;
              font-weight: 700;
              margin: 3px 0 6px 0;
              border: 1px solid ${theme.border};
              display: inline-block;
              padding: 2px 14px;
              border-radius: 4px;
              background: ${theme.qbBg};
              color: ${theme.primary};
            }
            
            .meta-box {
              border: 0.5px solid #cbd5e1;
              padding: 4px 10px;
              display: flex;
              justify-content: space-between;
              margin-top: 4px;
              font-weight: 600;
              font-size: 8.5pt;
              background: #f8fafc;
              border-radius: 4px;
            }

            /* Strict 2-Column Layout */
            .content-wrapper {
              column-count: 2;
              column-gap: 20px;
              column-rule: 0.5px solid #d1d5db;
              -webkit-column-count: 2;
              -webkit-column-gap: 20px;
              -webkit-column-rule: 0.5px solid #d1d5db;
            }

            /* Question Card (Unbreakable Stem + Options) */
            .question-card {
              break-inside: avoid;
              -webkit-column-break-inside: avoid;
              page-break-inside: avoid;
              margin-bottom: 2px;
              padding: 5px 6px;
              border: 0.5px solid #e2e8f0;
              border-radius: 4px;
              background: #ffffff;
            }
            
            .q-header {
              display: flex;
              align-items: baseline;
              font-weight: 600;
              margin-bottom: 3px;
              font-size: 9.5pt;
            }
            .q-num {
              font-weight: 800;
              min-width: 20px;
              color: ${theme.primary};
            }
            .q-text { flex: 1; line-height: 1.35; }
            
            .status-indicator {
               font-size: 7.5pt;
               padding: 1px 5px;
               border-radius: 3px;
               margin-left: 4px;
               font-weight: 700;
            }
            .status-correct { background: #dcfce7; color: #15803d; border: 0.5px solid #86efac; }
            .status-wrong { background: #fee2e2; color: #b91c1c; border: 0.5px solid #fca5a5; }
            .status-skipped { background: #f1f5f9; color: #64748b; border: 0.5px solid #cbd5e1; }

            .options-list {
              list-style: none;
              padding: 0;
              margin: 3px 0 2px 14px;
              display: flex;
              flex-wrap: wrap;
            }
            .option-row {
              width: 50%;
              min-width: 100px;
              margin-bottom: 2px;
              display: flex;
              font-size: 9pt;
            }
            .opt-marker {
              font-weight: 700;
              margin-right: 3px;
              color: ${theme.primary};
            }
            .opt-text { flex: 1; }
            
            .opt-correct-style {
              font-weight: 700;
              color: #15803d;
            }
            .opt-wrong-user-style {
              font-weight: 600;
              color: #b91c1c;
              text-decoration: line-through;
            }

            /* Flexible Explanation Card (Breaks cleanly across pages without leaving gaps) */
            .explanation-card {
              break-inside: auto;
              -webkit-column-break-inside: auto;
              page-break-inside: auto;
              orphans: 3;
              widows: 3;
              margin-bottom: 9px;
              padding: 5px 8px;
              border-left: 2.5px solid ${theme.accent};
              background: ${theme.exBg};
              border-radius: 3px;
              font-size: 8.5pt;
              line-height: 1.35;
              color: #1f2937;
            }
            .exp-label {
              font-weight: 700;
              color: ${theme.accent};
              margin-right: 4px;
            }

            .footer-row {
              margin-top: 14px;
              padding-top: 6px;
              border-top: 1px solid #cbd5e1;
              font-size: 8pt;
              color: #64748b;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1 class="brand-name">অভ্যাস • Obhyash</h1>
            <div class="exam-badge">${details.subject} — ফলাফল ও সমাধান পত্র</div>
            
            <div class="meta-box">
               <div>মোট প্রশ্ন: ${_toBn(questions.length)}টি</div>
               <div>সঠিক: ${_toBn(correctCount)}টি</div>
               <div>ভুল: ${_toBn(wrongCount)}টি</div>
               <div>পূর্ণমান: ${_toBn(details.totalMarks)}</div>
            </div>
          </div>
          
          <div class="content-wrapper">
            ${questions.asMap().entries.map((entry) {
              final idx = entry.key;
              final q = entry.value;
              final userAnswer = userAnswers[q.id];
              final isCorrect = userAnswer == q.correctAnswerIndex;
              final isSkipped = userAnswer == null;

              String statusHtml = '';
              if (isSkipped) {
                statusHtml = '<span class="status-indicator status-skipped">অনুত্তর</span>';
              } else if (isCorrect) {
                statusHtml = '<span class="status-indicator status-correct">সঠিক ✓</span>';
              } else {
                statusHtml = '<span class="status-indicator status-wrong">ভুল ✗</span>';
              }

              final hasExp = q.explanation.trim().isNotEmpty && q.explanation.trim() != 'N/A';

              return '''
                <div class="question-card">
                  <div class="q-header">
                     <span class="q-num">(${_toBn(idx + 1)})</span>
                     <span class="q-text">${_renderLatex(q.text)}</span>
                     $statusHtml
                  </div>
                  <ul class="options-list">
                     ${q.options.asMap().entries.map((optEntry) {
                        final oIdx = optEntry.key;
                        final opt = optEntry.value;
                        final isCorrectOpt = q.correctAnswerIndex == oIdx;
                        final isUserOpt = userAnswer == oIdx;
                        final lbl = oIdx < labels.length ? labels[oIdx] : 'ক';

                        String styleClass = '';
                        if (isCorrectOpt) styleClass = 'opt-correct-style';
                        if (isUserOpt && !isCorrectOpt) styleClass = 'opt-wrong-user-style';

                        return '''
                          <li class="option-row">
                            <span class="opt-marker">($lbl)</span>
                            <span class="opt-text $styleClass">${_renderLatex(opt)}</span>
                          </li>
                        ''';
                     }).join('')}
                  </ul>
                </div>
                ${hasExp ? '''
                  <div class="explanation-card">
                    <span class="exp-label">ব্যাখ্যা:</span> ${_renderLatex(q.explanation)}
                  </div>
                ''' : ''}
              ''';
            }).join('')}
          </div>
          
          <div class="footer-row">
             <span>অভ্যাস — www.obhyash.com</span>
             <span>ফলাফল ও পুঙ্খানুপুঙ্খ ব্যাখ্যা</span>
          </div>
        </body>
      </html>
    ''';

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async =>
          await Printing.convertHtml(format: format, html: htmlContent),
    );
  }

  // ----------------------------------------------------------------------
  // 4. CONVENIENCE WRAPPERS FOR EXAM RESULT
  // ----------------------------------------------------------------------

  Future<void> generateQuestionPaper(ExamResult result) async {
    final details = _mapResultToDetails(result);
    await printQuestionPaper(details, result.questions ?? []);
  }

  Future<void> generateResultPdf(ExamResult result) async {
    final details = _mapResultToDetails(result);
    await printResultWithExplanations(
      details,
      result.questions ?? [],
      result.userAnswers ?? {},
    );
  }

  ExamDetails _mapResultToDetails(ExamResult result) {
    return ExamDetails(
      subject: result.subject,
      examType: result.examType ?? 'মডেল টেস্ট',
      chapters: 'N/A',
      topics: 'N/A',
      totalQuestions: result.totalQuestions,
      durationMinutes: (result.timeTaken / 60).ceil(),
      totalMarks: result.totalMarks,
      negativeMarking: result.negativeMarking,
    );
  }
}

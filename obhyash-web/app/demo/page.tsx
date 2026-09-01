import { Metadata } from 'next';
import DemoExamClient from '@/components/demo/DemoExamClient';

export const metadata: Metadata = {
  title: 'ডেমো পরীক্ষা | অভ্যাস (Obhyash)',
  description:
    'লগইন ছাড়াই সরাসরি ১০ মিনিটের ডেমো মডেল টেস্ট দিয়ে অভ্যাসের এক্সাম ইঞ্জিন ও সমাধান এক্সপেরিয়েন্স করো।',
};

export default function DemoPage() {
  return <DemoExamClient />;
}

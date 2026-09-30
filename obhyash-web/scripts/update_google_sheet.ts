import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const SPREADSHEET_ID = '1b9YeiVz89q0dSisDg1kpK8peO-FA6G9Y4K4UVQ7Tvug';

const BN_DAYS: Record<string, string> = {
  Sat: 'শনিবার',
  Sun: 'রবিবার',
  Mon: 'সোমবার',
  Tue: 'মঙ্গলবার',
  Wed: 'বুধবার',
  Thu: 'বৃহস্পতিবার',
  Fri: 'শুক্রবার',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ExamSchedule {
  dateStr: string;   // '03 Oct 2026'
  dayStr: string;    // 'শনিবার'
  timeStr: string;   // 'সন্ধ্যা ৬:০০ - রাত ১০:০০ (ফলাফল ১০:১৫)'
}

function getSchedule(category: string, title: string): ExamSchedule {
  const baseSat = new Date(Date.UTC(2026, 9, 3)); // Oct 3, 2026
  const clean = title.trim();
  const numMatch = clean.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1], 10) : 1;

  const isWeekly = clean.toLowerCase().includes('weekly') || clean.toLowerCase().includes('mega');
  const isMock = clean.toLowerCase().includes('mock');

  let dayOffset = 0;
  let isWeeklyExam = false;

  if (category === 'Medical') {
    // Medical: Sat, Mon, Wed (Daily), Fri (Weekly)
    if (isWeekly && !clean.toLowerCase().includes('live')) {
      const week = num - 1;
      dayOffset = week * 7 + 6; // Friday
      isWeeklyExam = true;
    } else if (isMock) {
      dayOffset = 7 * 7 + (num === 1 ? 0 : 2); // Sat / Mon
    } else {
      const week = Math.floor((num - 1) / 3);
      const dayInWeek = (num - 1) % 3;
      const days = [0, 2, 4]; // Sat, Mon, Wed
      dayOffset = week * 7 + days[dayInWeek];
    }
  } else {
    // Engineering & Varsity: Sun, Tue, Thu (Daily), Fri (Weekly)
    if (isWeekly && !clean.toLowerCase().includes('live')) {
      const week = num - 1;
      dayOffset = week * 7 + 6; // Friday
      isWeeklyExam = true;
    } else if (isMock) {
      const week = category === 'Engineering' ? 8 : 7;
      dayOffset = week * 7 + (num === 1 ? 1 : 3); // Sun / Tue
    } else {
      const week = Math.floor((num - 1) / 3);
      const dayInWeek = (num - 1) % 3;
      const days = [1, 3, 5]; // Sun, Tue, Thu
      dayOffset = week * 7 + days[dayInWeek];
    }
  }

  const d = new Date(baseSat.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  const dayNameEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
  const dayStr = BN_DAYS[dayNameEn] || dayNameEn;
  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${pad2(d.getUTCDate())} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

  const timeStr = isWeeklyExam
    ? 'সকাল ৭:০০ - রাত ১০:০০ (ফলাফল ১০:১৫)'
    : 'সন্ধ্যা ৬:০০ - রাত ১০:০০ (ফলাফল ১০:১৫)';

  return { dateStr, dayStr, timeStr };
}

async function run() {
  const tracks = ['Medical', 'Engineering', 'Varsity_A'];
  const allUpdates: Record<string, any[]> = {};

  for (const track of tracks) {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(track)}`;
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
    const rows = json.table.rows;

    const sheetUpdates = rows.map((r: any, idx: number) => {
      const examName = r.c[2]?.v?.toString() || '';
      const subject = r.c[3]?.v?.toString() || '';
      const syllabus = r.c[4]?.v?.toString() || '';
      const oldMarks = r.c[5]?.v?.toString() || '';

      const schedule = getSchedule(track, examName);

      // Keep marks info e.g. "৫০ মার্কস (৩০ মিনিট)"
      const marksMatch = oldMarks.match(/([^|]+)/);
      const marksPart = marksMatch ? marksMatch[1].trim() : '৫০ মার্কস (৩০ মিনিট)';
      const updatedMarksTime = `${marksPart} | ${schedule.timeStr}`;

      return {
        rowNumber: idx + 2, // 1-indexed, row 1 is header
        date: schedule.dateStr,
        day: schedule.dayStr,
        examName,
        subject,
        syllabus,
        marksTime: updatedMarksTime,
      };
    });

    allUpdates[track] = sheetUpdates;
    console.log(`Processed ${track}: ${sheetUpdates.length} rows.`);
  }

  // 1. Generate Google Apps Script file
  const gasCode = `/**
 * Obhyash Live Exam Routine Auto-Updater
 * Paste this code into: Google Sheets -> Extensions -> Apps Script -> Code.gs -> Run
 */
function updateLiveExamRoutine() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var routineData = ${JSON.stringify(allUpdates, null, 2)};
  
  for (var sheetName in routineData) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log("Sheet not found: " + sheetName);
      continue;
    }
    
    var rows = routineData[sheetName];
    Logger.log("Updating " + sheetName + " (" + rows.length + " rows)...");
    
    for (var i = 0; i < rows.length; i++) {
      var item = rows[i];
      var r = item.rowNumber;
      
      // Update Column A: Date
      sheet.getRange(r, 1).setValue(item.date);
      // Update Column B: Day
      sheet.getRange(r, 2).setValue(item.day);
      // Update Column F: Marks & Time
      sheet.getRange(r, 6).setValue(item.marksTime);
    }
    Logger.log("Successfully updated " + sheetName + "!");
  }
  
  SpreadsheetApp.getUi().alert("অভিনন্দন! মেডিকেল, ইঞ্জিনিয়ারিং ও ভার্সিটি ক-এর সকল লাইভ এক্সামের নতুন তারিখ ও সময় সফলভাবে আপডেট হয়েছে।");
}
`;

  fs.writeFileSync('scripts/google_apps_script.js', gasCode, 'utf-8');
  console.log('✅ Generated scripts/google_apps_script.js');

  // 2. Try Node.js direct update via Service Account API
  const saRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!saRaw) {
    console.log('No service account key found for direct API.');
    return;
  }
  const sa = JSON.parse(saRaw);

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodeBase64Url = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signInput = `${encodeBase64Url(header)}.${encodeBase64Url(claimSet)}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const signature = signer.sign(sa.private_key, 'base64url');
  const jwt = `${signInput}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    console.log('Google Auth failed (Service Account needs Sheets API):', tokenData);
    return;
  }

  // Attempt batchUpdate on Google Sheets
  const updateData = [];
  for (const track of tracks) {
    const rows = allUpdates[track];
    for (const item of rows) {
      updateData.push({
        range: `${track}!A${item.rowNumber}:B${item.rowNumber}`,
        values: [[item.date, item.day]],
      });
      updateData.push({
        range: `${track}!F${item.rowNumber}`,
        values: [[item.marksTime]],
      });
    }
  }

  const batchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updateData,
    }),
  });

  const batchResult = await batchRes.json();
  if (batchRes.ok) {
    console.log('🎉 Successfully updated Google Sheet directly via API!', batchResult);
  } else {
    console.log('API Direct Update note:', batchResult.error?.message);
  }
}

run();

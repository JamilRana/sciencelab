// lib/results-i18n.ts

export type ResultLanguage = "en" | "bn" | "bilingual";

// Bengali digit conversion
const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBengaliNumber(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "";
  return String(val).replace(/\d/g, (d) => BN_DIGITS[parseInt(d, 10)] || d);
}

export function formatResultNumber(val: number | string | null | undefined, lang: ResultLanguage): string {
  if (val === null || val === undefined || val === "") return "";
  if (lang === "bn") {
    return toBengaliNumber(val);
  }
  return String(val);
}

// Translations dictionary
export const I18N_TERMS = {
  instituteName: {
    en: "Science Lab Coaching Center",
    bn: "বিজ্ঞান ল্যাব কোচিং সেন্টার",
    bilingual: "Science Lab Coaching Center · বিজ্ঞান ল্যাব কোচিং সেন্টার",
  },
  instituteSubtitle: {
    en: "Academic Care & Examination Division",
    bn: "একাডেমিক কেয়ার ও পরীক্ষা বিভাগ",
    bilingual: "Academic Care & Examination Division · একাডেমিক কেয়ার ও পরীক্ষা বিভাগ",
  },
  specialDivisionSubtitle: {
    en: "Special Care Academic Program · SSC & Junior Examination Wing",
    bn: "স্পেশাল কেয়ার একাডেমিক প্রোগ্রাম · এসএসসি ও জুনিয়র পরীক্ষা শাখা",
    bilingual: "Special Care Academic Program · এসএসসি ও জুনিয়র পরীক্ষা শাখা",
  },
  officialTranscript: {
    en: "Official Academic Transcript & Marksheet",
    bn: "অফিসিয়াল একাডেমিক নম্বরপত্র ও ট্রান্সক্রিপ্ট",
    bilingual: "Official Academic Transcript / অফিসিয়াল একাডেমিক নম্বরপত্র",
  },
  meritListTitle: {
    en: "Exam Results & Merit List",
    bn: "পরীক্ষার ফলাফল ও মেধা তালিকা",
    bilingual: "Exam Results & Merit List / পরীক্ষার ফলাফল ও মেধা তালিকা",
  },
  tabulationSheet: {
    en: "Tabulation & Merit List",
    bn: "নম্বরপত্র ও মেধা তালিকা",
    bilingual: "Tabulation & Merit List / নম্বরপত্র ও মেধা তালিকা",
  },
  rank: {
    en: "Rank",
    bn: "মেধাক্রম",
    bilingual: "Rank / মেধাক্রম",
  },
  position: {
    en: "Position",
    bn: "মেধা স্থান",
    bilingual: "Position / স্থান",
  },
  roll: {
    en: "Roll",
    bn: "রোল",
    bilingual: "Roll / রোল",
  },
  studentName: {
    en: "Student Name",
    bn: "শিক্ষার্থীর নাম",
    bilingual: "Student Name / শিক্ষার্থীর নাম",
  },
  candidateName: {
    en: "Candidate Name",
    bn: "পরীক্ষার্থীর নাম",
    bilingual: "Candidate Name / পরীক্ষার্থীর নাম",
  },
  feederSchool: {
    en: "School",
    bn: "বিদ্যালয়",
    bilingual: "School / বিদ্যালয়",
  },
  class: {
    en: "Class",
    bn: "শ্রেণি",
    bilingual: "Class / শ্রেণি",
  },
  batch: {
    en: "Batch",
    bn: "ব্যাচ",
    bilingual: "Batch / ব্যাচ",
  },
  subject: {
    en: "Subject",
    bn: "বিষয়",
    bilingual: "Subject / বিষয়",
  },
  subjects: {
    en: "Subjects",
    bn: "বিষয়সমূহ",
    bilingual: "Subjects / বিষয়সমূহ",
  },
  written: {
    en: "Written",
    bn: "লিখিত",
    bilingual: "Written / লিখিত",
  },
  wriShort: {
    en: "Wri",
    bn: "লিখিত",
    bilingual: "Wri / লিখিত",
  },
  objective: {
    en: "MCQ",
    bn: "নৈর্ব্যক্তিক",
    bilingual: "MCQ / নৈর্ব্যক্তিক",
  },
  objShort: {
    en: "MCQ",
    bn: "নৈর্ব্য.",
    bilingual: "MCQ / নৈর্ব্য.",
  },
  practical: {
    en: "Practical",
    bn: "ব্যবহারিক",
    bilingual: "Practical / ব্যবহারিক",
  },
  pracShort: {
    en: "Prac",
    bn: "ব্যব.",
    bilingual: "Prac / ব্যব.",
  },
  totalMarks: {
    en: "Total Marks",
    bn: "মোট নম্বর",
    bilingual: "Total / মোট নম্বর",
  },
  totalShort: {
    en: "Total",
    bn: "মোট",
    bilingual: "Total / মোট",
  },
  highestMarks: {
    en: "Highest",
    bn: "সর্বোচ্চ",
    bilingual: "Highest / সর্বোচ্চ",
  },
  maxMarks: {
    en: "Full Marks",
    bn: "পূর্ণমান",
    bilingual: "Full Marks / পূর্ণমান",
  },
  percentage: {
    en: "Percentage",
    bn: "শতকরা",
    bilingual: "Percentage / শতকরা",
  },
  gpa: {
    en: "GPA",
    bn: "জিপিএ",
    bilingual: "GPA / জিপিএ",
  },
  grade: {
    en: "Grade",
    bn: "গ্রেড",
    bilingual: "Grade / গ্রেড",
  },
  status: {
    en: "Status",
    bn: "ফলাফল",
    bilingual: "Status / ফলাফল",
  },
  passed: {
    en: "Passed",
    bn: "উত্তীর্ণ",
    bilingual: "Passed / উত্তীর্ণ",
  },
  failed: {
    en: "Failed",
    bn: "অনুত্তীর্ণ",
    bilingual: "Failed / অনুত্তীর্ণ",
  },
  absent: {
    en: "Absent",
    bn: "অনুপস্থিত",
    bilingual: "Absent / অনুপস্থিত",
  },
  topScope: {
    en: "Top",
    bn: "সেরা",
    bilingual: "Top / সেরা",
  },
  allStudents: {
    en: "All Students",
    bn: "সকল শিক্ষার্থী",
    bilingual: "All Students / সকল শিক্ষার্থী",
  },
  generatedOn: {
    en: "Generated on",
    bn: "প্রকাশের তারিখ",
    bilingual: "Generated on / প্রকাশের তারিখ",
  },
  headSignature: {
    en: "Director Signature",
    bn: "পরিচালকের স্বাক্ষর",
    bilingual: "Director Signature / পরিচালকের স্বাক্ষর",
  },
  teacherSignature: {
    en: "Teacher Signature",
    bn: "শিক্ষকের স্বাক্ষর",
    bilingual: "Teacher Signature / শিক্ষকের স্বাক্ষর",
  },
  guardianSignature: {
    en: "Guardian Signature",
    bn: "অভিভাবকের স্বাক্ষর",
    bilingual: "Guardian Signature / অভিভাবকের স্বাক্ষর",
  },
  boardGradingScale: {
    en: "Board Grading Scale",
    bn: "বোর্ড গ্রেডিং পদ্ধতি",
    bilingual: "Board Grading Scale / বোর্ড গ্রেডিং স্কেল",
  },
  letterGrade: {
    en: "Letter Grade",
    bn: "লেটার গ্রেড",
    bilingual: "Letter Grade / লেটার গ্রেড",
  },
  gradePointAverage: {
    en: "Grade Point Average (GPA)",
    bn: "গ্রেড পয়েন্ট গড় (জিপিএ)",
    bilingual: "GPA / গ্রেড পয়েন্ট গড়",
  },
  meritPosition: {
    en: "Merit Position",
    bn: "মেধা স্থান",
    bilingual: "Merit Position / মেধা স্থান",
  },
  fourthSubject: {
    en: "4th Subject",
    bn: "৪র্থ বিষয়",
    bilingual: "4th Subject / ৪র্থ বিষয়",
  },
  fourthSubjectBonus: {
    en: "4th Subject Bonus",
    bn: "৪র্থ বিষয়ের অতিরিক্ত পয়েন্ট",
    bilingual: "4th Subject Bonus / ৪র্থ বিষয় বোনাস",
  },
  preparedBy: {
    en: "Prepared By",
    bn: "প্রস্তুতকারী",
    bilingual: "Prepared By / প্রস্তুতকারী",
  },
  controllerOfExams: {
    en: "Controller of Examinations",
    bn: "পরীক্ষা নিয়ন্ত্রক",
    bilingual: "Controller of Exams / পরীক্ষা নিয়ন্ত্রক",
  },
  directorPrincipal: {
    en: "Director / Principal",
    bn: "পরিচালক / অধ্যক্ষ",
    bilingual: "Director / অধ্যক্ষ",
  },
  printMarksheet: {
    en: "Print Marksheet",
    bn: "নম্বরপত্র প্রিন্ট",
    bilingual: "Print Marksheet / নম্বরপত্র প্রিন্ট",
  },
  programBatch: {
    en: "Program / Batch",
    bn: "প্রোগ্রাম / ব্যাচ",
    bilingual: "Program / ব্যাচ",
  },
  resultPassed: {
    en: "PASSED (Promoted)",
    bn: "উত্তীর্ণ (কৃতকার্য)",
    bilingual: "PASSED / উত্তীর্ণ",
  },
  resultFailed: {
    en: "FAILED (Needs Retake)",
    bn: "অনুত্তীর্ণ (অকৃতকার্য)",
    bilingual: "FAILED / অনুত্তীর্ণ",
  },
  serialNo: {
    en: "Sl",
    bn: "ক্র.",
    bilingual: "Sl / ক্র.",
  },
  marksheet: {
    en: "Marksheet",
    bn: "নম্বরপত্র",
    bilingual: "Marksheet / নম্বরপত্র",
  },
  transcript: {
    en: "Academic Transcript",
    bn: "একাডেমিক ট্রান্সক্রিপ্ট",
    bilingual: "Academic Transcript / ট্রান্সক্রিপ্ট",
  },
  boardStandardNote: {
    en: "Official Board Standard (GPA & Grades)",
    bn: "অফিসিয়াল বোর্ড মানসম্মত (জিপিএ ও গ্রেড)",
    bilingual: "Official Board Standard / বোর্ড মানসম্মত",
  },
  marksOnlyNote: {
    en: "Marks Only Assessment",
    bn: "শুধু নম্বরভিত্তিক মূল্যায়ন",
    bilingual: "Marks Only Assessment / নম্বরভিত্তিক মূল্যায়ন",
  },
  guardianMessages: {
    en: "Guardian Messages",
    bn: "অভিভাবক বার্তা",
    bilingual: "Guardian Messages / অভিভাবক বার্তা",
  },
  signatureSheet: {
    en: "Signature Sheet",
    bn: "স্বাক্ষর তালিকা",
    bilingual: "Signature Sheet / স্বাক্ষর তালিকা",
  },
  rankedTabulation: {
    en: "Ranked Tabulation & Merit List",
    bn: "মেধাক্রম ও নম্বর ফর্দ",
    bilingual: "Ranked Tabulation & Merit List / মেধাক্রম ও নম্বর ফর্দ",
  },
  tieBreakNote: {
    en: "Ties resolved by total marks obtained; optional subject bonus points applied automatically.",
    bn: "সমান নম্বরধারীদের সর্বোচ্চ মোট নম্বরের ভিত্তিতে ক্রম নির্ধারণ করা হয়েছে; ৪র্থ বিষয়ের বোনাস পয়েন্ট অন্তর্ভুক্ত।",
    bilingual: "Ties resolved by total marks; 4th subject bonus applied / সমান নম্বরধারীদের মোট নম্বরের ভিত্তিতে ক্রম নির্ধারণ।",
  },
  filterCandidate: {
    en: "Filter candidate by name or roll...",
    bn: "নাম বা রোল দিয়ে শিক্ষার্থী খুঁজুন...",
    bilingual: "Filter candidate / নাম বা রোল দিয়ে খুঁজুন...",
  },
} as const;

export type TermKey = keyof typeof I18N_TERMS;

export function tTerm(key: TermKey, lang: ResultLanguage): string {
  const item = I18N_TERMS[key];
  if (!item) return key;
  return item[lang] || item.en;
}

// Common Subject Name Localization Mapping
const SUBJECT_TRANSLATIONS: Record<string, { bn: string; bilingual: string }> = {
  "Bangla": { bn: "বাংলা", bilingual: "Bangla / বাংলা" },
  "Bangla 1st": { bn: "বাংলা ১ম পত্র", bilingual: "Bangla 1st / বাংলা ১ম" },
  "Bangla 2nd": { bn: "বাংলা ২য় পত্র", bilingual: "Bangla 2nd / বাংলা ২য়" },
  "English": { bn: "ইংরেজি", bilingual: "English / ইংরেজি" },
  "English 1st": { bn: "ইংরেজি ১ম পত্র", bilingual: "English 1st / ইংরেজি ১ম" },
  "English 2nd": { bn: "ইংরেজি ২য় পত্র", bilingual: "English 2nd / ইংরেজি ২য়" },
  "Mathematics": { bn: "গণিত", bilingual: "Mathematics / গণিত" },
  "Math": { bn: "গণিত", bilingual: "Math / গণিত" },
  "General Math": { bn: "সাধারণ গণিত", bilingual: "General Math / সাধারণ গণিত" },
  "Higher Math": { bn: "উচ্চতর গণিত", bilingual: "Higher Math / উচ্চতর গণিত" },
  "Science": { bn: "বিজ্ঞান", bilingual: "Science / বিজ্ঞান" },
  "General Science": { bn: "সাধারণ বিজ্ঞান", bilingual: "Science / সাধারণ বিজ্ঞান" },
  "Physics": { bn: "পদার্থবিজ্ঞান", bilingual: "Physics / পদার্থবিজ্ঞান" },
  "Chemistry": { bn: "রসায়ন", bilingual: "Chemistry / রসায়ন" },
  "Biology": { bn: "জীববিজ্ঞান", bilingual: "Biology / জীববিজ্ঞান" },
  "BGS": { bn: "বাংলাদেশ ও বিশ্বপরিচয়", bilingual: "BGS / বাংলাদেশ ও বিশ্বপরিচয়" },
  "Bangladesh & Global Studies": { bn: "বাংলাদেশ ও বিশ্বপরিচয়", bilingual: "BGS / বাংলাদেশ ও বিশ্বপরিচয়" },
  "ICT": { bn: "তথ্য ও যোগাযোগ প্রযুক্তি", bilingual: "ICT / তথ্যপ্রযুক্তি" },
  "Religion": { bn: "ধর্ম ও নৈতিক শিক্ষা", bilingual: "Religion / ধর্ম" },
  "Islam": { bn: "ইসলাম ও নৈতিক শিক্ষা", bilingual: "Islam / ইসলাম শিক্ষা" },
  "Hinduism": { bn: "হিন্দুধর্ম ও নৈতিক শিক্ষা", bilingual: "Hinduism / হিন্দুধর্ম" },
};

export function localizeSubjectName(subjectName: string, lang: ResultLanguage): string {
  if (lang === "en" || !subjectName) return subjectName;
  const match = SUBJECT_TRANSLATIONS[subjectName.trim()];
  if (match) {
    return lang === "bn" ? match.bn : match.bilingual;
  }
  return subjectName;
}

// Common Class Name Localization Mapping
const CLASS_TRANSLATIONS: Record<string, { bn: string; bilingual: string }> = {
  "Six": { bn: "ষষ্ঠ", bilingual: "Six / ষষ্ঠ" },
  "Seven": { bn: "সপ্তম", bilingual: "Seven / সপ্তম" },
  "Eight": { bn: "অষ্টম", bilingual: "Eight / অষ্টম" },
  "Nine": { bn: "নবম", bilingual: "Nine / নবম" },
  "Ten": { bn: "দশম", bilingual: "Ten / দশম" },
  "6": { bn: "৬ষ্ঠ", bilingual: "Class 6 / ৬ষ্ঠ" },
  "7": { bn: "৭ম", bilingual: "Class 7 / ৭ম" },
  "8": { bn: "৮ম", bilingual: "Class 8 / ৮ম" },
  "9": { bn: "৯ম", bilingual: "Class 9 / ৯ম" },
  "10": { bn: "১০ম", bilingual: "Class 10 / ১০ম" },
};

export function localizeClassName(className: string, lang: ResultLanguage): string {
  if (lang === "en" || !className) return className;
  const match = CLASS_TRANSLATIONS[className.trim()];
  if (match) {
    return lang === "bn" ? match.bn : match.bilingual;
  }
  return className;
}

// Month localization
const MONTH_TRANSLATIONS: Record<string, { bn: string; bilingual: string }> = {
  "January": { bn: "জানুয়ারি", bilingual: "January / জানুয়ারি" },
  "February": { bn: "ফেব্রুয়ারি", bilingual: "February / ফেব্রুয়ারি" },
  "March": { bn: "মার্চ", bilingual: "March / মার্চ" },
  "April": { bn: "এপ্রিল", bilingual: "April / এপ্রিল" },
  "May": { bn: "মে", bilingual: "May / মে" },
  "June": { bn: "জুন", bilingual: "June / জুন" },
  "July": { bn: "জুলাই", bilingual: "July / জুলাই" },
  "August": { bn: "আগস্ট", bilingual: "August / আগস্ট" },
  "September": { bn: "সেপ্টেম্বর", bilingual: "September / সেপ্টেম্বর" },
  "October": { bn: "অক্টোবর", bilingual: "October / অক্টোবর" },
  "November": { bn: "নভেম্বর", bilingual: "November / নভেম্বর" },
  "December": { bn: "ডিসেম্বর", bilingual: "December / ডিসেম্বর" },
};

export function localizeMonthName(monthName: string, lang: ResultLanguage): string {
  if (lang === "en" || !monthName) return monthName;
  const match = MONTH_TRANSLATIONS[monthName.trim()];
  if (match) {
    return lang === "bn" ? match.bn : match.bilingual;
  }
  return monthName;
}

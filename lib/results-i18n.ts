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
    bn: "Science Lab Coaching Center",
    bilingual: "Science Lab Coaching Center",
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
  portrait: {
    en: "Portrait",
    bn: "লম্বালম্বি",
    bilingual: "Portrait / লম্বালম্বি",
  },
  landscape: {
    en: "Landscape",
    bn: "আড়াআড়ি",
    bilingual: "Landscape / আড়াআড়ি",
  },
  pageOrientation: {
    en: "Page",
    bn: "পৃষ্ঠা",
    bilingual: "Page / পৃষ্ঠা",
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
const BASE_SUBJECT_TRANSLATIONS: Record<string, { bn: string; bilingual: string }> = {
  "bangla": { bn: "বাংলা", bilingual: "Bangla / বাংলা" },
  "bangla 1st": { bn: "বাংলা ১ম পত্র", bilingual: "Bangla 1st / বাংলা ১ম পত্র" },
  "bangla 2nd": { bn: "বাংলা ২য় পত্র", bilingual: "Bangla 2nd / বাংলা ২য় পত্র" },
  "bangla 1st paper": { bn: "বাংলা ১ম পত্র", bilingual: "Bangla 1st / বাংলা ১ম পত্র" },
  "bangla 2nd paper": { bn: "বাংলা ২য় পত্র", bilingual: "Bangla 2nd / বাংলা ২য় পত্র" },
  "english": { bn: "ইংরেজি", bilingual: "English / ইংরেজি" },
  "english 1st": { bn: "ইংরেজি ১ম পত্র", bilingual: "English 1st / ইংরেজি ১ম পত্র" },
  "english 2nd": { bn: "ইংরেজি ২য় পত্র", bilingual: "English 2nd / ইংরেজি ২য় পত্র" },
  "english 1st paper": { bn: "ইংরেজি ১ম পত্র", bilingual: "English 1st / ইংরেজি ১ম পত্র" },
  "english 2nd paper": { bn: "ইংরেজি ২য় পত্র", bilingual: "English 2nd / ইংরেজি ২য় পত্র" },
  "mathematics": { bn: "গণিত", bilingual: "Mathematics / গণিত" },
  "math": { bn: "গণিত", bilingual: "Math / গণিত" },
  "general math": { bn: "সাধারণ গণিত", bilingual: "General Math / সাধারণ গণিত" },
  "general mathematics": { bn: "সাধারণ গণিত", bilingual: "General Math / সাধারণ গণিত" },
  "higher math": { bn: "উচ্চতর গণিত", bilingual: "Higher Math / উচ্চতর গণিত" },
  "higher mathematics": { bn: "উচ্চতর গণিত", bilingual: "Higher Math / উচ্চতর গণিত" },
  "science": { bn: "বিজ্ঞান", bilingual: "Science / বিজ্ঞান" },
  "general science": { bn: "সাধারণ বিজ্ঞান", bilingual: "Science / সাধারণ বিজ্ঞান" },
  "physics": { bn: "পদার্থবিজ্ঞান", bilingual: "Physics / পদার্থবিজ্ঞান" },
  "chemistry": { bn: "রসায়ন", bilingual: "Chemistry / রসায়ন" },
  "biology": { bn: "জীববিজ্ঞান", bilingual: "Biology / জীববিজ্ঞান" },
  "bgs": { bn: "বাংলাদেশ ও বিশ্বপরিচয়", bilingual: "BGS / বাংলাদেশ ও বিশ্বপরিচয়" },
  "bangladesh & global studies": { bn: "বাংলাদেশ ও বিশ্বপরিচয়", bilingual: "BGS / বাংলাদেশ ও বিশ্বপরিচয়" },
  "bangladesh & global studies (bgs)": { bn: "বাংলাদেশ ও বিশ্বপরিচয়", bilingual: "BGS / বাংলাদেশ ও বিশ্বপরিচয়" },
  "bangladesh and global studies": { bn: "বাংলাদেশ ও বিশ্বপরিচয়", bilingual: "BGS / বাংলাদেশ ও বিশ্বপরিচয়" },
  "ict": { bn: "তথ্য ও যোগাযোগ প্রযুক্তি", bilingual: "ICT / তথ্যপ্রযুক্তি" },
  "information & communication technology": { bn: "তথ্য ও যোগাযোগ প্রযুক্তি", bilingual: "ICT / তথ্যপ্রযুক্তি" },
  "information and communication technology": { bn: "তথ্য ও যোগাযোগ প্রযুক্তি", bilingual: "ICT / তথ্যপ্রযুক্তি" },
  "religion": { bn: "ধর্ম ও নৈতিক শিক্ষা", bilingual: "Religion / ধর্ম" },
  "islam": { bn: "ইসলাম ও নৈতিক শিক্ষা", bilingual: "Islam / ইসলাম শিক্ষা" },
  "islam shikkha": { bn: "ইসলাম ও নৈতিক শিক্ষা", bilingual: "Islam / ইসলাম শিক্ষা" },
  "islam & moral education": { bn: "ইসলাম ও নৈতিক শিক্ষা", bilingual: "Islam / ইসলাম শিক্ষা" },
  "islam and moral education": { bn: "ইসলাম ও নৈতিক শিক্ষা", bilingual: "Islam / ইসলাম শিক্ষা" },
  "hinduism": { bn: "হিন্দুধর্ম ও নৈতিক শিক্ষা", bilingual: "Hinduism / হিন্দুধর্ম" },
  "hindu religious studies": { bn: "হিন্দুধর্ম ও নৈতিক শিক্ষা", bilingual: "Hinduism / হিন্দুধর্ম" },
  "hindu religion": { bn: "হিন্দুধর্ম ও নৈতিক শিক্ষা", bilingual: "Hinduism / হিন্দুধর্ম" },
  "accounting": { bn: "হিসাববিজ্ঞান", bilingual: "Accounting / হিসাববিজ্ঞান" },
  "finance": { bn: "ফিন্যান্স ও ব্যাংকিং", bilingual: "Finance / ফিন্যান্স" },
  "finance & banking": { bn: "ফিন্যান্স ও ব্যাংকিং", bilingual: "Finance / ফিন্যান্স" },
  "finance and banking": { bn: "ফিন্যান্স ও ব্যাংকিং", bilingual: "Finance / ফিন্যান্স" },
  "business": { bn: "ব্যবসায় উদ্যোগ", bilingual: "Business / ব্যবসায় উদ্যোগ" },
  "business entrepreneurship": { bn: "ব্যবসায় উদ্যোগ", bilingual: "Business / ব্যবসায় উদ্যোগ" },
  "economics": { bn: "অর্থনীতি", bilingual: "Economics / অর্থনীতি" },
  "geography": { bn: "ভূগোল ও পরিবেশ", bilingual: "Geography / ভূগোল" },
  "geography & environment": { bn: "ভূগোল ও পরিবেশ", bilingual: "Geography / ভূগোল" },
  "geography and environment": { bn: "ভূগোল ও পরিবেশ", bilingual: "Geography / ভূগোল" },
  "history": { bn: "ইতিহাস ও বিশ্বসভ্যতা", bilingual: "History / ইতিহাস" },
  "history of bangladesh": { bn: "বাংলাদেশ ও বিশ্বসভ্যতার ইতিহাস", bilingual: "History / ইতিহাস" },
  "civics": { bn: "পৌরনীতি ও নাগরিকতা", bilingual: "Civics / পৌরনীতি" },
  "civics & citizenship": { bn: "পৌরনীতি ও নাগরিকতা", bilingual: "Civics / পৌরনীতি" },
  "civics and citizenship": { bn: "পৌরনীতি ও নাগরিকতা", bilingual: "Civics / পৌরনীতি" },
  "agriculture": { bn: "কৃষিশিক্ষা", bilingual: "Agriculture / কৃষিশিক্ষা" },
  "agricultural studies": { bn: "কৃষিশিক্ষা", bilingual: "Agriculture / কৃষিশিক্ষা" },
  "home science": { bn: "গার্হস্থ্য বিজ্ঞান", bilingual: "Home Science / গার্হস্থ্য বিজ্ঞান" },
  "physical education": { bn: "শারীরিক শিক্ষা ও স্বাস্থ্য", bilingual: "Physical Education / শারীরিক শিক্ষা" },
  "arts and crafts": { bn: "চারু ও কারুকলা", bilingual: "Arts & Crafts / চারু ও কারুকলা" },
  "art & craft": { bn: "চারু ও কারুকলা", bilingual: "Arts & Crafts / চারু ও কারুকলা" },
  "career education": { bn: "ক্যারিয়ার শিক্ষা", bilingual: "Career Education / ক্যারিয়ার শিক্ষা" },
};

export function localizeSubjectName(subjectName: string, lang: ResultLanguage): string {
  if (lang === "en" || !subjectName) return subjectName;

  const raw = subjectName.trim();
  const lower = raw.toLowerCase();

  // 1. Direct match
  if (BASE_SUBJECT_TRANSLATIONS[lower]) {
    return lang === "bn" ? BASE_SUBJECT_TRANSLATIONS[lower].bn : BASE_SUBJECT_TRANSLATIONS[lower].bilingual;
  }

  // 2. Pattern: "SUBJECT(EXAM-1)", "SUBJECT (EXAM 1)", "SUBJECT(TEST-1)", "SUBJECT(MODEL TEST-1)"
  const examSuffixMatch = raw.match(/^([^(]+?)\s*[\(\[]\s*(?:model\s*test|model|exam|test)?\s*[-–—:]?\s*(\d+)\s*[\)\]]$/i);
  if (examSuffixMatch) {
    const baseRaw = examSuffixMatch[1].trim();
    const examNum = examSuffixMatch[2];
    const baseLower = baseRaw.toLowerCase();
    const baseTrans = BASE_SUBJECT_TRANSLATIONS[baseLower]?.bn || baseRaw;
    const bnNum = toBengaliNumber(examNum);

    if (lang === "bn") {
      return `${baseTrans} (পরীক্ষা-${bnNum})`;
    }
    return `${baseRaw} (Exam-${examNum}) / ${baseTrans} (পরীক্ষা-${bnNum})`;
  }

  // 3. Pattern: "SUBJECT-1", "SUBJECT-2", "SUBJECT - 1"
  const hyphenSuffixMatch = raw.match(/^([^-–—:]+?)\s*[-–—:]\s*(\d+)$/i);
  if (hyphenSuffixMatch) {
    const baseRaw = hyphenSuffixMatch[1].trim();
    const num = hyphenSuffixMatch[2];
    const baseLower = baseRaw.toLowerCase();
    const baseTrans = BASE_SUBJECT_TRANSLATIONS[baseLower]?.bn || baseRaw;
    const bnNum = toBengaliNumber(num);

    if (lang === "bn") {
      return `${baseTrans} (পরীক্ষা-${bnNum})`;
    }
    return `${baseRaw}-${num} / ${baseTrans} (পরীক্ষা-${bnNum})`;
  }

  // 4. Pattern: "SUBJECT 1ST", "SUBJECT 2ND", "SUBJECT 1ST PAPER"
  const paperMatch = raw.match(/^([^(]+?)\s*(?:[\(\[]\s*)?(\d+)(st|nd|rd|th)?\s*(?:paper)?\s*(?:[\)\]])?$/i);
  if (paperMatch) {
    const baseRaw = paperMatch[1].trim();
    const paperNum = paperMatch[2];
    const baseLower = baseRaw.toLowerCase();
    const baseTrans = BASE_SUBJECT_TRANSLATIONS[baseLower]?.bn || baseRaw;
    const paperBn = paperNum === "1" ? "১ম পত্র" : paperNum === "2" ? "২য় পত্র" : `${toBengaliNumber(paperNum)} পত্র`;

    if (lang === "bn") {
      return `${baseTrans} ${paperBn}`;
    }
    return `${baseRaw} ${paperNum} / ${baseTrans} ${paperBn}`;
  }

  // 5. Pattern: "SUBJECT 1", "SUBJECT 2"
  const spaceNumMatch = raw.match(/^([a-zA-Z\s&]+?)\s+(\d+)$/i);
  if (spaceNumMatch) {
    const baseRaw = spaceNumMatch[1].trim();
    const num = spaceNumMatch[2];
    const baseLower = baseRaw.toLowerCase();
    if (BASE_SUBJECT_TRANSLATIONS[baseLower]) {
      const baseTrans = BASE_SUBJECT_TRANSLATIONS[baseLower].bn;
      const bnNum = toBengaliNumber(num);
      if (lang === "bn") {
        return `${baseTrans} (পরীক্ষা-${bnNum})`;
      }
      return `${baseRaw} ${num} / ${baseTrans} (পরীক্ষা-${bnNum})`;
    }
  }

  return raw;
}

// Common Class Name Localization Mapping
const CLASS_TRANSLATIONS: Record<string, { bn: string; bilingual: string }> = {
  "six": { bn: "ষষ্ঠ", bilingual: "Six / ষষ্ঠ" },
  "seven": { bn: "সপ্তম", bilingual: "Seven / সপ্তম" },
  "eight": { bn: "অষ্টম", bilingual: "Eight / অষ্টম" },
  "nine": { bn: "নবম", bilingual: "Nine / নবম" },
  "ten": { bn: "দশম", bilingual: "Ten / দশম" },
  "class six": { bn: "ষষ্ঠ শ্রেণি", bilingual: "Class Six / ষষ্ঠ শ্রেণি" },
  "class seven": { bn: "সপ্তম শ্রেণি", bilingual: "Class Seven / সপ্তম শ্রেণি" },
  "class eight": { bn: "অষ্টম শ্রেণি", bilingual: "Class Eight / অষ্টম শ্রেণি" },
  "class nine": { bn: "নবম শ্রেণি", bilingual: "Class Nine / নবম শ্রেণি" },
  "class ten": { bn: "দশম শ্রেণি", bilingual: "Class Ten / দশম শ্রেণি" },
  "class 6": { bn: "৬ষ্ঠ শ্রেণি", bilingual: "Class 6 / ৬ষ্ঠ শ্রেণি" },
  "class 7": { bn: "৭ম শ্রেণি", bilingual: "Class 7 / ৭ম শ্রেণি" },
  "class 8": { bn: "৮ম শ্রেণি", bilingual: "Class 8 / ৮ম শ্রেণি" },
  "class 9": { bn: "৯ম শ্রেণি", bilingual: "Class 9 / ৯ম শ্রেণি" },
  "class 10": { bn: "১০ম শ্রেণি", bilingual: "Class 10 / ১০ম শ্রেণি" },
  "6": { bn: "৬ষ্ঠ", bilingual: "Class 6 / ৬ষ্ঠ" },
  "7": { bn: "৭ম", bilingual: "Class 7 / ৭ম" },
  "8": { bn: "৮ম", bilingual: "Class 8 / ৮ম" },
  "9": { bn: "৯ম", bilingual: "Class 9 / ৯ম" },
  "10": { bn: "১০ম", bilingual: "Class 10 / ১০ম" },
  "ssc": { bn: "এসএসসি", bilingual: "SSC / এসএসসি" },
  "hsc": { bn: "এইচএসসি", bilingual: "HSC / এইচএসসি" },
  "junior": { bn: "জুনিয়র", bilingual: "Junior / জুনিয়র" },
};

export function localizeClassName(className: string, lang: ResultLanguage): string {
  if (lang === "en" || !className) return className;
  const lower = className.trim().toLowerCase();
  const match = CLASS_TRANSLATIONS[lower];
  if (match) {
    return lang === "bn" ? match.bn : match.bilingual;
  }
  return className;
}

// Month localization
const MONTH_TRANSLATIONS: Record<string, { bn: string; bilingual: string }> = {
  "january": { bn: "জানুয়ারি", bilingual: "January / জানুয়ারি" },
  "jan": { bn: "জানুয়ারি", bilingual: "Jan / জানুয়ারি" },
  "february": { bn: "ফেব্রুয়ারি", bilingual: "February / ফেব্রুয়ারি" },
  "feb": { bn: "ফেব্রুয়ারি", bilingual: "Feb / ফেব্রুয়ারি" },
  "march": { bn: "মার্চ", bilingual: "March / মার্চ" },
  "mar": { bn: "মার্চ", bilingual: "Mar / মার্চ" },
  "april": { bn: "এপ্রিল", bilingual: "April / এপ্রিল" },
  "apr": { bn: "এপ্রিল", bilingual: "Apr / এপ্রিল" },
  "may": { bn: "মে", bilingual: "May / মে" },
  "june": { bn: "জুন", bilingual: "June / জুন" },
  "jun": { bn: "জুন", bilingual: "Jun / জুন" },
  "july": { bn: "জুলাই", bilingual: "July / জুলাই" },
  "jul": { bn: "জুলাই", bilingual: "Jul / জুলাই" },
  "august": { bn: "আগস্ট", bilingual: "August / আগস্ট" },
  "aug": { bn: "আগস্ট", bilingual: "Aug / আগস্ট" },
  "september": { bn: "সেপ্টেম্বর", bilingual: "September / সেপ্টেম্বর" },
  "sep": { bn: "সেপ্টেম্বর", bilingual: "Sep / সেপ্টেম্বর" },
  "sept": { bn: "সেপ্টেম্বর", bilingual: "Sept / সেপ্টেম্বর" },
  "october": { bn: "অক্টোবর", bilingual: "October / অক্টোবর" },
  "oct": { bn: "অক্টোবর", bilingual: "Oct / অক্টোবর" },
  "november": { bn: "নভেম্বর", bilingual: "November / নভেম্বর" },
  "nov": { bn: "নভেম্বর", bilingual: "Nov / নভেম্বর" },
  "december": { bn: "ডিসেম্বর", bilingual: "December / ডিসেম্বর" },
  "dec": { bn: "ডিসেম্বর", bilingual: "Dec / ডিসেম্বর" },
};

export function localizeMonthName(monthName: string, lang: ResultLanguage): string {
  if (lang === "en" || !monthName) return monthName;
  const lower = monthName.trim().toLowerCase();
  const match = MONTH_TRANSLATIONS[lower];
  if (match) {
    return lang === "bn" ? match.bn : match.bilingual;
  }
  return monthName;
}

// Exam Type localization
const EXAM_TYPE_TRANSLATIONS: Record<string, { bn: string; bilingual: string }> = {
  "model test": { bn: "মডেল টেস্ট পরীক্ষা", bilingual: "Model Test / মডেল টেস্ট পরীক্ষা" },
  "monthly": { bn: "মাসিক পরীক্ষা", bilingual: "Monthly Exam / মাসিক পরীক্ষা" },
  "monthly test": { bn: "মাসিক পরীক্ষা", bilingual: "Monthly Test / মাসিক পরীক্ষা" },
  "weekly": { bn: "সাপ্তাহিক পরীক্ষা", bilingual: "Weekly Test / সাপ্তাহিক পরীক্ষা" },
  "weekly test": { bn: "সাপ্তাহিক পরীক্ষা", bilingual: "Weekly Test / সাপ্তাহিক পরীক্ষা" },
  "annual": { bn: "বার্ষিক পরীক্ষা", bilingual: "Annual Exam / বার্ষিক পরীক্ষা" },
  "annual exam": { bn: "বার্ষিক পরীক্ষা", bilingual: "Annual Exam / বার্ষিক পরীক্ষা" },
  "term": { bn: "সাময়িক পরীক্ষা", bilingual: "Term Exam / সাময়িক পরীক্ষা" },
  "term exam": { bn: "সাময়িক পরীক্ষা", bilingual: "Term Exam / সাময়িক পরীক্ষা" },
  "half yearly": { bn: "অর্ধবার্ষিক পরীক্ষা", bilingual: "Half Yearly / অর্ধবার্ষিক পরীক্ষা" },
  "pre-test": { bn: "প্রাক-নির্বাচনী পরীক্ষা", bilingual: "Pre-Test / প্রাক-নির্বাচনী" },
  "test": { bn: "নির্বাচনী পরীক্ষা", bilingual: "Test Exam / নির্বাচনী পরীক্ষা" },
  "special": { bn: "বিশেষ মূল্যায়ন পরীক্ষা", bilingual: "Special Exam / বিশেষ পরীক্ষা" },
  "admission": { bn: "ভর্তি পরীক্ষা", bilingual: "Admission Test / ভর্তি পরীক্ষা" },
};

export function localizeExamType(examType: string, lang: ResultLanguage): string {
  if (lang === "en" || !examType) return examType ? `${examType} Examination` : "Examination";
  const normalized = examType.trim().toLowerCase();
  const match = EXAM_TYPE_TRANSLATIONS[normalized];
  if (match) {
    return lang === "bn" ? match.bn : match.bilingual;
  }
  return lang === "bn" ? `${examType} পরীক্ষা` : `${examType} Examination / পরীক্ষা`;
}

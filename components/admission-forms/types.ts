export type FormType = "special" | "regular";

export type FillMode = "blank" | "filled";

export type ColorTheme = "emerald" | "blue" | "monochrome";

export interface AdmissionFormData {
  // Common / Personal
  studentNameBangla: string;
  studentNameEnglish: string;
  fatherName: string;
  motherName: string;
  schoolName: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  guardianMobile: string;
  studentMobile: string;

  // Academic / Coaching
  targetClass: string;          // e.g. "৮ম শ্রেণি" or "Eight"
  schoolRoll: string;           // previous or current school roll
  previousGpa: string;          // e.g. "5.00"
  batchName: string;            // e.g. "JSC-2026", "8A", "SSC-2027"
  rollNo: string;               // e.g. "৮১০১" or "8101"
  registrationNo: string;       // e.g. "SL-2026-8045"
  photoUrl: string;             // photo image source or empty

  // Exam / Batch Config
  examTitle: string;            // e.g. "জুনিয়র বৃত্তি পরীক্ষা ২০২৬"
  formTitle: string;            // e.g. "ভর্তি ফরম"
  subtitle: string;             // e.g. "সায়েন্স ল্যাব কোচিং সেন্টার"
  campusAddress: string;        // e.g. "প্রধান শাখা, শেরপুর"
  hotline: string;              // e.g. "০১৭১২-XXXXXX"
  examDate: string;             // e.g. "২৫ ডিসেম্বর ২০২৬ (শুক্রবার)"
  examTime: string;             // e.g. "সকাল ১০:০০ টা - ১১:৩০ টা"
  examVenue: string;            // e.g. "সায়েন্স ল্যাব প্রধান ভবন"
  admitInstructions: string[];  // bullet instructions on admit card
}

export interface ProgramOption {
  id: number;
  code: string;
  name: string;
  category: string;
  year: number;
}

export interface BatchOption {
  id: number;
  name: string;
  classId: string;
  code: number;
}

export interface SchoolOption {
  id: number;
  name: string;
}

export const DEFAULT_SPECIAL_FORM: AdmissionFormData = {
  studentNameBangla: "আব্দুল্লাহ আল নোমান",
  studentNameEnglish: "Abdullah Al Noman",
  fatherName: "মোঃ রফিকুল ইসলাম",
  motherName: "মোসাঃ পারভীন আক্তার",
  schoolName: "শেরপুর সরকারি ভিক্টোরিয়া একাডেমি",
  address: "বাসা নং ১২, কলেজ রোড, শেরপুর সদর, শেরপুর",
  dateOfBirth: "১২/০৫/২০১২",
  gender: "ছাত্র",
  bloodGroup: "B+",
  guardianMobile: "01712345678",
  studentMobile: "01987654321",
  targetClass: "৮ম শ্রেণি",
  schoolRoll: "০৫",
  previousGpa: "৫.০০",
  batchName: "JSC-2026",
  rollNo: "৮১০১",
  registrationNo: "SL-JSC-2026-015",
  photoUrl: "",
  examTitle: "জুনিয়র বৃত্তি পরীক্ষা ২০২৬",
  formTitle: "ভর্তি ফরম (স্পেশাল ব্যাচ)",
  subtitle: "সায়েন্স ল্যাব কোচিং সেন্টার",
  campusAddress: "শেরপুর ক্যাম্পাস | মানসম্মত শিক্ষার বিশ্বস্ত প্রতিষ্ঠান",
  hotline: "০১৭১২-৩৪৫৬৭৮, ০১৯১১-৯৮৭৬৫৪",
  examDate: "২৫ ডিসেম্বর ২০২৬ (শুক্রবার)",
  examTime: "সকাল ১০:০০ টা - ১১:৩০ টা",
  examVenue: "সায়েন্স ল্যাব প্রধান ভবন (২য় তলা)",
  admitInstructions: [
    "পরীক্ষা শুরুর অন্তত ১৫ মিনিট পূর্বে পরীক্ষার হলে উপস্থিত হতে হবে।",
    "প্রবেশপত্র ছাড়া কোনো পরীক্ষার্থীকে পরীক্ষা কক্ষে প্রবেশ করতে দেওয়া হবে না।",
    "ক্যালকুলেটর বা কোনো ধরনের ইলেকট্রনিক ডিভাইস আনা সম্পূর্ণ নিষেধ।",
  ],
};

export const DEFAULT_REGULAR_FORM: AdmissionFormData = {
  studentNameBangla: "ফাহমিদা তাসনিম",
  studentNameEnglish: "Fahmida Tasnim",
  fatherName: "মোঃ জহিরুল হক",
  motherName: "নাজমা বেগম",
  schoolName: "শেরপুর সরকারি বালিকা উচ্চ বিদ্যালয়",
  address: "নয়ানী বাজার, শেরপুর টাউন, শেরপুর",
  dateOfBirth: "১৫/০৮/২০১১",
  gender: "ছাত্রী",
  bloodGroup: "O+",
  guardianMobile: "01819223344",
  studentMobile: "01755667788",
  targetClass: "৯ম শ্রেণি",
  schoolRoll: "১২",
  previousGpa: "৪.৯২",
  batchName: "9A (Science)",
  rollNo: "৯১০৫",
  registrationNo: "SL-REG-2026-905",
  photoUrl: "",
  examTitle: "ভর্তি ফরম ও প্রবেশপত্র - ২০২৬",
  formTitle: "নিয়মিত শ্রেণি ভর্তি ফরম (৬ষ্ঠ - ১০ম)",
  subtitle: "সায়েন্স ল্যাব কোচিং সেন্টার",
  campusAddress: "শেরপুর ক্যাম্পাস | মানসম্মত শিক্ষার বিশ্বস্ত প্রতিষ্ঠান",
  hotline: "০১৭১২-৩৪৫৬৭৮, ০১৯১১-৯৮৭৬৫৪",
  examDate: "নির্ধারিত তারিখ অনুযায়ী",
  examTime: "সকাল ০৯:০০ টা - ১০:৩০ টা",
  examVenue: "সায়েন্স ল্যাব ৩য় তলা, কক্ষ নং ২০৩",
  admitInstructions: [
    "ভর্তির সময় অবশ্যই পূর্ববর্তী ক্লাসের মার্কশীটের ফটোকপি জমা দিতে হবে।",
    "ক্লাসে নিয়মিত উপস্থিতি ও প্রতিষ্ঠানের শৃঙ্খলা কঠোরভাবে পালন করতে হবে।",
    "প্রতি মাসের ১০ তারিখের মধ্যে মাসিক বেতন পরিশোধ করতে হবে।",
  ],
};

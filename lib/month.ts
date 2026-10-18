const MONTH_MAP: Record<string, string> = {
  january: "Jan", jan: "Jan",
  february: "Feb", feb: "Feb",
  march: "Mar", mar: "Mar",
  april: "Apr", apr: "Apr",
  may: "May",
  june: "Jun", jun: "Jun",
  july: "Jul", jul: "Jul",
  august: "Aug", aug: "Aug",
  september: "Sep", sep: "Sep",
  october: "Oct", oct: "Oct",
  november: "Nov", nov: "Nov",
  december: "Dec", dec: "Dec",
};

export function normalizeMonth(m: string): string {
  if (!m) return "";
  return MONTH_MAP[m.toLowerCase().trim()] || m;
}

export const STANDARD_MONTHS = [
  { value: "Jan", label: "January (Jan)", index: 0 },
  { value: "Feb", label: "February (Feb)", index: 1 },
  { value: "Mar", label: "March (Mar)", index: 2 },
  { value: "Apr", label: "April (Apr)", index: 3 },
  { value: "May", label: "May (May)", index: 4 },
  { value: "Jun", label: "June (Jun)", index: 5 },
  { value: "Jul", label: "July (Jul)", index: 6 },
  { value: "Aug", label: "August (Aug)", index: 7 },
  { value: "Sep", label: "September (Sep)", index: 8 },
  { value: "Oct", label: "October (Oct)", index: 9 },
  { value: "Nov", label: "November (Nov)", index: 10 },
  { value: "Dec", label: "December (Dec)", index: 11 },
];

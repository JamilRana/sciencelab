export const CLASSES = ["6", "7", "8", "9", "10", "11", "12"];

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
] as const;

export type Month = typeof MONTHS[number];

export interface BatchData {
  id: number;
  name: string;
  classId: string;
  code: number;
}

export interface ReceiptData {
  id: number;
  month: string;
  amount: number;
  date: Date;
}

export interface StudentFeeData {
  id: number;
  name: string;
  class: string;
  roll: number;
  batch: { code: number };
  batchName: string;
  due: number;
  paid: number;
  receipts: ReceiptData[];
}

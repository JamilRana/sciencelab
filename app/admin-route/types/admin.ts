export type ClassName = 'Six' | 'Seven' | 'Eight' | 'Nine' | 'Ten';

export const CLASSES: ClassName[] = ['Six', 'Seven', 'Eight', 'Nine', 'Ten'];

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
] as const;

export type Month = typeof MONTHS[number];

export interface BatchData {
  id: number;
  name: string;
  code: number;
}

export interface StudentFeeData {
  id: number;
  name: string;
  roll: number;
  class: string;
  batch: BatchData;
  receipts: { month: string; amount: number }[];
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

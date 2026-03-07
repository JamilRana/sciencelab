export function generateDisplayRoll(batchCode: number, roll: number): number {
  return batchCode * 100 + roll;
}

export function generateDisplayRollString(batchCode: number, roll: number): string {
  return `${batchCode}${roll.toString().padStart(2, "0")}`;
}

export function parseDisplayRoll(displayRoll: number, batchCode: number): number {
  return displayRoll - (batchCode * 100);
}

export function getBatchCodeFromClassId(classId: string): number {
  const classCodeMap: Record<string, number> = {
    "Six": 61,
    "Seven": 71,
    "Eight": 81,
    "Nine": 91,
    "Ten": 101,
  };
  return classCodeMap[classId] || parseInt(classId) || 0;
}

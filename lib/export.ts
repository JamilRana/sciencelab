// lib/export.ts
export function exportToCSV(data: any[], filename: string, headers?: { key: string; label: string }[]) {
  if (data.length === 0) return;

  const headersToUse = headers || Object.keys(data[0]).map(key => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
  }));

  const csvContent = [
    headersToUse.map(h => h.label).join(','),
    ...data.map(row => 
      headersToUse.map(h => {
        let value = row[h.key];
        if (value === null || value === undefined) value = '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
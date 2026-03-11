// components/profile/ProfileField.tsx
interface ProfileFieldProps {
  label: string;
  value?: string | number | null;
  capitalize?: boolean;
}

export function ProfileField({ label, value, capitalize }: ProfileFieldProps) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2 border-b">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}
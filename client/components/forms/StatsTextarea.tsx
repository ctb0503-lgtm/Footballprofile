interface StatsTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}

export const StatsTextarea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
}: StatsTextareaProps) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs font-mono"
    />
  </div>
);

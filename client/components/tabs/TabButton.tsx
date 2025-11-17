interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton = ({ label, isActive, onClick }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={`py-2 px-4 font-medium text-sm transition-colors ${
      isActive
        ? 'text-green-400 border-b-2 border-green-400'
        : 'text-gray-400 hover:text-gray-200'
    }`}
  >
    {label}
  </button>
);

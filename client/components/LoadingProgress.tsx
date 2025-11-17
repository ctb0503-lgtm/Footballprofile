interface LoadingProgressProps {
  stage: "analyzing" | "searching" | "generating";
}

export const LoadingProgress = ({ stage }: LoadingProgressProps) => {
  const stages = {
    analyzing: { text: "Analyzing your data...", progress: 33 },
    searching: { text: "Searching web sources...", progress: 66 },
    generating: { text: "Generating profile...", progress: 90 },
  };

  const current = stages[stage];

  return (
    <div className="space-y-2 p-6 bg-gray-800 rounded-md">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{current.text}</span>
        <span className="text-gray-400">{current.progress}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${current.progress}%` }}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>This may take 30-60 seconds...</span>
      </div>
    </div>
  );
};

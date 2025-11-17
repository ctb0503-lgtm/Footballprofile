import { useState } from "react";
import { Eye, EyeOff, ExternalLink } from "lucide-react";

interface ApiKeyInputProps {
  value: string;
  onChange: (key: string) => void;
}

export const ApiKeyInput = ({ value, onChange }: ApiKeyInputProps) => {
  const [show, setShow] = useState(false);

  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Gemini API Key *
      </label>
      <div className="flex gap-2">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your Gemini API key (e.g., AIza...)"
          className="flex-1 p-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="px-3 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 transition-colors"
          aria-label={show ? "Hide API key" : "Show API key"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
        Get your free API key at{" "}
        <a // <-- This opening tag was fixed
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
        >
          Google AI Studio
          <ExternalLink className="h-3 w-3" />
        </a>
      </p>
      {!value && (
        <p className="text-xs text-yellow-400 mt-1">
          ⚠️ API key is required to generate profiles
        </p>
      )}
    </div>
  );
};

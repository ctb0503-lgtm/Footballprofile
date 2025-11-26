import { ReactNode } from "react";
import { LoadingIcon, ErrorIcon } from "@/components/icons";

interface TabContentProps {
  isLoading: boolean;
  error: string | null;
  data?: any;
  children?: ReactNode;
}

export const TabContent = ({
  isLoading,
  error,
  data,
  children,
}: TabContentProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <LoadingIcon />
        <span className="ml-2 text-gray-300">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-900 border border-red-700 rounded-md">
        <div className="flex items-center">
          <ErrorIcon />
          <span className="ml-2 text-red-200 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (data || children) {
    return <>{children}</>;
  }

  return null;
};

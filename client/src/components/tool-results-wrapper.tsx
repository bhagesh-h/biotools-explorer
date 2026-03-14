import { useEffect } from "react";
import { useToolSearch } from "@/hooks/use-tool-search";
import { ToolResults } from "@/components/tool-results";
import type { ToolData } from "@shared/schema";

interface ToolResultsWrapperProps {
  toolName: string;
  limit: number;
  onRemove: () => void;
  onLoaded: (data: ToolData) => void;
  onLoadingChange: (loading: boolean) => void;
}

export function ToolResultsWrapper({ toolName, limit, onRemove, onLoaded, onLoadingChange }: ToolResultsWrapperProps) {
  const { data, isLoading, error } = useToolSearch(toolName, limit);

  useEffect(() => {
    if (data) {
      onLoaded(data);
    }
  }, [data, onLoaded]);

  useEffect(() => {
    onLoadingChange(isLoading);
  }, [isLoading, onLoadingChange]);

  return (
    <ToolResults
      toolName={toolName}
      data={data || null}
      isLoading={isLoading}
      error={error}
      onRemove={onRemove}
    />
  );
}

import { useState, useCallback, useMemo } from "react";
import { SearchHeader } from "@/components/search-header";
import { ToolResultsWrapper } from "@/components/tool-results-wrapper";
import { ComparisonView } from "@/components/comparison-view";
import { EmptyState } from "@/components/empty-state";
import type { ToolData } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, GitCompare } from "lucide-react";

export default function Dashboard() {
  const [searchedTools, setSearchedTools] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("explore");
  const [loadedToolsMap, setLoadedToolsMap] = useState<Record<string, ToolData>>({});
  const [loadingTools, setLoadingTools] = useState<Set<string>>(new Set());

  const addTool = useCallback((name: string) => {
    const trimmed = name.trim().toLowerCase();
    if (trimmed && !searchedTools.includes(trimmed)) {
      setSearchedTools((prev) => [...prev, trimmed]);
    }
  }, [searchedTools]);

  const removeTool = useCallback((name: string) => {
    setSearchedTools((prev) => prev.filter((t) => t !== name));
    setLoadedToolsMap((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const onToolLoaded = useCallback((name: string, data: ToolData) => {
    setLoadedToolsMap((prev) => ({ ...prev, [name]: data }));
  }, []);

  const onToolLoadingChange = useCallback((name: string, loading: boolean) => {
    setLoadingTools((prev) => {
      const next = new Set(prev);
      if (loading) next.add(name);
      else next.delete(name);
      return next;
    });
  }, []);

  const loadedTools = useMemo(() => {
    return searchedTools
      .filter((name) => loadedToolsMap[name])
      .map((name) => ({ name, data: loadedToolsMap[name] }));
  }, [searchedTools, loadedToolsMap]);

  const isLoading = loadingTools.size > 0;

  return (
    <div className="min-h-screen bg-background">
      <SearchHeader
        searchedTools={searchedTools}
        onAddTool={addTool}
        onRemoveTool={removeTool}
        isLoading={isLoading}
      />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-12">
        {searchedTools.length === 0 ? (
          <EmptyState onAddTool={addTool} />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="bg-muted/50 border border-border">
              <TabsTrigger value="explore" className="gap-1.5 data-[state=active]:bg-background" data-testid="tab-explore">
                <LayoutGrid className="h-3.5 w-3.5" />
                Explore
              </TabsTrigger>
              {loadedTools.length >= 2 && (
                <TabsTrigger value="compare" className="gap-1.5 data-[state=active]:bg-background" data-testid="tab-compare">
                  <GitCompare className="h-3.5 w-3.5" />
                  Compare
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="explore" className="mt-4 space-y-6">
              {searchedTools.map((toolName) => (
                <ToolResultsWrapper
                  key={toolName}
                  toolName={toolName}
                  onRemove={() => removeTool(toolName)}
                  onLoaded={(data) => onToolLoaded(toolName, data)}
                  onLoadingChange={(loading) => onToolLoadingChange(toolName, loading)}
                />
              ))}
            </TabsContent>

            {loadedTools.length >= 2 && (
              <TabsContent value="compare" className="mt-4">
                <ComparisonView tools={loadedTools} />
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>
    </div>
  );
}

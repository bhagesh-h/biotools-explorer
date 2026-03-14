import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Sun, Moon, Dna, Loader2, Hash } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface SearchHeaderProps {
  searchedTools: string[];
  onAddTool: (name: string) => void;
  onRemoveTool: (name: string) => void;
  isLoading: boolean;
  resultLimit: number;
  onResultLimitChange: (limit: number) => void;
}

export function SearchHeader({
  searchedTools,
  onAddTool,
  onRemoveTool,
  isLoading,
  resultLimit,
  onResultLimitChange,
}: SearchHeaderProps) {
  const [input, setInput] = useState("");
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onAddTool(input);
      setInput("");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">
        {/* Mobile: two rows.  Desktop: single row, search centered */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Top row on mobile: logo + limit + theme toggle */}
          <div className="flex items-center justify-between sm:justify-start sm:w-auto shrink-0 gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Dna className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm tracking-tight">
                BioTools
              </span>
            </div>

            {/* Results limit selector — always visible next to logo */}
            <div className="flex items-center gap-1.5">
              <Hash className="h-3 w-3 text-muted-foreground hidden sm:block" />
              <Select
                value={String(resultLimit)}
                onValueChange={(v) => onResultLimitChange(parseInt(v))}
              >
                <SelectTrigger
                  className="h-7 w-[80px] text-xs border-border/60"
                  data-testid="select-result-limit"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5" className="text-xs">5 hits</SelectItem>
                  <SelectItem value="10" className="text-xs">10 hits</SelectItem>
                  <SelectItem value="15" className="text-xs">15 hits</SelectItem>
                  <SelectItem value="25" className="text-xs">25 hits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme toggle — mobile only */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 shrink-0 sm:hidden"
              data-testid="button-theme-toggle-mobile"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          {/* Search — full width on mobile, centered on desktop */}
          <form onSubmit={handleSubmit} className="flex gap-2 flex-1 sm:max-w-xl sm:mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tools (e.g. STAR, HISAT2, Seurat)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="pl-8 h-9 text-sm bg-muted/40 border-border focus-visible:ring-primary/30"
                data-testid="input-search"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-9 px-3"
              disabled={!input.trim() || isLoading}
              data-testid="button-search"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
            </Button>
          </form>

          {/* Theme toggle — desktop only */}
          <div className="hidden sm:flex shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 shrink-0"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Active tool badges */}
        {searchedTools.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {searchedTools.map((tool) => (
              <Badge
                key={tool}
                variant="secondary"
                className="gap-1 pl-2 pr-1 py-0.5 text-xs cursor-default"
              >
                {tool}
                <button
                  onClick={() => onRemoveTool(tool)}
                  className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                  data-testid={`button-remove-${tool}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

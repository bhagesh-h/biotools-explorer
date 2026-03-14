import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Sun, Moon, Dna, Loader2 } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface SearchHeaderProps {
  searchedTools: string[];
  onAddTool: (name: string) => void;
  onRemoveTool: (name: string) => void;
  isLoading: boolean;
}

export function SearchHeader({ searchedTools, onAddTool, onRemoveTool, isLoading }: SearchHeaderProps) {
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
        <div className="flex items-center gap-3">
          {/* Logo — fixed width so the search bar centers properly */}
          <div className="flex items-center gap-2 shrink-0 w-24">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Dna className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm hidden sm:block tracking-tight">
              BioTools
            </span>
          </div>

          {/* Search — centered with flex-1 + mx-auto */}
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2 max-w-xl mx-auto">
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

          {/* Theme toggle — fixed width to balance the logo side */}
          <div className="w-24 flex justify-end">
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

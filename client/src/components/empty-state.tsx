import { Button } from "@/components/ui/button";
import { Dna, Search, GitBranch, Box, BookOpen } from "lucide-react";

interface EmptyStateProps {
  onAddTool: (name: string) => void;
}

const suggestions = [
  { name: "STAR", desc: "RNA-seq aligner" },
  { name: "HISAT2", desc: "Graph-based aligner" },
  { name: "Seurat", desc: "Single-cell toolkit" },
  { name: "Samtools", desc: "SAM/BAM utility" },
  { name: "BWA", desc: "Burrows-Wheeler aligner" },
  { name: "DESeq2", desc: "Differential expression" },
];

export function EmptyState({ onAddTool }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Dna className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-semibold mb-2 text-center">
        Bioinformatics Tool Explorer
      </h1>
      <p className="text-sm text-muted-foreground max-w-md text-center mb-8">
        Search for any bioinformatics tool to discover its GitHub repository, Docker images, version history, and associated publications.
      </p>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 max-w-lg w-full">
        {[
          { icon: GitBranch, label: "Repository Metadata", desc: "Stars, issues, versions" },
          { icon: Box, label: "Docker Images", desc: "Container availability" },
          { icon: BookOpen, label: "Publications", desc: "Literature references" },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex flex-col items-center text-center p-3 rounded-lg bg-card border border-border">
            <Icon className="h-5 w-5 text-primary mb-2" />
            <span className="text-xs font-medium">{label}</span>
            <span className="text-xs text-muted-foreground">{desc}</span>
          </div>
        ))}
      </div>

      {/* Quick suggestions */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-3">Try searching for:</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestions.map((s) => (
            <Button
              key={s.name}
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => onAddTool(s.name)}
              data-testid={`button-suggest-${s.name.toLowerCase()}`}
            >
              <Search className="h-3 w-3" />
              {s.name}
              <span className="text-muted-foreground">{s.desc}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

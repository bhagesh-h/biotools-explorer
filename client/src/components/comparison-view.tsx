import type { ToolData } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star, GitFork, Bug, Tag, Clock, Box, BookOpen,
  ExternalLink, ArrowUpDown, Check, X as XIcon,
  Calendar, Settings2
} from "lucide-react";
import { useState, useMemo } from "react";
import { formatDistanceToNow, format } from "date-fns";

interface ComparisonProps {
  tools: { name: string; data: ToolData }[];
}

type SortKey = "stars" | "updated" | "issues" | "publications" | "docker";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try { return format(new Date(dateStr), "MMM d, yyyy"); } catch { return "N/A"; }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); } catch { return ""; }
}

export function ComparisonView({ tools }: ComparisonProps) {
  const [sortBy, setSortBy] = useState<SortKey>("stars");
  const [filterDocker, setFilterDocker] = useState(false);
  const [filterPubs, setFilterPubs] = useState(false);
  // Per-tool selected repo index: { "bwa": 0, "samtools": 1, ... }
  const [selectedRepoIdx, setSelectedRepoIdx] = useState<Record<string, number>>({});

  // Build comparison rows using the selected repo for each tool
  const rows = useMemo(() => {
    return tools.map((t) => {
      const repoIdx = selectedRepoIdx[t.name] ?? 0;
      const selectedRepo = t.data.github[repoIdx] || t.data.github[0] || null;
      const hasDocker = t.data.docker.length > 0;
      const pubCount = t.data.publications.length;
      return {
        name: t.name,
        data: t.data,
        selectedRepo,
        hasDocker,
        pubCount,
        stars: selectedRepo?.stars ?? 0,
        pushedAt: selectedRepo?.pushedAt ?? "",
        openIssues: selectedRepo?.openIssues ?? 0,
        closedIssues: selectedRepo?.closedIssues ?? 0,
      };
    });
  }, [tools, selectedRepoIdx]);

  // Filter
  const filtered = rows.filter((r) => {
    if (filterDocker && !r.hasDocker) return false;
    if (filterPubs && r.pubCount === 0) return false;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "stars": return b.stars - a.stars;
      case "updated": return new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime();
      case "issues": return b.openIssues - a.openIssues;
      case "publications": return b.pubCount - a.pubCount;
      case "docker": return (b.hasDocker ? 1 : 0) - (a.hasDocker ? 1 : 0);
      default: return 0;
    }
  });

  // Find "best" in each category
  const maxStars = Math.max(...rows.map((r) => r.stars));
  const mostRecent = rows.length > 0
    ? rows.reduce((a, b) =>
        new Date(a.pushedAt).getTime() > new Date(b.pushedAt).getTime() ? a : b
      ).name
    : "";
  const mostPubs = Math.max(...rows.map((r) => r.pubCount));

  return (
    <div className="space-y-4" data-testid="comparison-view">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="h-8 w-[160px] text-xs" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stars">Most stars</SelectItem>
              <SelectItem value="updated">Recently updated</SelectItem>
              <SelectItem value="issues">Most open issues</SelectItem>
              <SelectItem value="publications">Most publications</SelectItem>
              <SelectItem value="docker">Docker available</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant={filterDocker ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setFilterDocker((v) => !v)}
          data-testid="filter-docker"
        >
          <Box className="h-3 w-3" />
          Has Docker
          {filterDocker && <Check className="h-3 w-3" />}
        </Button>

        <Button
          variant={filterPubs ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setFilterPubs((v) => !v)}
          data-testid="filter-publications"
        >
          <BookOpen className="h-3 w-3" />
          Has Publications
          {filterPubs && <Check className="h-3 w-3" />}
        </Button>
      </div>

      {/* Repo selector per tool — show when any tool has >1 repo */}
      {tools.some((t) => t.data.github.length > 1) && (
        <Card className="border-border bg-muted/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Select repository to compare for each tool</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {tools.map((t) => (
                <div key={t.name} className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wide">
                    {t.name}
                  </span>
                  {t.data.github.length > 1 ? (
                    <Select
                      value={String(selectedRepoIdx[t.name] ?? 0)}
                      onValueChange={(v) =>
                        setSelectedRepoIdx((prev) => ({ ...prev, [t.name]: parseInt(v) }))
                      }
                    >
                      <SelectTrigger className="h-7 w-[220px] text-[11px] border-border/60" data-testid={`select-repo-${t.name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {t.data.github.map((repo, idx) => (
                          <SelectItem key={repo.fullName} value={String(idx)} className="text-xs">
                            {repo.fullName} ({repo.stars.toLocaleString()} ★)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : t.data.github.length === 1 ? (
                    <span className="text-[11px] text-muted-foreground">
                      {t.data.github[0].fullName}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">No repos</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse" data-testid="comparison-table">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2.5 px-3 font-medium text-muted-foreground w-[140px]">Tool</th>
              <th className="py-2.5 px-3 font-medium text-muted-foreground">Repository</th>
              <th className="py-2.5 px-3 font-medium text-muted-foreground text-right">Stars</th>
              <th className="py-2.5 px-3 font-medium text-muted-foreground text-right">Forks</th>
              <th className="py-2.5 px-3 font-medium text-muted-foreground">Version</th>
              <th className="py-2.5 px-3 font-medium text-muted-foreground">Last Push</th>
              <th className="py-2.5 px-3 font-medium text-muted-foreground">Created</th>
              <th className="py-2.5 px-3 font-medium text-muted-foreground text-right">Open</th>
              <th className="py-2.5 px-3 font-medium text-muted-foreground text-right">Closed</th>
              <th className="py-2.5 px-3 font-medium text-muted-foreground text-center">Docker</th>
              <th className="py-2.5 px-3 font-medium text-muted-foreground text-right">Pubs</th>
              <th className="py-2.5 px-3 font-medium text-muted-foreground">Language</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.name}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                data-testid={`row-${row.name}`}
              >
                <td className="py-2.5 px-3">
                  <span className="font-semibold text-primary uppercase tracking-wide font-mono">
                    {row.name}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  {row.selectedRepo ? (
                    <a
                      href={row.selectedRepo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {row.selectedRepo.fullName}
                      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">No repo found</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  <span className={row.stars === maxStars && maxStars > 0 ? "text-yellow-600 dark:text-yellow-400 font-semibold" : ""}>
                    {row.stars.toLocaleString()}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {row.selectedRepo?.forks.toLocaleString() ?? "—"}
                </td>
                <td className="py-2.5 px-3">
                  {row.selectedRepo?.latestVersion ? (
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono">
                      {row.selectedRepo.latestVersion}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  <span className={row.name === mostRecent ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}>
                    {formatDate(row.pushedAt)}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-muted-foreground">
                  {formatDate(row.selectedRepo?.createdAt ?? null)}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {row.openIssues}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  {row.closedIssues}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {row.hasDocker ? (
                    <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mx-auto" />
                  ) : (
                    <XIcon className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />
                  )}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">
                  <span className={row.pubCount === mostPubs && mostPubs > 0 ? "text-primary font-semibold" : ""}>
                    {row.pubCount}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  {row.selectedRepo?.language ? (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                      {row.selectedRepo.language}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <Card className="border-border">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No tools match the current filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Side-by-side Docker comparison */}
      {sorted.some((r) => r.hasDocker) && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Box className="h-3 w-3" /> Docker Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {sorted
              .filter((r) => r.hasDocker)
              .map((row) => {
                const img = row.data.docker[0];
                return (
                  <Card key={row.name} className="border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-semibold text-primary uppercase">{row.name}</span>
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          Docker Hub <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{img.namespace}/{img.name}</p>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">{img.pullCount.toLocaleString()} pulls</span>
                        <span>{img.latestTag && `Tag: ${img.latestTag}`}</span>
                      </div>
                      {img.lastUpdated && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Updated {timeAgo(img.lastUpdated)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

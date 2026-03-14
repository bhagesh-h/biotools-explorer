import type { ToolData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  X, Star, GitFork, Bug, Clock, ExternalLink, Tag,
  Calendar, Box, Download, BookOpen, ChevronDown, ChevronUp,
  Globe, Shield
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";

interface ToolResultsProps {
  toolName: string;
  data: ToolData | null;
  isLoading: boolean;
  error: Error | null;
  onRemove: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch {
    return "N/A";
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ToolResults({ toolName, data, isLoading, error, onRemove }: ToolResultsProps) {
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [showAllPubs, setShowAllPubs] = useState(false);

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Failed to fetch data for "{toolName}"</p>
            <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7">
            <X className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid={`results-${toolName}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <span className="text-primary font-mono uppercase tracking-wide text-sm">{toolName}</span>
          {data && (
            <span className="text-xs text-muted-foreground font-normal">
              {data.github.length} repos · {data.docker.length} images · {data.publications.length} publications
            </span>
          )}
        </h2>
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive">
          <X className="h-3 w-3" /> Remove
        </Button>
      </div>

      {isLoading && <LoadingSkeleton />}

      {data && (
        <>
          {/* GitHub Repositories */}
          {data.github.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GitFork className="h-3 w-3" /> Repositories
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {data.github.map((repo) => (
                  <Card key={repo.fullName} className="border-border hover:border-primary/30 transition-colors group">
                    <CardContent className="p-4">
                      {/* Repo name + link */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 min-w-0"
                          data-testid={`link-repo-${repo.fullName}`}
                        >
                          <span className="truncate">{repo.fullName}</span>
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>

                      {/* Description */}
                      {repo.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {repo.description}
                        </p>
                      )}

                      {/* Stats row */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="tabular-nums">{repo.stars.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="h-3 w-3" />
                          <span className="tabular-nums">{repo.forks.toLocaleString()}</span>
                        </span>
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Bug className="h-3 w-3" />
                          <span className="tabular-nums">{repo.openIssues}</span> open
                        </span>
                        <span className="flex items-center gap-1">
                          <Bug className="h-3 w-3" />
                          <span className="tabular-nums">{repo.closedIssues}</span> closed
                        </span>
                      </div>

                      {/* Version & dates */}
                      <div className="space-y-1.5 text-xs">
                        {repo.latestVersion && (
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3 w-3 text-primary" />
                            <span className="font-medium">{repo.latestVersion}</span>
                            {repo.latestReleaseDate && (
                              <span className="text-muted-foreground">
                                ({timeAgo(repo.latestReleaseDate)})
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Updated {formatDate(repo.updatedAt)}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Created {formatDate(repo.createdAt)}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {repo.language && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            {repo.language}
                          </Badge>
                        )}
                        {repo.license && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            <Shield className="h-2.5 w-2.5 mr-0.5" />
                            {repo.license}
                          </Badge>
                        )}
                        {repo.homepage && (
                          <a href={repo.homepage} target="_blank" rel="noopener noreferrer">
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 cursor-pointer hover:bg-primary/10">
                              <Globe className="h-2.5 w-2.5 mr-0.5" />
                              Website
                            </Badge>
                          </a>
                        )}
                      </div>

                      {/* Release notes */}
                      {repo.latestReleaseNotes && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <button
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setExpandedNotes((prev) => ({
                              ...prev,
                              [repo.fullName]: !prev[repo.fullName],
                            }))}
                          >
                            {expandedNotes[repo.fullName] ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                            Release notes
                          </button>
                          {expandedNotes[repo.fullName] && (
                            <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap break-words max-h-40 overflow-y-auto bg-muted/50 rounded p-2">
                              {repo.latestReleaseNotes}
                            </pre>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Docker Images */}
          {data.docker.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Box className="h-3 w-3" /> Docker Images
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {data.docker.map((img) => (
                  <Card key={`${img.namespace}/${img.name}`} className="border-border hover:border-primary/30 transition-colors group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                          data-testid={`link-docker-${img.namespace}/${img.name}`}
                        >
                          {img.namespace}/{img.name}
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                      {img.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {img.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="tabular-nums">{img.starCount}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          <span className="tabular-nums">{img.pullCount.toLocaleString()}</span> pulls
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {img.latestTag && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            <Tag className="h-2.5 w-2.5 mr-0.5" />
                            {img.latestTag}
                          </Badge>
                        )}
                        {img.lastUpdated && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {timeAgo(img.lastUpdated)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Publications */}
          {data.publications.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" /> Publications ({data.publications.length})
              </h3>
              <div className="space-y-2">
                {(showAllPubs ? data.publications : data.publications.slice(0, 4)).map((pub, idx) => (
                  <Card key={`${pub.title}-${idx}`} className="border-border">
                    <CardContent className="p-3 flex gap-3">
                      <div className="flex-1 min-w-0">
                        <a
                          href={pub.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
                          data-testid={`link-pub-${idx}`}
                        >
                          {pub.title}
                        </a>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {pub.authors}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {pub.journal && (
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              {truncate(pub.journal, 30)}
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">{pub.year}</span>
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-primary/5 border-primary/20 text-primary">
                            {pub.usageSummary}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            {pub.source}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {data.publications.length > 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setShowAllPubs((v) => !v)}
                  >
                    {showAllPubs ? "Show less" : `Show all ${data.publications.length} publications`}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Empty sections */}
          {data.github.length === 0 && data.docker.length === 0 && data.publications.length === 0 && (
            <Card className="border-border">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No results found for "{toolName}". Try a different search term.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

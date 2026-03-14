import type { Express } from "express";
import { createServer, type Server } from "http";
import type { GithubRepo, DockerImage, Publication } from "@shared/schema";

// ---- GitHub API ----
async function searchGithub(query: string): Promise<GithubRepo[]> {
  try {
    const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+in:name,description&sort=stars&order=desc&per_page=5`;
    const res = await fetch(searchUrl, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "BioTools-Dashboard",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.items || [];

    const repos: GithubRepo[] = await Promise.all(
      items.map(async (repo: any) => {
        // Get releases
        let latestVersion: string | null = null;
        let latestReleaseDate: string | null = null;
        let latestReleaseNotes: string | null = null;
        let firstReleaseDate: string | null = null;

        try {
          const releasesRes = await fetch(
            `https://api.github.com/repos/${repo.full_name}/releases?per_page=100`,
            {
              headers: {
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "BioTools-Dashboard",
              },
            }
          );
          if (releasesRes.ok) {
            const releases = await releasesRes.json();
            if (releases.length > 0) {
              latestVersion = releases[0].tag_name;
              latestReleaseDate = releases[0].published_at;
              latestReleaseNotes = (releases[0].body || "").slice(0, 500);
              firstReleaseDate = releases[releases.length - 1].published_at;
            }
          }
        } catch {
          // skip
        }

        // If no releases, try tags
        if (!latestVersion) {
          try {
            const tagsRes = await fetch(
              `https://api.github.com/repos/${repo.full_name}/tags?per_page=1`,
              {
                headers: {
                  Accept: "application/vnd.github.v3+json",
                  "User-Agent": "BioTools-Dashboard",
                },
              }
            );
            if (tagsRes.ok) {
              const tags = await tagsRes.json();
              if (tags.length > 0) {
                latestVersion = tags[0].name;
              }
            }
          } catch {
            // skip
          }
        }

        // Get accurate open & closed issues counts via Search API
        // (repo.open_issues_count includes PRs, so we use the Search API instead)
        let openIssues = 0;
        let closedIssues = 0;
        try {
          const [openRes, closedRes] = await Promise.all([
            fetch(
              `https://api.github.com/search/issues?q=repo:${repo.full_name}+type:issue+state:open&per_page=1`,
              {
                headers: {
                  Accept: "application/vnd.github.v3+json",
                  "User-Agent": "BioTools-Dashboard",
                },
              }
            ),
            fetch(
              `https://api.github.com/search/issues?q=repo:${repo.full_name}+type:issue+state:closed&per_page=1`,
              {
                headers: {
                  Accept: "application/vnd.github.v3+json",
                  "User-Agent": "BioTools-Dashboard",
                },
              }
            ),
          ]);
          if (openRes.ok) {
            const openData = await openRes.json();
            openIssues = openData.total_count || 0;
          }
          if (closedRes.ok) {
            const closedData = await closedRes.json();
            closedIssues = closedData.total_count || 0;
          }
        } catch {
          // Fallback to repo.open_issues_count if Search API fails
          openIssues = repo.open_issues_count;
        }

        return {
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          homepage: repo.homepage || null,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          openIssues,
          closedIssues,
          latestVersion,
          latestReleaseDate,
          latestReleaseNotes,
          firstReleaseDate,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          pushedAt: repo.pushed_at || repo.updated_at,
          language: repo.language,
          license: repo.license?.spdx_id || null,
          topics: repo.topics || [],
        };
      })
    );

    return repos;
  } catch (e) {
    console.error("GitHub search error:", e);
    return [];
  }
}

// ---- Docker Hub API ----
async function searchDockerHub(query: string): Promise<DockerImage[]> {
  try {
    const url = `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=5`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BioTools-Dashboard" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];

    const images: DockerImage[] = results.map((img: any) => {
      const namespace = img.repo_owner || img.namespace || "library";
      const name = img.repo_name || img.name;
      return {
        name,
        namespace,
        description: img.short_description || img.description || null,
        url: `https://hub.docker.com/r/${namespace}/${name}`,
        starCount: img.star_count || 0,
        pullCount: img.pull_count || 0,
        lastUpdated: img.last_updated || null,
        latestTag: "latest",
      };
    });

    // Fetch latest tag info for each image
    await Promise.all(
      images.map(async (img) => {
        try {
          const tagUrl = `https://hub.docker.com/v2/repositories/${img.namespace}/${img.name}/tags/?page_size=1&ordering=last_updated`;
          const tagRes = await fetch(tagUrl, {
            headers: { "User-Agent": "BioTools-Dashboard" },
          });
          if (tagRes.ok) {
            const tagData = await tagRes.json();
            if (tagData.results && tagData.results.length > 0) {
              img.latestTag = tagData.results[0].name || "latest";
              img.lastUpdated = tagData.results[0].last_updated || img.lastUpdated;
            }
          }
        } catch {
          // skip
        }
      })
    );

    return images;
  } catch (e) {
    console.error("Docker Hub search error:", e);
    return [];
  }
}

// ---- Europe PMC (literature) ----
async function searchPublications(query: string): Promise<Publication[]> {
  try {
    // Search Europe PMC which covers PubMed and PMC
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query + " bioinformatics OR software OR tool OR pipeline")}&resultType=core&pageSize=8&format=json&sort=CITED desc`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BioTools-Dashboard" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.resultList?.result || [];

    const pubs: Publication[] = results.map((pub: any) => {
      const doi = pub.doi || null;
      const pmid = pub.pmid || null;
      let pubUrl = "";
      if (doi) pubUrl = `https://doi.org/${doi}`;
      else if (pmid) pubUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
      else pubUrl = pub.fullTextUrlList?.fullTextUrl?.[0]?.url || "";

      // Generate usage summary from abstract
      let usageSummary = "Tool mentioned in publication.";
      const abstract = (pub.abstractText || "").toLowerCase();
      if (abstract.includes("benchmark") || abstract.includes("comparison")) {
        usageSummary = "Benchmarking / comparative analysis";
      } else if (abstract.includes("pipeline") || abstract.includes("workflow")) {
        usageSummary = "Part of an analysis pipeline";
      } else if (abstract.includes("quality control") || abstract.includes("qc")) {
        usageSummary = "Quality control / preprocessing";
      } else if (abstract.includes("align") || abstract.includes("mapping")) {
        usageSummary = "Sequence alignment / read mapping";
      } else if (abstract.includes("single-cell") || abstract.includes("single cell") || abstract.includes("scRNA")) {
        usageSummary = "Single-cell analysis";
      } else if (abstract.includes("rna-seq") || abstract.includes("rnaseq") || abstract.includes("transcriptom")) {
        usageSummary = "RNA-seq / transcriptomic analysis";
      } else if (abstract.includes("variant") || abstract.includes("mutation") || abstract.includes("snp")) {
        usageSummary = "Variant calling / mutation analysis";
      } else if (abstract.includes("genome") || abstract.includes("assembly")) {
        usageSummary = "Genome assembly / genomic analysis";
      } else if (abstract.includes("visuali") || abstract.includes("plot")) {
        usageSummary = "Data visualization";
      } else if (abstract.includes("develop") || abstract.includes("present") || abstract.includes("novel")) {
        usageSummary = "Primary tool / method description";
      }

      // Authors
      const authors = pub.authorString || "Unknown authors";

      return {
        title: pub.title || "Untitled",
        authors: authors.length > 100 ? authors.slice(0, 100) + "..." : authors,
        year: pub.pubYear || "N/A",
        journal: pub.journalTitle || pub.source || null,
        doi,
        pmid,
        url: pubUrl,
        usageSummary,
        source: pub.source === "MED" ? "PubMed" : pub.source || "Europe PMC",
      };
    });

    return pubs;
  } catch (e) {
    console.error("Publication search error:", e);
    return [];
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Search tool across all sources
  app.get("/api/search", async (req, res) => {
    const query = (req.query.q as string) || "";
    if (!query.trim()) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    try {
      // Fetch all data in parallel
      const [github, docker, publications] = await Promise.all([
        searchGithub(query),
        searchDockerHub(query),
        searchPublications(query),
      ]);

      res.json({
        searchQuery: query,
        github,
        docker,
        publications,
        fetchedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Search error:", e);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}

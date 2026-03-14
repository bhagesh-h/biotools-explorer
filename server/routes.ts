import type { Express } from "express";
import { createServer, type Server } from "http";
import type { GithubRepo, DockerImage, Publication, ReleaseEntry } from "@shared/schema";

const GITHUB_HEADERS = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "BioTools-Dashboard",
};

// Bioinformatics keywords paired with the query for GitHub search.
// GitHub limits OR-clause complexity — 5 terms is the safe maximum
// before the API starts returning 0 results.
const BIO_CONTEXT_KEYWORDS = [
  "aligner", "sequencing", "bioinformatics", "genomics", "RNA-seq",
];

/**
 * Smart GitHub search: runs two queries in parallel —
 *  1) Bioinformatics-scoped: pairs query with bio keywords (e.g. "STAR aligner OR STAR sequencing")
 *  2) General: query in repo name, sorted by stars
 * Then deduplicates and merges, putting bio-relevant results first.
 */
async function searchGithub(query: string, limit: number): Promise<GithubRepo[]> {
  try {
    // Build bio query: "STAR+aligner+OR+STAR+sequencing+OR+STAR+bioinformatics ..."
    // GitHub Search API expects spaces as + (not %20) and literal +OR+ for boolean OR.
    // Encode each term individually with encodeURIComponent, then replace %20 with +,
    // so the final URL has STAR+aligner+OR+STAR+sequencing etc.
    const bioTerms = BIO_CONTEXT_KEYWORDS
      .map((kw) => encodeURIComponent(`${query} ${kw}`).replace(/%20/g, "+"))
      .join("+OR+");
    const bioUrl = `https://api.github.com/search/repositories?q=${bioTerms}+in:name,description&sort=stars&order=desc&per_page=${limit}`;
    // General search: name + description, sorted by stars
    const generalUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}+in:name,description&sort=stars&order=desc&per_page=${limit}`;

    const [bioRes, generalRes] = await Promise.all([
      fetch(bioUrl, { headers: GITHUB_HEADERS }).catch(() => null),
      fetch(generalUrl, { headers: GITHUB_HEADERS }).catch(() => null),
    ]);

    const bioItems = bioRes?.ok ? (await bioRes.json()).items || [] : [];
    const generalItems = generalRes?.ok ? (await generalRes.json()).items || [] : [];

    // Smart merge: combine both result sets, deduplicate, then sort by a
    // relevance score that gives bio-scoped results a 10x star boost.
    // This ensures:
    //  - STAR → alexdobin/STAR (2K stars, bio-matched) beats starship (55K stars, not bio)
    //  - BWA → lh3/bwa (1.7K stars, general) beats obscure bio-tagged repos (0-5 stars)
    const bioNames = new Set(bioItems.map((item: any) => item.full_name));
    const seen = new Set<string>();
    const candidates: { item: any; score: number }[] = [];

    for (const item of [...bioItems, ...generalItems]) {
      if (!seen.has(item.full_name)) {
        seen.add(item.full_name);
        const stars = item.stargazers_count || 0;
        // Bio-matched repos with meaningful star counts get a large boost so they
        // outrank popular but irrelevant general results (e.g. starship for "STAR").
        // But low-star bio repos (≤10 stars) don't get boosted — they're likely
        // noise that shouldn't outrank well-known tools (e.g. lh3/bwa for "BWA").
        const isBio = bioNames.has(item.full_name);
        const score = (isBio && stars > 10) ? stars + 1_000_000 : stars;
        candidates.push({ item, score });
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    const merged = candidates.slice(0, limit).map((c) => c.item);

    // Enrich repos with release/issue data in batches of 5 to avoid
    // GitHub rate limits (60 Core API calls/hr, 10 Search API calls/min).
    // Fallback to basic data from the search response if rate-limited.
    async function enrichRepo(repo: any): Promise<GithubRepo> {
      let latestVersion: string | null = null;
      let latestReleaseDate: string | null = null;
      let latestReleaseNotes: string | null = null;
      let firstReleaseDate: string | null = null;
      let changelog: ReleaseEntry[] = [];

      // Fetch releases (up to 20 for changelog)
      try {
        const releasesRes = await fetch(
          `https://api.github.com/repos/${repo.full_name}/releases?per_page=20`,
          { headers: GITHUB_HEADERS }
        );
        if (releasesRes.ok) {
          const releases = await releasesRes.json();
          if (releases.length > 0) {
            latestVersion = releases[0].tag_name;
            latestReleaseDate = releases[0].published_at;
            latestReleaseNotes = (releases[0].body || "").slice(0, 500);
            firstReleaseDate = releases[releases.length - 1].published_at;
            changelog = releases.map((r: any) => ({
              tag: r.tag_name,
              name: r.name || null,
              publishedAt: r.published_at || null,
              body: (r.body || "").slice(0, 300) || null,
            }));
          }
        }
      } catch {
        // Rate-limited or network error — continue with basic data
      }

      // If no releases, try tags (just 1 call)
      if (!latestVersion) {
        try {
          const tagsRes = await fetch(
            `https://api.github.com/repos/${repo.full_name}/tags?per_page=1`,
            { headers: GITHUB_HEADERS }
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

      // Issue counts: try Search API, fall back to repo's open_issues_count
      let openIssues = repo.open_issues_count || 0;
      let closedIssues = 0;
      try {
        const [openRes, closedRes] = await Promise.all([
          fetch(
            `https://api.github.com/search/issues?q=repo:${repo.full_name}+type:issue+state:open&per_page=1`,
            { headers: GITHUB_HEADERS }
          ),
          fetch(
            `https://api.github.com/search/issues?q=repo:${repo.full_name}+type:issue+state:closed&per_page=1`,
            { headers: GITHUB_HEADERS }
          ),
        ]);
        if (openRes.ok) {
          const openData = await openRes.json();
          openIssues = openData.total_count ?? openIssues;
        }
        if (closedRes.ok) {
          const closedData = await closedRes.json();
          closedIssues = closedData.total_count || 0;
        }
      } catch {
        // Keep fallback values
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
        changelog,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at || repo.updated_at,
        language: repo.language,
        license: repo.license?.spdx_id || null,
        topics: repo.topics || [],
      };
    }

    // Process in batches of 5 to stay within rate limits
    const repos: GithubRepo[] = [];
    const BATCH_SIZE = 5;
    for (let i = 0; i < merged.length; i += BATCH_SIZE) {
      const batch = merged.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(enrichRepo));
      repos.push(...batchResults);
    }

    return repos;
  } catch (e) {
    console.error("GitHub search error:", e);
    return [];
  }
}

// ---- Docker Hub API ----
async function searchDockerHub(query: string, limit: number): Promise<DockerImage[]> {
  try {
    const url = `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=${limit}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "BioTools-Dashboard" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = data.results || [];

    const images: DockerImage[] = results.map((img: any) => {
      // repo_name from Docker Hub search API is the full slug, e.g. "multiqc/multiqc"
      // Parse it to extract namespace and short name
      const repoSlug = img.repo_name || img.name || "";
      let namespace: string;
      let name: string;
      if (repoSlug.includes("/")) {
        [namespace, name] = repoSlug.split("/", 2);
      } else {
        namespace = img.repo_owner || img.namespace || "library";
        name = repoSlug;
      }
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
async function searchPublications(query: string, limit: number): Promise<Publication[]> {
  try {
    const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query + " bioinformatics OR software OR tool OR pipeline")}&resultType=core&pageSize=${limit}&format=json&sort=CITED desc`;
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

    // Parse limit: default 10, min 5, max 25
    let limit = parseInt(req.query.limit as string) || 10;
    limit = Math.max(5, Math.min(25, limit));

    try {
      // Fetch all data in parallel
      const [github, docker, publications] = await Promise.all([
        searchGithub(query, limit),
        searchDockerHub(query, limit),
        searchPublications(query, limit),
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

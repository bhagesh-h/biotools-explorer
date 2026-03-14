import { z } from "zod";

// Tool search request
export const toolSearchSchema = z.object({
  query: z.string().min(1),
});
export type ToolSearchRequest = z.infer<typeof toolSearchSchema>;

// GitHub repository data
export const githubRepoSchema = z.object({
  name: z.string(),
  fullName: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  homepage: z.string().nullable(),
  stars: z.number(),
  forks: z.number(),
  openIssues: z.number(),
  closedIssues: z.number(),
  latestVersion: z.string().nullable(),
  latestReleaseDate: z.string().nullable(),
  latestReleaseNotes: z.string().nullable(),
  firstReleaseDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  language: z.string().nullable(),
  license: z.string().nullable(),
  topics: z.array(z.string()),
});
export type GithubRepo = z.infer<typeof githubRepoSchema>;

// Docker Hub image data
export const dockerImageSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  starCount: z.number(),
  pullCount: z.number(),
  lastUpdated: z.string().nullable(),
  latestTag: z.string().nullable(),
});
export type DockerImage = z.infer<typeof dockerImageSchema>;

// Publication data
export const publicationSchema = z.object({
  title: z.string(),
  authors: z.string(),
  year: z.string(),
  journal: z.string().nullable(),
  doi: z.string().nullable(),
  pmid: z.string().nullable(),
  url: z.string(),
  usageSummary: z.string(),
  source: z.string(), // "PubMed" | "arXiv" | "Europe PMC"
});
export type Publication = z.infer<typeof publicationSchema>;

// Combined tool data
export const toolDataSchema = z.object({
  searchQuery: z.string(),
  github: z.array(githubRepoSchema),
  docker: z.array(dockerImageSchema),
  publications: z.array(publicationSchema),
  fetchedAt: z.string(),
});
export type ToolData = z.infer<typeof toolDataSchema>;

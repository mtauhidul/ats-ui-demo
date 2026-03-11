import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hasPermission } from "@/lib/rbac";
import { useAuth } from "@/hooks/useAuth";
import { 
  useJobs, 
  useCandidates, 
  useClients, 
  useApplications, 
  useTeamMembers 
} from "@/hooks/firestore";
import type { Application } from "@/types/application";
import type { Candidate } from "@/types/candidate";
import type { Client } from "@/types/client";
import type { Job } from "@/types/job";
import type { TeamMember } from "@/types/team";
import {
  Briefcase,
  Building,
  Clock,
  FileText,
  Search,
  TrendingUp,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type SearchResultType = "job" | "candidate" | "client" | "application" | "team";

interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  description: string;
  avatar?: string;
  badges: string[];
  link: string;
  relevance: number;
  matchedFields: string[];
}

// Enhanced fuzzy match scoring with multiple algorithms
const fuzzyMatch = (
  text: string | undefined | null,
  query: string
): { score: number; matched: boolean } => {
  if (!text || typeof text !== "string") return { score: 0, matched: false };

  text = text.toLowerCase().trim();
  query = query.toLowerCase().trim();

  // Exact match - highest score
  if (text === query) return { score: 100, matched: true };

  // Starts with query - very high score
  if (text.startsWith(query)) return { score: 90, matched: true };

  // Contains exact query - high score
  if (text.includes(query)) return { score: 70, matched: true };

  // Word boundary match (query matches word start)
  const words = text.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(query)) return { score: 60, matched: true };
    if (word.includes(query)) return { score: 40, matched: true };
  }

  // Fuzzy sequential match
  let score = 0;
  let queryIndex = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;

  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      score += consecutiveMatches * 2; // Bonus for consecutive matches
      queryIndex++;
    } else {
      consecutiveMatches = 0;
    }
  }

  // All characters matched
  if (queryIndex === query.length) {
    score += 20 + maxConsecutive * 5;
    return { score: Math.min(score, 50), matched: true };
  }

  return { score: 0, matched: false };
};

// Debounce function
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | SearchResultType>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem("recentSearches");
    return saved ? JSON.parse(saved) : [];
  });

  // Get current user for permissions
  const { user: currentUser } = useAuth();

  // Get data from Firestore with realtime updates
  const { data: jobsData = [] } = useJobs();
  const { data: candidatesData = [] } = useCandidates();
  const { data: clientsData = [] } = useClients();
  const { data: applicationsData = [] } = useApplications();
  const { data: teamData = [] } = useTeamMembers();

  // Debounced search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // 🔥 REALTIME: All data including team members now comes from Firestore - no fetch needed!

  // Add to recent searches
  useEffect(() => {
    if (searchQuery.trim() && searchQuery.length > 2) {
      const timer = setTimeout(() => {
        setRecentSearches((prev) => {
          const updated = [
            searchQuery,
            ...prev.filter((q) => q !== searchQuery),
          ].slice(0, 5);
          localStorage.setItem("recentSearches", JSON.stringify(updated));
          return updated;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];

    const query = debouncedQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search Jobs
    if (hasPermission(currentUser, "canManageJobs")) {
      jobsData.forEach((job: Job) => {
        const matchedFields: string[] = [];
        let relevance = 0;

        const titleMatch = fuzzyMatch(job.title, query);
        if (titleMatch.matched) {
          relevance += titleMatch.score * 2.0; // Title is most important
          matchedFields.push("title");
        }

        const descMatch = fuzzyMatch(job.description || "", query);
        if (descMatch.matched) {
          relevance += descMatch.score * 0.5;
          matchedFields.push("description");
        }

        const typeMatch = fuzzyMatch(job.type || "", query);
        if (typeMatch.matched) {
          relevance += typeMatch.score * 0.8;
          matchedFields.push("type");
        }

        const statusMatch = fuzzyMatch(job.status || "", query);
        if (statusMatch.matched) {
          relevance += statusMatch.score * 0.6;
          matchedFields.push("status");
        }

        const levelMatch = fuzzyMatch(job.experienceLevel || "", query);
        if (levelMatch.matched) {
          relevance += levelMatch.score * 0.7;
          matchedFields.push("experience level");
        }

        // Search in location
        const locationStr = job.location
          ? `${job.location.city || ""} ${job.location.state || ""} ${
              job.location.country || ""
            }`.trim()
          : "";
        const locationMatch = fuzzyMatch(locationStr, query);
        if (locationMatch.matched) {
          relevance += locationMatch.score * 0.8;
          matchedFields.push("location");
        }

        // Search in requirements
        if (job.requirements) {
          const reqSkills = [
            ...(job.requirements.skills?.required || []),
            ...(job.requirements.skills?.preferred || []),
          ];
          for (const skill of reqSkills) {
            const skillMatch = fuzzyMatch(skill, query);
            if (skillMatch.matched) {
              relevance += skillMatch.score * 0.9;
              matchedFields.push("required skills");
              break;
            }
          }

          const educationMatch = fuzzyMatch(
            job.requirements.education || "",
            query
          );
          if (educationMatch.matched) {
            relevance += educationMatch.score * 0.4;
            matchedFields.push("education");
          }
        }

        // Search in department
        const deptMatch = fuzzyMatch(job.department || "", query);
        if (deptMatch.matched) {
          relevance += deptMatch.score * 0.7;
          matchedFields.push("department");
        }

        if (relevance > 10) {
          const client = clientsData.find((c: Client) => {
            if (typeof job.clientId === "string") {
              return c.id === job.clientId;
            }
            return c.id === job.clientId?.id || c.id === job.clientId?._id;
          });

          const companyName =
            client?.companyName ||
            (typeof job.clientId === "object"
              ? job.clientId.companyName
              : "Unknown Client");

          results.push({
            id: job.id,
            type: "job",
            title: job.title,
            subtitle: `${companyName} • ${locationStr || "Remote"}`,
            description: job.description || "No description available",
            badges: [
              job.type || "Full-time",
              job.status,
              job.experienceLevel,
              job.salaryRange
                ? `$${job.salaryRange.min.toLocaleString()}-${job.salaryRange.max.toLocaleString()}`
                : "",
            ].filter(Boolean),
            link: `/dashboard/jobs/pipeline/${job.id}`,
            relevance,
            matchedFields,
          });
        }
      });
    }

    // Search Candidates
    if (hasPermission(currentUser, "canManageCandidates")) {
      candidatesData.forEach((candidate: Candidate) => {
        const matchedFields: string[] = [];
        let relevance = 0;
        const fullName = `${candidate.firstName} ${candidate.lastName}`;
        const location = candidate.address
          ? `${candidate.address.city}, ${candidate.address.country}`
          : "";

        const nameMatch = fuzzyMatch(fullName, query);
        if (nameMatch.matched) {
          relevance += nameMatch.score * 2.5; // Name is very important
          matchedFields.push("name");
        }

        const emailMatch = fuzzyMatch(candidate.email, query);
        if (emailMatch.matched) {
          relevance += emailMatch.score * 1.5;
          matchedFields.push("email");
        }

        const phoneMatch = fuzzyMatch(candidate.phone || "", query);
        if (phoneMatch.matched) {
          relevance += phoneMatch.score * 1.2;
          matchedFields.push("phone");
        }

        const titleMatch = fuzzyMatch(candidate.currentTitle || "", query);
        if (titleMatch.matched) {
          relevance += titleMatch.score * 1.3;
          matchedFields.push("current title");
        }

        const locationMatch = fuzzyMatch(location, query);
        if (locationMatch.matched) {
          relevance += locationMatch.score * 0.6;
          matchedFields.push("location");
        }

        // Search in skills
        if (candidate.skills && candidate.skills.length > 0) {
          for (const skill of candidate.skills) {
            const skillName = typeof skill === "string" ? skill : skill.name;
            const skillMatch = fuzzyMatch(skillName, query);
            if (skillMatch.matched) {
              relevance += skillMatch.score * 1.0;
              if (!matchedFields.includes("skills")) {
                matchedFields.push("skills");
              }
            }
          }
        }

        // Search in work experience (if available)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const candidateAny = candidate as any;
        if (candidateAny.experience && Array.isArray(candidateAny.experience)) {
          for (const exp of candidateAny.experience) {
            const titleMatch = fuzzyMatch(exp.title || "", query);
            const companyMatch = fuzzyMatch(exp.company || "", query);
            if (titleMatch.matched || companyMatch.matched) {
              relevance += Math.max(titleMatch.score, companyMatch.score) * 0.8;
              if (!matchedFields.includes("experience")) {
                matchedFields.push("experience");
              }
            }
          }
        }

        // Search in education
        if (candidate.education && candidate.education.length > 0) {
          for (const edu of candidate.education) {
            const degreeMatch = fuzzyMatch(edu.degree || "", query);
            const schoolMatch = fuzzyMatch(edu.institution || "", query);
            if (degreeMatch.matched || schoolMatch.matched) {
              relevance += Math.max(degreeMatch.score, schoolMatch.score) * 0.6;
              if (!matchedFields.includes("education")) {
                matchedFields.push("education");
              }
            }
          }
        }

        if (relevance > 10) {
          results.push({
            id: candidate.id,
            type: "candidate",
            title: fullName,
            subtitle: `${candidate.currentTitle || "Candidate"} • ${
              location || "No location"
            }`,
            description: candidate.email,
            avatar: candidate.avatar,
            badges:
              candidate.skills
                ?.slice(0, 3)
                .map((s) => (typeof s === "string" ? s : s.name)) || [],
            link: `/dashboard/candidates/${candidate.id}`,
            relevance,
            matchedFields,
          });
        }
      });
    }

    // Search Clients
    if (hasPermission(currentUser, "canManageClients")) {
      clientsData.forEach((client: Client) => {
        const matchedFields: string[] = [];
        let relevance = 0;
        const location = client.address
          ? `${client.address.city}, ${client.address.country}`
          : "";

        const nameMatch = fuzzyMatch(client.companyName, query);
        if (nameMatch.matched) {
          relevance += nameMatch.score * 2.0;
          matchedFields.push("company name");
        }

        const industryMatch = fuzzyMatch(client.industry, query);
        if (industryMatch.matched) {
          relevance += industryMatch.score * 1.2;
          matchedFields.push("industry");
        }

        const emailMatch = fuzzyMatch(client.email || "", query);
        if (emailMatch.matched) {
          relevance += emailMatch.score * 1.0;
          matchedFields.push("email");
        }

        const sizeMatch = fuzzyMatch(client.companySize, query);
        if (sizeMatch.matched) {
          relevance += sizeMatch.score * 0.6;
          matchedFields.push("company size");
        }

        const statusMatch = fuzzyMatch(client.status, query);
        if (statusMatch.matched) {
          relevance += statusMatch.score * 0.5;
          matchedFields.push("status");
        }

        const locationMatch = fuzzyMatch(location, query);
        if (locationMatch.matched) {
          relevance += locationMatch.score * 0.7;
          matchedFields.push("location");
        }

        if (relevance > 10) {
          results.push({
            id: client.id,
            type: "client",
            title: client.companyName,
            subtitle: `${client.industry} • ${location || "No location"}`,
            description: `${client.email || ""} • ${client.companySize} • ${
              client.status
            }`,
            avatar: undefined,
            badges: [client.status, client.companySize],
            link: `/dashboard/clients`,
            relevance,
            matchedFields,
          });
        }
      });
    }

    // Search Applications
    if (hasPermission(currentUser, "canReviewApplications")) {
      applicationsData.forEach((app: Application) => {
        const matchedFields: string[] = [];
        let relevance = 0;
        const fullName = `${app.firstName} ${app.lastName}`;

        const nameMatch = fuzzyMatch(fullName, query);
        if (nameMatch.matched) {
          relevance += nameMatch.score * 2.0;
          matchedFields.push("name");
        }

        const emailMatch = fuzzyMatch(app.email, query);
        if (emailMatch.matched) {
          relevance += emailMatch.score * 1.5;
          matchedFields.push("email");
        }

        const jobTitleMatch = fuzzyMatch(app.targetJobTitle || "", query);
        if (jobTitleMatch.matched) {
          relevance += jobTitleMatch.score * 1.2;
          matchedFields.push("target job");
        }

        const statusMatch = fuzzyMatch(app.status, query);
        if (statusMatch.matched) {
          relevance += statusMatch.score * 0.7;
          matchedFields.push("status");
        }

        const sourceMatch = fuzzyMatch(app.source, query);
        if (sourceMatch.matched) {
          relevance += sourceMatch.score * 0.5;
          matchedFields.push("source");
        }

        if (relevance > 10) {
          results.push({
            id: app.id,
            type: "application",
            title: fullName,
            subtitle: `${app.targetJobTitle || "Application"} • ${app.source}`,
            description: `${app.email} • Applied ${new Date(
              app.submittedAt
            ).toLocaleDateString()} • ${app.status}`,
            avatar: undefined,
            badges: [app.status, app.source],
            link: `/dashboard/candidates`,
            relevance,
            matchedFields,
          });
        }
      });
    }

    // Search Team Members
    if (hasPermission(currentUser, "canManageTeam")) {
      teamData.forEach((member: TeamMember) => {
        const matchedFields: string[] = [];
        let relevance = 0;
        const fullName = `${member.firstName} ${member.lastName}`;

        const nameMatch = fuzzyMatch(fullName, query);
        if (nameMatch.matched) {
          relevance += nameMatch.score * 2.0;
          matchedFields.push("name");
        }

        const emailMatch = fuzzyMatch(member.email, query);
        if (emailMatch.matched) {
          relevance += emailMatch.score * 1.5;
          matchedFields.push("email");
        }

        const roleMatch = fuzzyMatch(member.role, query);
        if (roleMatch.matched) {
          relevance += roleMatch.score * 1.2;
          matchedFields.push("role");
        }

        const titleMatch = fuzzyMatch(member.title || "", query);
        if (titleMatch.matched) {
          relevance += titleMatch.score * 1.0;
          matchedFields.push("title");
        }

        const deptMatch = fuzzyMatch(member.department, query);
        if (deptMatch.matched) {
          relevance += deptMatch.score * 0.8;
          matchedFields.push("department");
        }

        const statusMatch = fuzzyMatch(member.status, query);
        if (statusMatch.matched) {
          relevance += statusMatch.score * 0.5;
          matchedFields.push("status");
        }

        if (relevance > 10) {
          results.push({
            id: member.id,
            type: "team",
            title: fullName,
            subtitle: `${member.title || member.role} • ${member.department}`,
            description: `${member.email} • ${member.status}`,
            avatar: undefined,
            badges: [member.role, member.status],
            link: `/dashboard/team`,
            relevance,
            matchedFields,
          });
        }
      });
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }, [
    debouncedQuery,
    currentUser,
    jobsData,
    candidatesData,
    clientsData,
    applicationsData,
    teamData,
  ]);

  const filteredResults =
    filterType === "all"
      ? searchResults
      : searchResults.filter((r) => r.type === filterType);

  const resultCounts = {
    all: searchResults.length,
    job: searchResults.filter((r) => r.type === "job").length,
    candidate: searchResults.filter((r) => r.type === "candidate").length,
    client: searchResults.filter((r) => r.type === "client").length,
    application: searchResults.filter((r) => r.type === "application").length,
    team: searchResults.filter((r) => r.type === "team").length,
  };

  const getTypeIcon = (type: SearchResultType) => {
    switch (type) {
      case "job":
        return <Briefcase className="h-5 w-5 text-blue-600" />;
      case "candidate":
        return <UserCircle className="h-5 w-5 text-green-600" />;
      case "client":
        return <Building className="h-5 w-5 text-purple-600" />;
      case "application":
        return <FileText className="h-5 w-5 text-amber-600" />;
      case "team":
        return <Users className="h-5 w-5 text-indigo-600" />;
      default:
        return <Search className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadgeColor = (type: SearchResultType) => {
    switch (type) {
      case "job":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "candidate":
        return "bg-green-50 text-green-700 border-green-200";
      case "client":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "application":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "team":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 py-3 md:gap-4 md:py-4">
          <div className="px-3 lg:px-4">
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="rounded-lg bg-blue-600/10 p-1.5 md:p-2 shrink-0">
                  <Search className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">
                    Global Search
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                    Search across jobs, candidates, clients, applications, and
                    team members
                  </p>
                </div>
              </div>

              <div className="relative max-w-3xl">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  id="global-search-input"
                  placeholder="Search for anything... (jobs, candidates, clients, applications, team)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 md:pl-12 pr-12 md:pr-24 h-10 md:h-12 text-sm md:text-lg"
                  autoFocus
                />
                <div className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>

              {/* Recent Searches */}
              {!searchQuery && recentSearches.length > 0 && (
                <Card className="mt-3 md:mt-4 max-w-3xl">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                        <p className="text-xs md:text-sm font-medium">
                          Recent Searches
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 md:h-8 md:w-8 p-0"
                        onClick={() => {
                          setRecentSearches([]);
                          localStorage.removeItem("recentSearches");
                        }}
                      >
                        <X className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      {recentSearches.map((search, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                          onClick={() => setSearchQuery(search)}
                        >
                          {search}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {searchQuery && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-4 md:mb-6">
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setFilterType("all")}
                  >
                    <CardContent className="pt-4 md:pt-6 pb-3 md:pb-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                            All Results
                          </p>
                          <p className="text-xl md:text-2xl font-bold">
                            {resultCounts.all}
                          </p>
                        </div>
                        <Search className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setFilterType("job")}
                  >
                    <CardContent className="pt-4 md:pt-6 pb-3 md:pb-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                            Jobs
                          </p>
                          <p className="text-xl md:text-2xl font-bold">
                            {resultCounts.job}
                          </p>
                        </div>
                        <Briefcase className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setFilterType("candidate")}
                  >
                    <CardContent className="pt-4 md:pt-6 pb-3 md:pb-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                            Candidates
                          </p>
                          <p className="text-xl md:text-2xl font-bold">
                            {resultCounts.candidate}
                          </p>
                        </div>
                        <UserCircle className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setFilterType("client")}
                  >
                    <CardContent className="pt-4 md:pt-6 pb-3 md:pb-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                            Clients
                          </p>
                          <p className="text-xl md:text-2xl font-bold">
                            {resultCounts.client}
                          </p>
                        </div>
                        <Building className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setFilterType("application")}
                  >
                    <CardContent className="pt-4 md:pt-6 pb-3 md:pb-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] md:text-sm text-muted-foreground truncate">
                            Applications
                          </p>
                          <p className="text-xl md:text-2xl font-bold">
                            {resultCounts.application}
                          </p>
                        </div>
                        <FileText className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {filteredResults.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 md:py-12">
                        <div className="text-center text-muted-foreground">
                          <Search className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 md:mb-3 opacity-50" />
                          <p className="text-base md:text-lg font-medium mb-1">
                            No results found
                          </p>
                          <p className="text-xs md:text-sm px-4">
                            Try searching with different keywords or check your
                            filters
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredResults.map((result) => (
                      <Link
                        to={result.link}
                        key={result.id}
                        state={{ highlightId: result.id, searchQuery }}
                      >
                        <Card className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50 mb-3 md:mb-4">
                          <CardContent className="p-2.5 md:p-4">
                            <div className="flex items-start gap-2 md:gap-3">
                              {result.type === "candidate" ||
                              result.type === "team" ? (
                                <Avatar className="h-10 w-10 md:h-12 md:w-12 shrink-0">
                                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs md:text-sm">
                                    {result.title
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                  {getTypeIcon(result.type)}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start flex-wrap gap-1.5 mb-1">
                                  <h4 className="font-semibold text-foreground text-sm md:text-base line-clamp-1 flex-1 min-w-0">
                                    {result.title}
                                  </h4>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] md:text-xs ${getTypeBadgeColor(
                                        result.type
                                      )}`}
                                    >
                                      {result.type}
                                    </Badge>
                                    <div className="flex items-center gap-0.5 md:gap-1">
                                      <TrendingUp className="h-2.5 w-2.5 md:h-3 md:w-3 text-muted-foreground" />
                                      <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                                        {Math.round(result.relevance)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1 line-clamp-1">
                                  {result.subtitle}
                                </p>
                                <p className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2 line-clamp-2">
                                  {result.description}
                                </p>
                                {result.matchedFields.length > 0 && (
                                  <p className="text-[10px] md:text-xs text-muted-foreground mb-1.5 md:mb-2 italic line-clamp-1">
                                    Matched in:{" "}
                                    {result.matchedFields.join(", ")}
                                  </p>
                                )}
                                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                                  {result.badges
                                    .slice(0, 4)
                                    .map((badge, index) => (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="text-[10px] md:text-xs"
                                      >
                                        {badge}
                                      </Badge>
                                    ))}
                                  {result.badges.length > 4 && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] md:text-xs"
                                    >
                                      +{result.badges.length - 4} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </div>
              </>
            )}

            {!searchQuery && recentSearches.length === 0 && (
              <Card>
                <CardContent className="py-12 md:py-16">
                  <div className="text-center text-muted-foreground">
                    <Search className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 opacity-50" />
                    <p className="text-base md:text-lg font-medium mb-2">
                      Start searching
                    </p>
                    <p className="text-xs md:text-sm max-w-md mx-auto px-4">
                      Type in the search box above to find jobs, candidates,
                      clients, applications, or team members
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

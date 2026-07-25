import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  CheckCircle,
  Star,
  GraduationCap,
  X,
  ChevronDown,
  Award,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { DataStore, Tutor } from "@/lib/data-store";

const languageOptions = [
  "Afrikaans",
  "Amharic",
  "Arabic",
  "Bengali",
  "Chinese (Cantonese)",
  "Chinese (Mandarin)",
  "Dutch",
  "English",
  "Filipino",
  "French",
  "German",
  "Greek",
  "Gujarati",
  "Hindi",
  "Indonesian",
  "Italian",
  "Japanese",
  "Korean",
  "Malay",
  "Malayalam",
  "Mandarin",
  "Marathi",
  "Persian",
  "Portuguese",
  "Punjabi",
  "Russian",
  "Spanish",
  "Swahili",
  "Tamil",
  "Telugu",
  "Thai",
  "Turkish",
  "Urdu",
  "Vietnamese",
].sort((a, b) => a.localeCompare(b));

export const Route = createFileRoute("/_public/find-a-tutor")({
  head: () => ({
    meta: [
      { title: "Find a Tutor · Alvey" },
      {
        name: "description",
        content:
          "Search and filter our elite marketplace to find your perfect, verified private academic tutor.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    level:
      typeof search.level === "string"
        ? search.level
        : undefined,

    subject:
      typeof search.subject === "string"
        ? search.subject
        : undefined,
  }),
  component: FindATutorPage,
});

function FindATutorPage() {
  const searchParams = useSearch({ from: "/_public/find-a-tutor" });
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [filteredTutors, setFilteredTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(searchParams.subject || "All");
  const [selectedLevel, setSelectedLevel] = useState(searchParams.level || "All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [levelOpen, setLevelOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    (async () => {
      const [tList, sList, lList] = await Promise.all([
        DataStore.getTutors(),
        DataStore.getSubjects(),
        DataStore.getLevels(),
      ]);
      setTutors(tList);
      setSubjects(sList);
      setLevels(lList);
    })();
  }, []);

  useEffect(() => {
    if (searchParams.level) setSelectedLevel(searchParams.level);
    if (searchParams.subject) setSelectedSubject(searchParams.subject);
  }, [searchParams]);

  useEffect(() => {
    let result = [...tutors];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.headline.toLowerCase().includes(q) ||
          t.about.toLowerCase().includes(q) ||
          t.subjects.some((s) => s.toLowerCase().includes(q)),
      );
    }

    if (selectedSubject !== "All") {
      result = result.filter((t) => t.subjects.includes(selectedSubject));
    }

    if (selectedLevel !== "All") {
      result = result.filter((t) => t.levels.includes(selectedLevel));
    }

    if (selectedLanguage !== "All") {
      const selected = selectedLanguage.toLowerCase();
      result = result.filter((t) =>
        t.languages.some((language) => language.toLowerCase() === selected),
      );
    }

    result = result.filter((t) => t.hourly_rate <= maxPrice);

    if (onlyVerified) {
      result = result.filter((t) => t.is_verified);
    }

    if (sortBy === "highest_rated") {
      result.sort((a, b) => b.rating_avg - a.rating_avg);
    } else if (sortBy === "lowest_price") {
      result.sort((a, b) => a.hourly_rate - b.hourly_rate);
    } else if (sortBy === "highest_price") {
      result.sort((a, b) => b.hourly_rate - a.hourly_rate);
    } else if (sortBy === "experience") {
      result.sort((a, b) => b.years_experience - a.years_experience);
    } else if (sortBy === "alphabetical") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    setFilteredTutors(result);
  }, [
    tutors,
    searchQuery,
    selectedSubject,
    selectedLevel,
    selectedLanguage,
    maxPrice,
    onlyVerified,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSubject("All");
    setSelectedLevel("All");
    setSelectedLanguage("All");
    setMaxPrice(100);
    setOnlyVerified(false);
    setSortBy("featured");
  };

  return (
    <>
      {/* Hero Header */}
      <section className="bg-slate-50 dark:bg-slate-900/10 py-12 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 text-center md:text-left md:flex md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">Find the Right Tutor</h1>
            <p className="text-muted-foreground text-sm max-w-xl">
              Filter through our elite collection of fully-vetted PhD scholars, university teachers,
              and curriculum specialists.
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-3 md:pt-0">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="text-xs h-9 rounded-xl border-border"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </section>

      {/* Main Grid content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Filters Panel Left */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-slate-50/50 dark:bg-slate-900/10 p-5 rounded-2xl border border-border/80 space-y-6">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-blue-600" /> Filters
            </h3>

            {/* Subject Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Subject
              </label>
              <Popover open={subjectOpen} onOpenChange={setSubjectOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={subjectOpen}
                    className="w-full justify-between rounded-xl font-normal"
                  >
                    {selectedSubject === "All" ? "All Subjects" : selectedSubject}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search subjects..." />
                    <CommandList>
                      <CommandEmpty>No subject found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Subjects"
                          onSelect={() => {
                            setSelectedSubject("All");
                            setSubjectOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedSubject === "All" ? "opacity-100" : "opacity-0",
                            )}
                          />
                          All Subjects
                        </CommandItem>
                        {subjects.map((sub) => (
                          <CommandItem
                            key={sub}
                            value={sub}
                            onSelect={() => {
                              setSelectedSubject(sub);
                              setSubjectOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSubject === sub ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {sub}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Academic Level Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Academic Level
              </label>
              <Popover open={levelOpen} onOpenChange={setLevelOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={levelOpen}
                    className="w-full justify-between rounded-xl font-normal"
                  >
                    {selectedLevel === "All" ? "All Levels" : selectedLevel}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search levels..." />
                    <CommandList>
                      <CommandEmpty>No level found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Levels"
                          onSelect={() => {
                            setSelectedLevel("All");
                            setLevelOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedLevel === "All" ? "opacity-100" : "opacity-0",
                            )}
                          />
                          All Levels
                        </CommandItem>
                        {levels.map((lvl) => (
                          <CommandItem
                            key={lvl}
                            value={lvl}
                            onSelect={() => {
                              setSelectedLevel(lvl);
                              setLevelOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedLevel === lvl ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {lvl}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tutor Language
              </label>
              <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={languageOpen}
                    className="w-full justify-between rounded-xl font-normal"
                  >
                    {selectedLanguage === "All" ? "All Languages" : selectedLanguage}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search languages..." />
                    <CommandList>
                      <CommandEmpty>No language found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Languages"
                          onSelect={() => {
                            setSelectedLanguage("All");
                            setLanguageOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedLanguage === "All" ? "opacity-100" : "opacity-0",
                            )}
                          />
                          All Languages
                        </CommandItem>
                        {languageOptions.map((language) => (
                          <CommandItem
                            key={language}
                            value={language}
                            onSelect={() => {
                              setSelectedLanguage(language);
                              setLanguageOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedLanguage === language ? "opacity-100" : "opacity-0",
                              )}
                            />
                            {language}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Pricing Slider */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground uppercase tracking-wider">
                  Max Hourly Rate
                </span>
                <span className="text-blue-600">${maxPrice}/hr</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Checkbox verification status */}
            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="onlyVerifiedCheck"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="h-4.5 w-4.5 text-blue-600 rounded-md border-border cursor-pointer focus:ring-blue-500/20"
              />
              <label
                htmlFor="onlyVerifiedCheck"
                className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Verified Tutors Only
              </label>
            </div>
          </div>
        </aside>

        {/* Search Results Right */}
        <main className="lg:col-span-9 space-y-6">
          {/* Search Inputs & Sort */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tutor names, keywords, or bio..."
                className="pl-10 h-10 bg-slate-50/50 focus-visible:ring-blue-500 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <span className="text-xs text-muted-foreground uppercase font-semibold whitespace-nowrap">
                Sort by
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto"
              >
                <option value="featured">Featured First</option>
                <option value="highest_rated">Highest Rated</option>
                <option value="lowest_price">Lowest Price</option>
                <option value="highest_price">Highest Price</option>
                <option value="experience">Years Experience</option>
                <option value="alphabetical">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Active Applied Filters Badges row */}
          {(selectedSubject !== "All" ||
            selectedLevel !== "All" ||
            selectedLanguage !== "All" ||
            onlyVerified ||
            searchQuery !== "") && (
              <div className="flex flex-wrap items-center gap-1.5 bg-blue-50/30 dark:bg-blue-950/10 p-3 rounded-xl border border-blue-100/30">
                <span className="text-xs text-muted-foreground font-medium mr-1.5">
                  Active filters:
                </span>
                {searchQuery !== "" && (
                  <Badge variant="secondary" className="gap-1 rounded-md px-2 py-0.5">
                    Search: "{searchQuery}"
                    <X
                      className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {selectedSubject !== "All" && (
                  <Badge variant="secondary" className="gap-1 rounded-md px-2 py-0.5">
                    Subject: {selectedSubject}
                    <X
                      className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedSubject("All")}
                    />
                  </Badge>
                )}
                {selectedLevel !== "All" && (
                  <Badge variant="secondary" className="gap-1 rounded-md px-2 py-0.5">
                    Level: {selectedLevel}
                    <X
                      className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedLevel("All")}
                    />
                  </Badge>
                )}
                {selectedLanguage !== "All" && (
                  <Badge variant="secondary" className="gap-1 rounded-md px-2 py-0.5">
                    Language: {selectedLanguage}
                    <X
                      className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={() => setSelectedLanguage("All")}
                    />
                  </Badge>
                )}
                {onlyVerified && (
                  <Badge variant="secondary" className="gap-1 rounded-md px-2 py-0.5">
                    Verified Only
                    <X
                      className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground"
                      onClick={() => setOnlyVerified(false)}
                    />
                  </Badge>
                )}
              </div>
            )}

          {/* Tutors Grid Results */}
          {filteredTutors.length === 0 ? (
            <div className="text-center py-20 bg-slate-50/40 border border-dashed border-border rounded-2xl space-y-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg">No Tutors Match Your Criteria</h4>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Try broadening your pricing scale, selecting "All Subjects", or resetting filters.
                </p>
              </div>
              <Button
                onClick={handleResetFilters}
                variant="outline"
                className="text-xs h-9 rounded-xl"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTutors.map((tutor) => (
                <Card
                  key={tutor.id}
                  className="rounded-2xl overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-200 flex flex-col h-full bg-background border border-border/80"
                >
                  <CardHeader className="flex flex-row gap-4 items-start p-5">
                    <img
                      src={tutor.avatar_url}
                      alt={tutor.name}
                      className="h-14 w-14 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-800"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">
                          {tutor.name}
                        </CardTitle>
                        {tutor.is_verified && (
                          <CheckCircle
                            className="h-4 w-4 text-blue-600 fill-blue-50 shrink-0"
                          />
                        )}
                        {tutor.is_featured && (
                          <Award
                            className="h-4 w-4 text-amber-500 shrink-0"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        <span>{tutor.rating_avg.toFixed(2)}</span>
                        <span className="text-muted-foreground font-normal">
                          ({tutor.rating_count} reviews)
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-0 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                        {tutor.headline}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {tutor.about}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex flex-wrap gap-1">
                        {tutor.subjects.map((sub) => (
                          <Badge
                            key={sub}
                            variant="secondary"
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                          >
                            {sub}
                          </Badge>
                        ))}
                        {tutor.levels.map((lvl) => (
                          <Badge
                            key={lvl}
                            variant="outline"
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                          >
                            {lvl}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-800/60 pt-3">
                        <span className="text-muted-foreground">
                          Languages: {tutor.languages.join(", ")}
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                          ${tutor.hourly_rate}/hr
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border-t border-border/40 grid grid-cols-2 gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs font-medium rounded-lg"
                    >
                      <Link to="/tutors/$tutorId" params={{ tutorId: tutor.id }}>
                        View Profile
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                    >
                      <Link to="/contact" search={{ tutorId: tutor.id }}>
                        Contact & Book
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

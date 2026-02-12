import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  BookOpen,
  Users,
  Star,
  Filter,
  ArrowUpDown,
  Loader2,
  Zap,
} from "lucide-react";

type SortOption = "popular" | "newest" | "price-low" | "price-high" | "title";
type PriceFilter = "all" | "free" | "paid";

interface CourseWithMeta {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  price: number | null;
  is_practical: boolean | null;
  created_at: string | null;
  instructor_id: string;
  instructor: { full_name: string | null } | null;
  enrollment_count: number;
}

export default function Courses() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "video" | "practical">("all");

  // Fetch published courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ["discover-courses"],
    queryFn: async () => {
      const { data: coursesData, error } = await supabase
        .from("courses")
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(full_name)
        `)
        .eq("is_published", true);

      if (error) throw error;

      // Fetch enrollment counts
      const { data: enrollmentCounts } = await supabase
        .from("enrollments")
        .select("course_id");

      const countMap: Record<string, number> = {};
      enrollmentCounts?.forEach((e) => {
        countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
      });

      return (coursesData || []).map((c) => ({
        ...c,
        enrollment_count: countMap[c.id] || 0,
      })) as CourseWithMeta[];
    },
  });

  // Fetch user's enrollments
  const { data: myEnrollments } = useQuery({
    queryKey: ["my-enrollments", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", profile.id);
      return data?.map((e) => e.course_id) || [];
    },
    enabled: !!profile?.id,
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!profile?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("enrollments")
        .insert({ course_id: courseId, user_id: profile.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["discover-courses"] });
      toast.success("Enrolled successfully!");
    },
    onError: () => toast.error("Failed to enroll"),
  });

  // Filter and sort
  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    let result = [...courses];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.instructor?.full_name?.toLowerCase().includes(q)
      );
    }

    // Price filter
    if (priceFilter === "free") result = result.filter((c) => !c.price || c.price === 0);
    if (priceFilter === "paid") result = result.filter((c) => c.price && c.price > 0);

    // Type filter
    if (typeFilter === "practical") result = result.filter((c) => c.is_practical);
    if (typeFilter === "video") result = result.filter((c) => !c.is_practical);

    // Sort
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => b.enrollment_count - a.enrollment_count);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case "price-low":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [courses, searchQuery, sortBy, priceFilter, typeFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container px-4">
          {/* Hero */}
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Discover <span className="text-sprint">Courses</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Learn from expert instructors. Find the perfect course to accelerate your career.
            </p>
          </motion.div>

          {/* Search & Filters */}
          <motion.div
            className="bg-card border border-border rounded-xl p-4 mb-8 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search courses, topics, or instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 text-base"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>

              <Select value={priceFilter} onValueChange={(v) => setPriceFilter(v as PriceFilter)}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "video" | "practical")}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="video">Video Courses</SelectItem>
                  <SelectItem value="practical">Practical</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low → High</SelectItem>
                    <SelectItem value="price-high">Price: High → Low</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-4">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} found
          </p>

          {/* Course Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-sprint" />
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course, i) => {
                const isEnrolled = myEnrollments?.includes(course.id);

                return (
                  <motion.div
                    key={course.id}
                    className="bg-card border border-border rounded-xl overflow-hidden card-hover group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="relative aspect-video">
                      <img
                        src={course.thumbnail_url || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop"}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {course.is_practical && (
                        <span className="absolute top-3 left-3 px-2 py-1 rounded-full bg-sprint text-sprint-foreground text-xs font-medium">
                          Practical
                        </span>
                      )}
                      <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-white text-xs">
                        <Users className="w-3 h-3" />
                        {course.enrollment_count}
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-card-foreground line-clamp-1 group-hover:text-sprint transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {course.description || "No description available"}
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        by {course.instructor?.full_name || "Instructor"}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-lg font-bold text-foreground">
                          {!course.price || course.price === 0 ? (
                            <span className="text-success">Free</span>
                          ) : (
                            `$${course.price}`
                          )}
                        </span>

                        {isEnrolled ? (
                          <Link to={`/course/${course.id}`}>
                            <Button size="sm" variant="outline">
                              Continue
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="sm"
                            variant="sprint"
                            onClick={() => enrollMutation.mutate(course.id)}
                            disabled={enrollMutation.isPending || !profile}
                          >
                            {enrollMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Zap className="w-4 h-4" /> Enroll
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted rounded-xl">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No courses found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

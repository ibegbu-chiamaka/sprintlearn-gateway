import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users, Star, Clock } from "lucide-react";

type Course = {
  id: string;
  title: string;
  instructor: string;
  category: string;
  price: number;
  rating: number;
  students: number;
  hours: number;
  thumbnail: string;
};

const allCourses: Course[] = [
  {
    id: "1",
    title: "Complete React Developer Course",
    instructor: "Sarah Chen",
    category: "Frontend",
    price: 49,
    rating: 4.8,
    students: 1234,
    hours: 18,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=340&fit=crop",
  },
  {
    id: "2",
    title: "TypeScript Masterclass",
    instructor: "Marcus Lee",
    category: "Languages",
    price: 39,
    rating: 4.7,
    students: 856,
    hours: 12,
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&h=340&fit=crop",
  },
  {
    id: "3",
    title: "Advanced Node.js Patterns",
    instructor: "Priya Shah",
    category: "Backend",
    price: 59,
    rating: 4.9,
    students: 420,
    hours: 14,
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=340&fit=crop",
  },
  {
    id: "4",
    title: "Design Systems with Tailwind",
    instructor: "Jordan Reyes",
    category: "Design",
    price: 0,
    rating: 4.6,
    students: 2100,
    hours: 6,
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=600&h=340&fit=crop",
  },
  {
    id: "5",
    title: "SQL for Product Engineers",
    instructor: "Elena Park",
    category: "Data",
    price: 29,
    rating: 4.5,
    students: 678,
    hours: 8,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=340&fit=crop",
  },
  {
    id: "6",
    title: "Practical Prompt Engineering",
    instructor: "Aiden Brooks",
    category: "AI",
    price: 0,
    rating: 4.4,
    students: 3400,
    hours: 4,
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=340&fit=crop",
  },
];

export default function Courses() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"popular" | "rating" | "price-asc" | "price-desc">("popular");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(allCourses.map((c) => c.category)))],
    [],
  );

  const filtered = useMemo(() => {
    let list = allCourses.filter((c) => {
      const matchesQuery =
        !query ||
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.instructor.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || c.category === category;
      return matchesQuery && matchesCategory;
    });

    switch (sort) {
      case "rating":
        list = list.sort((a, b) => b.rating - a.rating);
        break;
      case "price-asc":
        list = list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list = list.sort((a, b) => b.price - a.price);
        break;
      default:
        list = list.sort((a, b) => b.students - a.students);
    }
    return list;
  }, [query, category, sort]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4">
          <div className="max-w-2xl mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
              Browse Courses
            </h1>
            <p className="text-lg text-muted-foreground">
              Find your next sprint. Filter by category, sort by popularity, and jump in.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses or instructors..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All categories" : c}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="popular">Most popular</option>
              <option value="rating">Highest rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
              No courses match your filters. Try a different search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c) => (
                <article
                  key={c.id}
                  className="bg-card border border-border rounded-xl overflow-hidden flex flex-col card-hover"
                >
                  <div className="relative aspect-video">
                    <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-background/90 text-xs font-medium">
                      {c.category}
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-background/90 text-xs font-semibold">
                      {c.price === 0 ? "Free" : `$${c.price}`}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-card-foreground mb-1 line-clamp-2">
                      {c.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">by {c.instructor}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-warning text-warning" /> {c.rating}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {c.students.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {c.hours}h
                      </span>
                    </div>
                    <Link to="/auth?mode=signup" className="mt-auto">
                      <Button variant="sprint" className="w-full">
                        {c.price === 0 ? "Enroll free" : "Enroll"}
                      </Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

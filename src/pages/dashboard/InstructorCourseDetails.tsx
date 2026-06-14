import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, DollarSign, BookOpen, Edit, Eye } from "lucide-react";

const courses = [
  {
    id: "1",
    title: "Complete React Developer Course",
    students: 1234,
    revenue: 4520.5,
    status: "published",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=400&fit=crop",
    description: "Master React from fundamentals to advanced patterns with real-world projects.",
  },
  {
    id: "2",
    title: "TypeScript Masterclass",
    students: 856,
    revenue: 2890,
    status: "published",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=400&fit=crop",
    description: "Become a TypeScript expert and write safer, more maintainable code.",
  },
  {
    id: "3",
    title: "Advanced Node.js Patterns",
    students: 0,
    revenue: 0,
    status: "draft",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=400&fit=crop",
    description: "Deep dive into scalable Node.js architecture patterns and best practices.",
  },
];

export default function InstructorCourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Course not found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find the course you're looking for.
          </p>
          <Button onClick={() => navigate("/dashboard/instructor")}>Back to dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        <Link
          to="/dashboard/instructor"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="relative aspect-[3/1]">
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            <div
              className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
                course.status === "published"
                  ? "bg-success text-success-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {course.status === "published" ? "Published" : "Draft"}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">{course.title}</h1>
                <p className="text-muted-foreground max-w-2xl">{course.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" /> Preview
                </Button>
                <Button variant="sprint" size="sm">
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-muted/40 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{course.students.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
              </div>
              <div className="bg-muted/40 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-lg font-semibold">${course.revenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
              <div className="bg-muted/40 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sprint/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-sprint" />
                </div>
                <div>
                  <p className="text-lg font-semibold capitalize">{course.status}</p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

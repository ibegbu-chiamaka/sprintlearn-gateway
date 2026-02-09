import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, DollarSign, BookOpen } from "lucide-react";

interface EnrollmentTrend {
  date: string;
  enrollments: number;
}

interface RevenueTrend {
  date: string;
  revenue: number;
}

interface PopularCourse {
  name: string;
  enrollments: number;
  revenue: number;
}

const CHART_COLORS = [
  "hsl(var(--sprint))",
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

export default function AnalyticsCharts() {
  // Fetch enrollment trends (last 30 days)
  const { data: enrollmentTrends } = useQuery({
    queryKey: ["enrollment-trends"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("enrollments")
        .select("enrolled_at")
        .gte("enrolled_at", thirtyDaysAgo.toISOString())
        .order("enrolled_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const grouped = (data || []).reduce((acc: Record<string, number>, enrollment) => {
        const date = new Date(enrollment.enrolled_at!).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      // Fill in missing dates
      const trends: EnrollmentTrend[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        trends.push({
          date: dateStr,
          enrollments: grouped[dateStr] || 0,
        });
      }

      return trends;
    },
  });

  // Fetch revenue trends (last 30 days)
  const { data: revenueTrends } = useQuery({
    queryKey: ["revenue-trends"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("instructor_revenue")
        .select("amount, created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Group by date
      const grouped = (data || []).reduce((acc: Record<string, number>, rev) => {
        const date = new Date(rev.created_at!).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        acc[date] = (acc[date] || 0) + Number(rev.amount);
        return acc;
      }, {});

      // Fill in missing dates
      const trends: RevenueTrend[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        trends.push({
          date: dateStr,
          revenue: grouped[dateStr] || 0,
        });
      }

      return trends;
    },
  });

  // Fetch popular courses (top 5)
  const { data: popularCourses } = useQuery({
    queryKey: ["popular-courses"],
    queryFn: async () => {
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id, title, price")
        .eq("is_published", true);

      if (coursesError) throw coursesError;

      // Get enrollment counts for each course
      const coursesWithStats = await Promise.all(
        (courses || []).map(async (course) => {
          const { count } = await supabase
            .from("enrollments")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id);

          return {
            name: course.title.length > 20 ? course.title.slice(0, 20) + "..." : course.title,
            enrollments: count || 0,
            revenue: (count || 0) * Number(course.price || 0),
          };
        })
      );

      // Sort by enrollments and take top 5
      return coursesWithStats
        .sort((a, b) => b.enrollments - a.enrollments)
        .slice(0, 5) as PopularCourse[];
    },
  });

  const chartConfig = {
    enrollments: {
      label: "Enrollments",
      color: "hsl(var(--sprint))",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--success))",
    },
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <h2 className="text-xl font-bold text-foreground">Analytics Overview</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollment Trends Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-sprint/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-sprint" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Enrollment Trends</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart data={enrollmentTrends || []}>
              <defs>
                <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--sprint))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--sprint))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="enrollments"
                stroke="hsl(var(--sprint))"
                strokeWidth={2}
                fill="url(#enrollmentGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Revenue Trends Chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground">Revenue Over Time</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart data={revenueTrends || []}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
                className="text-muted-foreground"
              />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value) => [`$${value}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>

      {/* Popular Courses Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">Popular Courses</h3>
            <p className="text-xs text-muted-foreground">Top 5 by enrollments</p>
          </div>
        </div>

        {popularCourses && popularCourses.length > 0 ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={popularCourses} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="enrollments"
                  fill="hsl(var(--sprint))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>

            {/* Pie Chart for Revenue Distribution */}
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={popularCourses}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => 
                    `${name.slice(0, 10)}... ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {popularCourses.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value) => [`$${value}`, "Revenue"]}
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No course data available yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { BookOpen, Video, Award, Users, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Structured Learning Paths",
    description: "Follow expert-designed curricula that guide you from beginner to mastery.",
    color: "bg-sprint/10 text-sprint"
  },
  {
    icon: Video,
    title: "HD Video Lessons",
    description: "Learn from high-quality video content created by industry professionals.",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: Award,
    title: "Verified Certificates",
    description: "Earn industry-recognized certificates upon course completion.",
    color: "bg-success/10 text-success"
  },
  {
    icon: Users,
    title: "Expert Instructors",
    description: "Learn from verified experts with real-world experience.",
    color: "bg-sprint/10 text-sprint"
  },
  {
    icon: Zap,
    title: "Sprint Learning",
    description: "Accelerated courses designed for efficient skill acquisition.",
    color: "bg-warning/10 text-warning"
  },
  {
    icon: Shield,
    title: "Guaranteed Progress",
    description: "Gated content ensures mastery before moving forward.",
    color: "bg-primary/10 text-primary"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

export function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need to{" "}
            <span className="text-gradient-sprint">Succeed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform is designed to maximize your learning potential with 
            industry-leading features and tools.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="group p-6 rounded-2xl bg-card border border-border shadow-card card-hover"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

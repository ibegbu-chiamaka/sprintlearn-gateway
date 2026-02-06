import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-sprint/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-sprint/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {/* Badge */}
          <motion.div 
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sprint/20 border border-sprint/30 text-sprint-foreground mb-6"
          >
            <Sparkles className="w-4 h-4 text-sprint" />
            <span className="text-sm font-medium">Learn at Your Own Pace</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={fadeInUp}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight"
          >
            Master New Skills in{" "}
            <span className="text-gradient-sprint">Record Time</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            variants={fadeInUp}
            className="text-lg sm:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Join thousands of learners sprinting through expert-led courses. 
            Structured learning paths, hands-on projects, and industry-recognized certificates.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl" className="group">
                Start Learning Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/auth?mode=signup&role=instructor">
              <Button variant="heroOutline" size="xl" className="group">
                <Play className="w-5 h-5" />
                Become an Instructor
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div 
            variants={fadeInUp}
            className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {[
              { value: "50K+", label: "Active Learners" },
              { value: "500+", label: "Expert Courses" },
              { value: "95%", label: "Completion Rate" }
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-sprint mb-1">{stat.value}</div>
                <div className="text-sm text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path 
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
}

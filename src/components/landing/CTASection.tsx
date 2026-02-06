import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-navy relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-96 h-96 bg-sprint/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-sprint/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container px-4 relative z-10">
        <motion.div 
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sprint/20 border border-sprint/30 mb-6"
          >
            <Sparkles className="w-4 h-4 text-sprint" />
            <span className="text-sm font-medium text-primary-foreground">Join 50,000+ Learners</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Start Your{" "}
            <span className="text-gradient-sprint">Learning Sprint</span>?
          </h2>
          
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who are accelerating their careers with SkillSprint. 
            Start learning today – no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl" className="group">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/courses">
              <Button variant="heroOutline" size="xl">
                Browse Courses
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

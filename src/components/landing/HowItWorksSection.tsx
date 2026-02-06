import { motion } from "framer-motion";
import { GraduationCap, Upload, CheckCircle, Award, BookOpen, Users, DollarSign, BadgeCheck } from "lucide-react";

const studentSteps = [
  {
    icon: BookOpen,
    title: "Browse & Enroll",
    description: "Explore our marketplace and find courses that match your goals."
  },
  {
    icon: GraduationCap,
    title: "Learn & Progress",
    description: "Complete video lessons and quizzes to unlock new modules."
  },
  {
    icon: Upload,
    title: "Submit Projects",
    description: "Apply your skills with hands-on practical assignments."
  },
  {
    icon: Award,
    title: "Get Certified",
    description: "Earn your certificate and showcase your new skills."
  }
];

const instructorSteps = [
  {
    icon: Users,
    title: "Create Your Profile",
    description: "Sign up as an instructor and build your expert profile."
  },
  {
    icon: BookOpen,
    title: "Build Courses",
    description: "Use our intuitive course builder to create engaging content."
  },
  {
    icon: BadgeCheck,
    title: "Get Verified",
    description: "Earn the Verified Expert badge to boost credibility."
  },
  {
    icon: DollarSign,
    title: "Earn Revenue",
    description: "Get paid for every student who enrolls in your courses."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5 }
  }
};

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-secondary/30">
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
            How <span className="text-gradient-sprint">SkillSprint</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you want to learn or teach, we've made the process simple and rewarding.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* For Students */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-sprint/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-sprint" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">For Students</h3>
            </div>

            <motion.div
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {studentSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={itemVariants}
                  className="flex gap-4 items-start"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-sprint" />
                    </div>
                    {index < studentSteps.length - 1 && (
                      <div className="absolute top-12 left-1/2 w-0.5 h-6 bg-border -translate-x-1/2" />
                    )}
                  </div>
                  <div className="pt-1">
                    <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* For Instructors */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">For Instructors</h3>
            </div>

            <motion.div
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {instructorSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  variants={itemVariants}
                  className="flex gap-4 items-start"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    {index < instructorSteps.length - 1 && (
                      <div className="absolute top-12 left-1/2 w-0.5 h-6 bg-border -translate-x-1/2" />
                    )}
                  </div>
                  <div className="pt-1">
                    <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Download, 
  Award,
  Loader2
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  instructor: {
    full_name: string | null;
  };
}

interface CertificateGeneratorProps {
  course: Course;
  onClose: () => void;
}

export default function CertificateGenerator({ course, onClose }: CertificateGeneratorProps) {
  const { profile } = useAuth();
  const [generating, setGenerating] = useState(false);

  const generateCertificate = async () => {
    setGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      // Background
      doc.setFillColor(0, 31, 63); // Deep Navy
      doc.rect(0, 0, width, height, "F");

      // Border
      doc.setDrawColor(255, 133, 27); // Electric Orange
      doc.setLineWidth(3);
      doc.rect(10, 10, width - 20, height - 20);

      // Inner border
      doc.setLineWidth(0.5);
      doc.rect(15, 15, width - 30, height - 30);

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(36);
      doc.setTextColor(255, 133, 27);
      doc.text("CERTIFICATE", width / 2, 45, { align: "center" });

      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("OF COMPLETION", width / 2, 58, { align: "center" });

      // Decorative line
      doc.setDrawColor(255, 133, 27);
      doc.setLineWidth(1);
      doc.line(width / 2 - 50, 68, width / 2 + 50, 68);

      // "This certifies that"
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(200, 200, 200);
      doc.text("This certifies that", width / 2, 85, { align: "center" });

      // Student name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.setTextColor(255, 255, 255);
      doc.text(profile?.full_name || "Student", width / 2, 105, { align: "center" });

      // "has successfully completed"
      doc.setFont("helvetica", "normal");
      doc.setFontSize(14);
      doc.setTextColor(200, 200, 200);
      doc.text("has successfully completed the course", width / 2, 122, { align: "center" });

      // Course title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(255, 133, 27);
      doc.text(course.title, width / 2, 140, { align: "center" });

      // Instructor
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(200, 200, 200);
      doc.text(`Instructor: ${course.instructor.full_name || "SkillSprint Instructor"}`, width / 2, 155, { align: "center" });

      // Date
      const completionDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      doc.text(`Completion Date: ${completionDate}`, width / 2, 165, { align: "center" });

      // SkillSprint logo/text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("Skill", width / 2 - 15, 185, { align: "center" });
      doc.setTextColor(255, 133, 27);
      doc.text("Sprint", width / 2 + 15, 185, { align: "center" });

      // Certificate ID
      const certId = `CERT-${Date.now().toString(36).toUpperCase()}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Certificate ID: ${certId}`, width - 20, height - 15, { align: "right" });

      // Save
      doc.save(`SkillSprint-Certificate-${course.title.replace(/\s+/g, "-")}.pdf`);
    } catch (error) {
      console.error("Failed to generate certificate:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-2xl shadow-elegant w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-card-foreground">Course Completed! 🎉</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-24 h-24 rounded-full bg-gradient-sprint mx-auto mb-6 flex items-center justify-center glow-sprint-lg"
          >
            <Award className="w-12 h-12 text-sprint-foreground" />
          </motion.div>

          <h3 className="text-2xl font-bold text-card-foreground mb-2">
            Congratulations, {profile?.full_name?.split(" ")[0] || "Student"}!
          </h3>

          <p className="text-muted-foreground mb-6">
            You've successfully completed <strong className="text-foreground">{course.title}</strong>. 
            Download your certificate to showcase your achievement!
          </p>

          {/* Certificate Preview */}
          <div className="bg-primary rounded-xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-16 h-16 border-2 border-sprint rounded-full" />
              <div className="absolute bottom-4 right-4 w-24 h-24 border-2 border-sprint rounded-full" />
            </div>
            <p className="text-primary-foreground/60 text-sm mb-2">Certificate of Completion</p>
            <p className="text-primary-foreground font-bold text-lg">{profile?.full_name}</p>
            <p className="text-sprint text-sm mt-1">{course.title}</p>
          </div>

          <Button
            variant="sprint"
            size="lg"
            onClick={generateCertificate}
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download Certificate (PDF)
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

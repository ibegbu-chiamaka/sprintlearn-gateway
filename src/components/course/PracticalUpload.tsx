import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  File, 
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2,
  FileText,
  Download
} from "lucide-react";
import { toast } from "sonner";

interface PracticalUploadProps {
  courseId: string;
}

export default function PracticalUpload({ courseId }: PracticalUploadProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch existing submission
  const { data: submission } = useQuery({
    queryKey: ["practical-submission", courseId, profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;

      const { data, error } = await supabase
        .from("practical_submissions")
        .select("*")
        .eq("course_id", courseId)
        .eq("student_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!profile?.id) throw new Error("Not authenticated");

      setUploading(true);

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}/${courseId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("practical-submissions")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("practical-submissions")
        .getPublicUrl(fileName);

      // Create submission record
      const { error: insertError } = await supabase
        .from("practical_submissions")
        .upsert({
          course_id: courseId,
          student_id: profile.id,
          file_url: urlData.publicUrl,
          file_name: file.name,
          status: "pending"
        }, {
          onConflict: "student_id,course_id"
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practical-submission"] });
      setSelectedFile(null);
      toast.success("Project submitted successfully!");
    },
    onError: (error) => {
      toast.error("Failed to submit project");
      console.error(error);
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getStatusBadge = () => {
    if (!submission) return null;

    switch (submission.status) {
      case "pending":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Pending Review</span>
          </div>
        );
      case "pass":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Passed</span>
          </div>
        );
      case "fail":
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Needs Revision</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 p-6 bg-card border border-border rounded-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sprint/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-sprint" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">Practical Project</h3>
            <p className="text-sm text-muted-foreground">
              Submit your final project for review
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {submission ? (
        <div className="space-y-4">
          {/* Existing submission */}
          <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-card-foreground">{submission.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(submission.submitted_at!).toLocaleDateString()}
                </p>
              </div>
            </div>
            <a
              href={submission.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sprint hover:underline flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>

          {/* Feedback */}
          {submission.feedback && (
            <div className={`p-4 rounded-lg ${
              submission.status === "pass" ? "bg-success/10" : "bg-destructive/10"
            }`}>
              <p className="text-sm font-medium mb-1">Instructor Feedback:</p>
              <p className="text-sm text-muted-foreground">{submission.feedback}</p>
            </div>
          )}

          {/* Resubmit option if failed */}
          {submission.status === "fail" && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Your submission needs revision. Please upload an updated version.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload New Version
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-sprint/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".zip,.rar,.pdf,.doc,.docx"
            />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-card-foreground font-medium">
              Click to upload your project
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              ZIP, RAR, PDF, DOC up to 50MB
            </p>
          </div>

          {/* Selected file preview */}
          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <File className="w-8 h-8 text-sprint" />
                <div>
                  <p className="font-medium text-card-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="sprint"
                onClick={handleSubmit}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Project
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

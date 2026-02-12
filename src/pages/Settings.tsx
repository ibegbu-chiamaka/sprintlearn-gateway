import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Zap,
  User,
  Bell,
  Shield,
  ArrowLeft,
  Save,
  Loader2,
  Camera,
} from "lucide-react";

export default function Settings() {
  const { user, profile, signOut } = useAuth();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

  // Notification preferences (stored locally for now)
  const [emailEnrollment, setEmailEnrollment] = useState(true);
  const [emailCourseUpdates, setEmailCourseUpdates] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [emailVerification, setEmailVerification] = useState(true);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error("No profile");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl.trim() || null,
        })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Password updated successfully"),
    onError: (err: Error) => toast.error(err.message),
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    updatePasswordMutation.mutate(newPassword);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container px-4">
          <div className="flex items-center h-16 gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-sprint flex items-center justify-center">
                <Zap className="w-5 h-5 text-sprint-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Skill<span className="text-sprint">Sprint</span>
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-3">
              <Link to={profile?.role === "instructor" ? "/dashboard/instructor" : "/dashboard/student"}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-3xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground mb-8">Manage your account and preferences</p>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" /> Notifications
              </TabsTrigger>
              <TabsTrigger value="account" className="gap-2">
                <Shield className="w-4 h-4" /> Account
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-sprint flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5 text-sprint-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{profile?.full_name || "User"}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-sprint/10 text-sprint capitalize">
                      {profile?.role || "student"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>

                <Button
                  variant="sprint"
                  onClick={() => updateProfileMutation.mutate()}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Email Notifications</h3>
                <div className="space-y-4">
                  {[
                    { label: "Course Enrollment", desc: "Get notified when you enroll in a new course", value: emailEnrollment, set: setEmailEnrollment },
                    { label: "Course Updates", desc: "Receive updates about courses you're enrolled in", value: emailCourseUpdates, set: setEmailCourseUpdates },
                    { label: "Verification Status", desc: "Get notified about verification request updates", value: emailVerification, set: setEmailVerification },
                    { label: "Marketing & Promotions", desc: "Receive promotional emails and special offers", value: emailMarketing, set: setEmailMarketing },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch checked={item.value} onCheckedChange={item.set} />
                    </div>
                  ))}
                </div>
                <Button variant="sprint" onClick={() => toast.success("Notification preferences saved")}>
                  <Save className="w-4 h-4 mr-2" /> Save Preferences
                </Button>
              </div>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account">
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" />
                  </div>
                  <Button
                    variant="sprint"
                    onClick={handlePasswordChange}
                    disabled={updatePasswordMutation.isPending}
                  >
                    {updatePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </div>

                <div className="bg-card border border-destructive/30 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Signing out will end your current session.
                  </p>
                  <Button variant="destructive" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

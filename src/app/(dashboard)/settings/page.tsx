"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { authApi, User } from "@/lib/api/auth";
import {
  User as UserIcon, Shield, Bell, Cpu,
  CheckCircle2, AlertCircle, Loader2, Save, KeyRound
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notification Toggles
  const [notifRisks, setNotifRisks] = useState(true);
  const [notifReports, setNotifReports] = useState(true);
  const [notifDigest, setNotifDigest] = useState(false);

  useEffect(() => {
    const u = authApi.getCurrentUser();
    if (u) {
      setUser(u);
      setFullName(u.full_name);
    } else {
      authApi.getMe().then((res) => {
        setUser(res);
        setFullName(res.full_name);
      }).catch(() => {});
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const updated = await authApi.updateProfile(fullName);
      setUser(updated);
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account preferences, security credentials, and system settings."
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-[600px]">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" /> AI Engine
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                Update your personal information and see your organizational role.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-4">
                {profileMsg && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                    {profileMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input
                    id="fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="max-w-md"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Registered Email Address</Label>
                  <Input
                    id="email"
                    value={user?.email || "admin@compli.ai"}
                    disabled
                    className="max-w-md bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email address is tied to your 2FA verification and cannot be changed directly.</p>
                </div>

                <div className="grid gap-2">
                  <Label>Organizational Role</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize text-xs font-semibold px-2.5 py-1 bg-[var(--brand-red)]/10 text-[var(--brand-red)] border-[var(--brand-red)]/30">
                      {user?.role || "Administrator"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white"
                >
                  {savingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Security & Password */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Password</CardTitle>
              <CardDescription>
                Change your account password and configure 2FA authentication requirements.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                {passwordMsg && (
                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${passwordMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                    {passwordMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="current-pw">Current Password</Label>
                  <Input
                    id="current-pw"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="max-w-md"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="max-w-md"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirm-pw">Confirm New Password</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="max-w-md"
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <Button
                  type="submit"
                  disabled={savingPassword || !currentPassword || !newPassword}
                  className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white"
                >
                  {savingPassword ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</> : <><KeyRound className="h-4 w-4 mr-2" /> Update Password</>}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Control which security and compliance alerts are sent to your email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold">High Severity Risk Alerts</div>
                  <div className="text-xs text-muted-foreground">Receive instant alerts when high-risk clauses or liability exposures are detected.</div>
                </div>
                <Switch checked={notifRisks} onCheckedChange={setNotifRisks} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold">Report Completion Notices</div>
                  <div className="text-xs text-muted-foreground">Notify when background PDF audit reports have finished generating.</div>
                </div>
                <Switch checked={notifReports} onCheckedChange={setNotifReports} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold">Weekly Governance Digest</div>
                  <div className="text-xs text-muted-foreground">Receive a weekly summary of reviewed contracts and compliance score changes.</div>
                </div>
                <Switch checked={notifDigest} onCheckedChange={setNotifDigest} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Engine & System */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>AI Intelligence Configuration</CardTitle>
              <CardDescription>
                View active language model and retrieval pipeline parameters.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5 p-4 rounded-lg border bg-muted/30">
                <div className="text-xs text-muted-foreground font-medium">Primary Inference Engine</div>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[var(--brand-red)]" /> Groq LPU — LLaMA 3.3 (70B Versatile)
                </div>
              </div>

              <div className="grid gap-1.5 p-4 rounded-lg border bg-muted/30">
                <div className="text-xs text-muted-foreground font-medium">Embedding Architecture</div>
                <div className="text-sm font-bold text-foreground">
                  Sentence-Transformers (all-MiniLM-L6-v2) • ChromaDB Local Vector Store
                </div>
              </div>

              <div className="grid gap-1.5 p-4 rounded-lg border bg-muted/30">
                <div className="text-xs text-muted-foreground font-medium">Chunking & Sliding Window</div>
                <div className="text-sm font-bold text-foreground">
                  500 Tokens Target Window • 75 Tokens Overlap • Page Tracking Enabled
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  PageHeader,
  PageShell,
  Panel,
  Notice,
  SkeletonBlock,
  EmptyState,
  dashInput,
  dashPrimaryBtn,
  dashGhostBtn,
} from "@/components/dashboard/ui";
import { Users, Copy, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Team = { id: string; name: string; owner_id: string; created_at: string };
type Member = {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
};

const teamFormSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name too long"),
});

const TeamWorkspacePage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: "" },
  });
  const creating = form.formState.isSubmitting;

  const fetchTeams = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: ownedTeams, error: ownedError } = await supabase
      .from("teams")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (ownedError) {
      toast.error(ownedError.message);
      setLoading(false);
      return;
    }

    const { data: memberRows, error: memberError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id);
    if (memberError) {
      toast.error(memberError.message);
      setLoading(false);
      return;
    }

    const memberTeamIds = (memberRows || []).map((r: { team_id: string }) => r.team_id);
    let memberTeams: Team[] = [];
    if (memberTeamIds.length > 0) {
      const { data: mt } = await supabase
        .from("teams")
        .select("*")
        .in("id", memberTeamIds)
        .neq("owner_id", user.id);
      memberTeams = (mt as Team[]) || [];
    }

    const allTeams = [...((ownedTeams as Team[]) || []), ...memberTeams];
    allTeams.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setTeams(allTeams);
    setLoading(false);
  }, [user]);

  const fetchMembers = useCallback(async (teamId: string) => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId);
    if (!error && data) {
      setMembers((prev) => ({ ...prev, [teamId]: data as Member[] }));
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (selectedTeam) fetchMembers(selectedTeam);
  }, [selectedTeam, fetchMembers]);

  const createTeam = async (values: z.infer<typeof teamFormSchema>) => {
    if (!user) return;
    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        name: values.name.trim(),
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    await supabase.from("team_members").insert({
      team_id: (team as Team).id,
      user_id: user.id,
      role: "owner",
    });

    toast.success("Team created!");
    form.reset();
    fetchTeams();
  };

  const deleteTeam = async (teamId: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) toast.error(error.message);
    else {
      toast.success("Team deleted");
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
      if (selectedTeam === teamId) setSelectedTeam(null);
    }
  };

  const copyInviteLink = (teamId: string) => {
    const link = `${window.location.origin}/dashboard/team?join=${teamId}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const isOwner = (team: Team) => team.owner_id === user?.id;

  return (
    <DashboardLayout>
      <PageShell width="md">
        <PageHeader
          title="Team Workspace"
          description="Create teams and copy invite links. Teammates must sign in with Google, then open the link while logged in."
        />

        <Notice variant="info">
          Shared results and automatic join-by-link are planned. Today, invite links help teammates find your team page after they sign up.
        </Notice>

        <Panel title="Create team">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(createTeam)} className="flex flex-col gap-3 sm:flex-row">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Team name" {...field} className={dashInput} />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={creating} className={dashPrimaryBtn + " sm:self-start h-10"}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </form>
          </Form>
        </Panel>

        {/* Teams list */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonBlock className="h-20" />
            <SkeletonBlock className="h-20" />
          </div>
        ) : teams.length === 0 ? (
          <Panel>
            <EmptyState icon={Users} title="No teams yet" description="Create a team above to get started." />
          </Panel>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <Panel key={team.id} noPadding>
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {team.name}
                      </h3>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {isOwner(team) && (
                          <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            <Crown className="h-2.5 w-2.5" /> Owner
                          </span>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {members[team.id]?.length || 1} member(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteLink(team.id)}
                      className={cn("gap-1.5 h-9", dashGhostBtn)}
                    >
                      <Copy className="h-3 w-3" /> Invite link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedTeam(selectedTeam === team.id ? null : team.id)
                      }
                      className={cn("h-9", dashGhostBtn)}
                    >
                      {selectedTeam === team.id ? "Hide" : "Members"}
                    </Button>
                    {isOwner(team) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete team?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
                              This permanently deletes the team and all member associations. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTeam(team.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                {selectedTeam === team.id && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Members
                    </p>
                    {(members[team.id] || []).length === 0 ? (
                      <p className="text-xs text-slate-500">No members yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {(members[team.id] || []).map((m) => (
                          <div key={m.id} className="flex items-center gap-2 text-sm">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {m.user_id.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                              {m.user_id.slice(0, 8)}…
                            </span>
                            <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {m.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            ))}
          </div>
        )}
      </PageShell>
    </DashboardLayout>
  );
};

export default TeamWorkspacePage;

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Crown, Link2, Loader2, Trash2, Users, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  copyText,
  dashGhostBtn,
  dashInput,
  dashPrimaryBtn,
  EmptyState,
  ErrorState,
  Notice,
  PageHeader,
  PageShell,
  Panel,
  SkeletonBlock,
} from "@/components/dashboard/ui";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Team = { id: string; name: string; owner_id: string; created_at: string };
type Member = { id: string; team_id: string; user_id: string; role: string; joined_at: string };
type JoinState = "idle" | "pending" | "joining" | "joined" | "already" | "invalid";

const teamFormSchema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(100, "Team name must be 100 characters or fewer"),
});

const inviteTokenPattern = /^[a-f0-9]{64}$/i;

export default function TeamWorkspacePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [memberErrors, setMemberErrors] = useState<Record<string, string>>({});
  const [membersLoading, setMembersLoading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<string | null>(null);
  const [transferringMember, setTransferringMember] = useState<string | null>(null);
  const [pendingTransfer, setPendingTransfer] = useState<{ teamId: string; memberId: string } | null>(null);
  const [joinState, setJoinState] = useState<JoinState>("idle");
  const [joinError, setJoinError] = useState<string | null>(null);

  // Both fetchers below write state after awaiting a request, so they check
  // this before writing. Without it, signing out or leaving the page while a
  // request was in flight would set state on an unmounted component.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { name: "" },
  });
  const creating = form.formState.isSubmitting;
  const inviteParam = searchParams.get("invite");
  const inviteToken = inviteParam && inviteTokenPattern.test(inviteParam) ? inviteParam : null;

  const fetchTeams = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const { data: ownedTeams, error: ownedError } = await supabase
        .from("teams")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (ownedError) throw ownedError;

      const { data: memberRows, error: memberError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);
      if (memberError) throw memberError;

      const memberTeamIds = (memberRows || []).map((row: { team_id: string }) => row.team_id);
      let memberTeams: Team[] = [];
      if (memberTeamIds.length > 0) {
        const { data: joinedTeams, error: joinedError } = await supabase
          .from("teams")
          .select("*")
          .in("id", memberTeamIds)
          .neq("owner_id", user.id);
        if (joinedError) throw joinedError;
        memberTeams = (joinedTeams as Team[]) || [];
      }

      const uniqueTeams = new Map<string, Team>();
      [...((ownedTeams as Team[]) || []), ...memberTeams].forEach((team) => uniqueTeams.set(team.id, team));
      if (!mounted.current) return;
      setTeams([...uniqueTeams.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error: unknown) {
      if (!mounted.current) return;
      setLoadError(error instanceof Error ? error.message : "Could not load teams");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [user]);

  const fetchMembers = useCallback(async (teamId: string) => {
    setMembersLoading((previous) => ({ ...previous, [teamId]: true }));
    setMemberErrors((previous) => ({ ...previous, [teamId]: "" }));
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", teamId);
      if (error) {
        if (!mounted.current) return;
        setMemberErrors((previous) => ({ ...previous, [teamId]: error.message }));
      } else {
        if (!mounted.current) return;
        setMembers((previous) => ({ ...previous, [teamId]: (data || []) as Member[] }));
      }
    } catch (error: unknown) {
      if (!mounted.current) return;
      setMemberErrors((previous) => ({ ...previous, [teamId]: error instanceof Error ? error.message : "Could not load members" }));
    } finally {
      if (mounted.current) setMembersLoading((previous) => ({ ...previous, [teamId]: false }));
    }
  }, []);

  useEffect(() => {
    void fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (selectedTeam) void fetchMembers(selectedTeam);
  }, [selectedTeam, fetchMembers]);

  useEffect(() => {
    if (!inviteParam) {
      setJoinState("idle");
      setJoinError(null);
      return;
    }
    if (!inviteToken) {
      setJoinState("invalid");
      setJoinError("This invite link is not valid. Ask the team owner for a new link.");
      return;
    }
    if (loading) return;
    setJoinState("pending");
    setJoinError(null);
  }, [inviteParam, inviteToken, loading]);

  const createTeam = async (values: z.infer<typeof teamFormSchema>) => {
    if (!user) return;
    try {
      const { error } = await supabase.rpc("create_team_with_owner", { team_name: values.name.trim() });
      if (error) throw error;
      toast.success("Team created");
      form.reset({ name: "" });
      await fetchTeams();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not create team");
    }
  };

  const deleteTeam = async (teamId: string) => {
    setDeletingTeam(teamId);
    try {
      const { error } = await supabase.from("teams").delete().eq("id", teamId);
      if (error) throw error;
      toast.success("Team deleted");
      setTeams((previous) => previous.filter((team) => team.id !== teamId));
      setMembers((previous) => {
        const next = { ...previous };
        delete next[teamId];
        return next;
      });
      if (selectedTeam === teamId) setSelectedTeam(null);
      return true;
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not delete team");
      return false;
    } finally {
      setDeletingTeam(null);
    }
  };

  const transferOwnership = async (teamId: string, memberId: string) => {
    setTransferringMember(memberId);
    try {
      const { error: transferError } = await supabase.rpc("transfer_team_ownership", { p_team_id: teamId, p_new_owner_id: memberId });
      if (transferError) throw transferError;
      toast.success("Team ownership transferred");
      await fetchTeams();
      await fetchMembers(teamId);
      return true;
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not transfer ownership");
      return false;
    } finally {
      setTransferringMember(null);
    }
  };

  const copyInviteLink = async (teamId: string) => {
    try {
      const { data: token, error: inviteError } = await supabase.rpc("create_team_invite", { p_team_id: teamId, p_expires_in_hours: 168 });
      if (inviteError) throw inviteError;
      if (!token) throw new Error("The invite token was not returned");
      const url = new URL("/dashboard/team", window.location.origin);
      url.searchParams.set("invite", token);
      const copied = await copyText(url.toString());
      if (copied) toast.success("Secure invite link copied");
      else toast.error("Could not access the clipboard");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Could not create an invite");
    }
  };

  const acceptInvite = async () => {
    if (!user || !inviteToken || joinState === "joining") return;
    setJoinState("joining");
    setJoinError(null);
    try {
      const { error: acceptError } = await supabase.rpc("accept_team_invite", { p_token: inviteToken });
      if (acceptError) {
        const message = acceptError.message;
        if (message.toLowerCase().includes("already")) {
          setJoinState("already");
          toast.info("You already have access to this team");
        } else {
          setJoinState("pending");
          setJoinError(message);
          toast.error("Could not accept this invite");
        }
        return;
      }
      setJoinState("joined");
      toast.success("You joined the team");
      await fetchTeams();
      window.setTimeout(() => setSearchParams({}, { replace: true }), 1400);
    } catch (error: unknown) {
      setJoinState("pending");
      setJoinError(error instanceof Error ? error.message : "Could not accept this invite");
      toast.error("Could not accept this invite");
    }
  };

  const clearInvite = () => setSearchParams({}, { replace: true });
  const isOwner = (team: Team) => team.owner_id === user?.id;

  return (
    <>
      <PageShell width="md">
        <PageHeader
          title="Team Workspace"
          description="Create a workspace, invite teammates, and keep team membership in one place."
        />

        {inviteParam && (
          <Panel
            title="Team invite"
            description="Review the invite before joining. A link never gives access without your signed-in account."
            headerAction={<Link2 className="h-4 w-4 text-blue-600" aria-hidden="true" />}
          >
            {joinState === "pending" && (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600" aria-hidden="true"><UserPlus className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Join this team?</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">You will be added as a member. Team owners can remove members at any time.</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="ghost" onClick={clearInvite}>Cancel</Button>
                  <Button type="button" onClick={() => void acceptInvite()} className={cn("h-10", dashPrimaryBtn)}>
                    <UserPlus className="h-4 w-4" aria-hidden="true" /> Join team
                  </Button>
                </div>
              </div>
            )}
            {joinState === "joining" && <div className="flex items-center gap-2 text-sm font-medium text-blue-700" role="status" aria-live="polite"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Joining team...</div>}
            {joinState === "joined" && <Notice variant="success"><span>You are now a member of this team.</span></Notice>}
            {joinState === "already" && <Notice variant="success"><span>You already have access to this team.</span><Button type="button" variant="link" onClick={clearInvite} className="ml-2 h-auto p-0 text-emerald-700 underline">Dismiss</Button></Notice>}
            {(joinState === "invalid" || joinError) && (
              <Notice variant="danger">
                <span>{joinError || "This invite could not be accepted."}</span>
                <Button type="button" variant="link" onClick={clearInvite} className="ml-2 h-auto p-0 text-red-700 underline">Dismiss</Button>
              </Notice>
            )}
          </Panel>
        )}

        <Notice variant="info">
          Invite links are for signed-in teammates. KeyPing currently supports team membership here; publishing shared validation results is not available from this screen yet.
        </Notice>

        <Panel title="Create team" description="Use a name your teammates will recognize.">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(createTeam)} className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="sr-only">Team name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Platform team" autoComplete="organization" {...field} className={dashInput} />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={creating} className={cn("h-10 sm:self-start", dashPrimaryBtn)}>
                {creating ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Creating...</> : <><Users className="h-4 w-4" aria-hidden="true" /> Create team</>}
              </Button>
            </form>
          </Form>
        </Panel>

        {loading ? (
          <div className="space-y-3" role="status" aria-label="Loading teams" aria-live="polite">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
            <span className="sr-only">Loading your teams.</span>
          </div>
        ) : loadError ? (
          <Panel ariaLabel="Team loading error">
            <ErrorState title="Could not load teams" description={loadError} action={<Button type="button" variant="outline" onClick={() => void fetchTeams()}>Try again</Button>} />
          </Panel>
        ) : teams.length === 0 ? (
          <Panel ariaLabel="Teams empty state">
            <EmptyState icon={Users} title="No teams yet" description="Create a team above to start a shared workspace." />
          </Panel>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => {
              const expanded = selectedTeam === team.id;
              const teamMembers = members[team.id];
              const isLoadingMembers = membersLoading[team.id];
              return (
                <Panel key={team.id} ariaLabel={`Team ${team.name}`} noPadding className="transition-shadow duration-200 hover:shadow-card-hover">
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600" aria-hidden="true"><Users className="h-5 w-5" /></div>
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-slate-900">{team.name}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          {isOwner(team) && <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-700"><Crown className="h-2.5 w-2.5" aria-hidden="true" /> Owner</span>}
                          <span className="text-xs text-slate-500">{isLoadingMembers ? "Loading members..." : teamMembers ? `${teamMembers.length} member${teamMembers.length === 1 ? "" : "s"}` : ""}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:shrink-0">
                      {isOwner(team) && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => void copyInviteLink(team.id)} className={cn("h-9 gap-1.5", dashGhostBtn)}>
                          <Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Invite link
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedTeam(expanded ? null : team.id)} className={cn("h-9", dashGhostBtn)} aria-expanded={expanded} aria-controls={`team-members-${team.id}`}>
                        {expanded ? "Hide members" : "Members"}
                      </Button>
                      {isOwner(team) && (
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setDeletingTeam(team.id)} aria-label={`Delete ${team.name}`}>
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {expanded && (
                    <div id={`team-members-${team.id}`} className="border-t border-slate-100 px-4 pb-4 pt-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Members</p>
                        <span className="text-[11px] text-slate-400">Owner access is required for deletion</span>
                      </div>
                      {memberErrors[team.id] ? (
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
                          <span>{memberErrors[team.id]}</span>
                          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => void fetchMembers(team.id)}>Retry</Button>
                        </div>
                      ) : isLoadingMembers ? (
                        <div className="flex items-center gap-2 py-3 text-xs text-slate-500" role="status"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Loading members...</div>
                      ) : !teamMembers || teamMembers.length === 0 ? (
                        <p className="py-2 text-xs text-slate-500">No members are visible yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {teamMembers.map((member) => (
                            <div key={member.id} className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-semibold text-slate-600" aria-hidden="true">{member.user_id.slice(0, 2).toUpperCase()}</div>
                              <span className="truncate font-mono text-xs text-slate-500">{member.user_id.slice(0, 8)}...</span>
                              <span className="ml-auto rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">{member.role}</span>
                              {isOwner(team) && member.role !== "owner" && <Button type="button" variant="ghost" size="sm" disabled={transferringMember === member.user_id} onClick={() => setPendingTransfer({ teamId: team.id, memberId: member.user_id })} className="h-7 px-2 text-[10px] text-blue-600 hover:bg-blue-50">{transferringMember === member.user_id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Make owner"}</Button>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Panel>
              );
            })}
          </div>
        )}
      </PageShell>

      <AlertDialog open={pendingTransfer !== null} onOpenChange={(open) => { if (!open && !transferringMember) setPendingTransfer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer team ownership?</AlertDialogTitle>
            <AlertDialogDescription>
              Ownership of {teams.find((team) => team.id === pendingTransfer?.teamId)?.name ?? "this team"} will move to user ID {pendingTransfer?.memberId.slice(0, 8)}... You will remain a member with the permissions assigned by the new owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(transferringMember)}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={Boolean(transferringMember)} onClick={(event) => { event.preventDefault(); if (pendingTransfer) { void transferOwnership(pendingTransfer.teamId, pendingTransfer.memberId).then((success) => { if (success) setPendingTransfer(null); }); } }} className="bg-blue-600 text-white hover:bg-blue-700">
              {transferringMember ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crown className="mr-2 h-4 w-4" />}
              Transfer ownership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletingTeam !== null} onOpenChange={(open) => { if (!open) setDeletingTeam(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team?</AlertDialogTitle>
            <AlertDialogDescription>This permanently deletes the team and its member associations. Shared team data cannot be recovered after deletion.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingTeam)}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={Boolean(deletingTeam)} onClick={(event) => { event.preventDefault(); if (deletingTeam) void deleteTeam(deletingTeam); }} className="bg-red-600 text-white hover:bg-red-700">
              {deletingTeam ? "Deleting..." : "Delete team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

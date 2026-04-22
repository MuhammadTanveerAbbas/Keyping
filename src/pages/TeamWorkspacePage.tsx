import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Copy, Trash2, Crown } from "lucide-react";
import { toast } from "sonner";

type Team = { id: string; name: string; owner_id: string; created_at: string };
type Member = {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
};

const TeamWorkspacePage = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Record<string, Member[]>>({});
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const fetchTeams = async () => {
    if (!user) return;
    setLoading(true);
    // Fetch teams where user is owner
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

    // Fetch teams where user is a member (but not owner)
    const { data: memberRows, error: memberError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id);
    if (memberError) {
      toast.error(memberError.message);
      setLoading(false);
      return;
    }

    const memberTeamIds = (memberRows || []).map((r: any) => r.team_id);
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
  };

  const fetchMembers = async (teamId: string) => {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId);
    if (!error && data) {
      setMembers((prev) => ({ ...prev, [teamId]: data as Member[] }));
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user]);
  useEffect(() => {
    if (selectedTeam) fetchMembers(selectedTeam);
  }, [selectedTeam]);

  const createTeam = async () => {
    if (!user || !newTeamName.trim()) return;
    setCreating(true);
    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        name: newTeamName.trim(),
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setCreating(false);
      return;
    }

    await supabase.from("team_members").insert({
      team_id: (team as Team).id,
      user_id: user.id,
      role: "owner",
    });

    toast.success("Team created!");
    setNewTeamName("");
    setCreating(false);
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Create team */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 space-y-4 card-accent">
          <h2 className="font-sans text-sm font-semibold text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-white/70" /> Create a Team
          </h2>
          <div className="flex gap-3">
            <Input
              placeholder="Team name..."
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="flex-1 bg-[#161616] border border-[#222222] focus:border-white/30 text-slate-200 placeholder:text-slate-600 rounded-lg"
            />
            <Button
              onClick={createTeam}
              disabled={creating || !newTeamName.trim()}
              className="bg-white hover:bg-white/90 text-white font-sans font-semibold text-sm rounded-lg shadow-[0_0_0_1px_rgba(255,255,255,0.12)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all border-0"
            >
              Create
            </Button>
          </div>
        </div>

        {/* Teams list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-[#111111] border border-[#222222] rounded-xl p-4 h-16 animate-pulse"
              />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-8 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-slate-700" />
            <p className="font-sans text-sm text-slate-500">
              No teams yet. Create one above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-[#111111] border border-[#222222] rounded-xl card-hover-lift card-accent"
              >
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white/70" />
                    </div>
                    <div>
                      <h3 className="font-sans font-semibold text-white text-sm">
                        {team.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {isOwner(team) && (
                          <span className="font-mono text-[10px] bg-white/5 text-white/70 border border-white/10 rounded px-1.5 py-0.5 flex items-center gap-1">
                            <Crown className="h-2.5 w-2.5" /> Owner
                          </span>
                        )}
                        <span className="font-sans text-xs text-slate-500">
                          {members[team.id]?.length || 1} member(s)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteLink(team.id)}
                      className="gap-1.5 text-slate-400 hover:text-white/70 hover:bg-white/4 font-sans text-xs rounded-lg border border-[#222222] hover:border-white/15"
                    >
                      <Copy className="h-3 w-3" /> Invite Link
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedTeam(
                          selectedTeam === team.id ? null : team.id,
                        )
                      }
                      className="text-slate-400 hover:text-white hover:bg-white/[0.04] font-sans text-xs rounded-lg border border-[#222222]"
                    >
                      {selectedTeam === team.id ? "Hide" : "View"}
                    </Button>
                    {isOwner(team) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-600 hover:text-red-400 hover:bg-red-950/30"
                        onClick={() => deleteTeam(team.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {selectedTeam === team.id && (
                  <div className="px-4 pb-4 border-t border-[#222222] pt-3">
                    <p className="font-sans text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">
                      Members
                    </p>
                    {(members[team.id] || []).length === 0 ? (
                      <p className="font-sans text-xs text-slate-600">
                        No members yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {(members[team.id] || []).map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-[#161616] border border-[#222222] flex items-center justify-center font-mono text-xs text-slate-400">
                                {m.user_id.slice(0, 2)}
                              </div>
                              <span className="font-mono text-xs text-slate-400">
                                {m.user_id.slice(0, 8)}...
                              </span>
                              <span className="font-mono text-[10px] bg-[#161616] border border-[#222222] text-slate-500 rounded px-1.5 py-0.5">
                                {m.role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeamWorkspacePage;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows you to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          expiry_date: string
          id: string
          key_nickname: string
          notified: boolean
          reminder_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expiry_date: string
          id?: string
          key_nickname: string
          notified?: boolean
          reminder_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expiry_date?: string
          id?: string
          key_nickname?: string
          notified?: boolean
          reminder_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      key_tests: {
        Row: {
          created_at: string
          health_score: number | null
          id: string
          key_preview: string
          latency_ms: number | null
          nickname: string | null
          notes: string | null
          provider: string
          rate_limit_info: Json | null
          scopes: Json | null
          status: string
          tested_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          health_score?: number | null
          id?: string
          key_preview: string
          latency_ms?: number | null
          nickname?: string | null
          notes?: string | null
          provider: string
          rate_limit_info?: Json | null
          scopes?: Json | null
          status: string
          tested_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          health_score?: number | null
          id?: string
          key_preview?: string
          latency_ms?: number | null
          nickname?: string | null
          notes?: string | null
          provider?: string
          rate_limit_info?: Json | null
          scopes?: Json | null
          status?: string
          tested_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean
          expiry_alerts: boolean
          updated_at: string
          user_id: string
          weekly_digest: boolean
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean
          expiry_alerts?: boolean
          updated_at?: string
          user_id: string
          weekly_digest?: boolean
        }
        Update: {
          created_at?: string
          email_notifications?: boolean
          expiry_alerts?: boolean
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean
        }
        Relationships: []
      }
      shared_results: {
        Row: {
          id: string
          key_test_id: string
          shared_at: string
          shared_by: string
          team_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          key_test_id: string
          shared_at?: string
          shared_by: string
          team_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          key_test_id?: string
          shared_at?: string
          shared_by?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_results_key_test_id_fkey"
            columns: ["key_test_id"]
            isOneToOne: false
            referencedRelation: "key_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invited_by: string
          revoked_at: string | null
          role: string
          team_id: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          invited_by: string
          revoked_at?: string | null
          role?: string
          team_id: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          revoked_at?: string | null
          role?: string
          team_id?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invite: {
        Args: {
          p_token: string
        }
        Returns: string
      }
      create_team_invite: {
        Args: {
          p_email?: string | null
          p_expires_in_hours?: number
          p_team_id: string
        }
        Returns: string
      }
      create_team_with_owner: {
        Args: {
          team_name: string
        }
        Returns: string
      }
      delete_user_account: {
        Args: Record<string, never>
        Returns: undefined
      }
      revoke_team_invite: {
        Args: {
          p_invite_id: string
        }
        Returns: undefined
      }
      transfer_team_ownership: {
        Args: {
          p_new_owner_id: string
          p_team_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

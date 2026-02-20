import { supabase } from '../lib/supabaseClient';

/**
 * Session Service
 * Prevents same username from being active on 2 devices simultaneously.
 * Uses active_sessions table with 30-second expiry window.
 */

export const SessionService = {

  /**
   * Check if a username has an active session on another device.
   * Excludes the given sessionId (for page-refresh scenarios).
   * Returns true if name is blocked (active elsewhere).
   */
  isNameActive: async (userName, excludeSessionId = null) => {
    if (!userName) return false;
    const normalized = userName.trim().toLowerCase();

    let query = supabase
      .from('active_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_name', normalized)
      .gt('last_seen', new Date(Date.now() - 30000).toISOString());

    // Exclude current session (handles refresh)
    if (excludeSessionId) {
      query = query.neq('session_id', excludeSessionId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error checking active session:', error);
      return false; // Fail-open to not block users on DB error
    }

    return count > 0;
  },

  /**
   * Register a new session for this user.
   * Cleans up any old expired sessions for this user first.
   */
  registerSession: async (userName, sessionId) => {
    const normalized = userName.trim().toLowerCase();

    // Clean up any expired sessions for this user (older than 30s)
    await supabase
      .from('active_sessions')
      .delete()
      .eq('user_name', normalized)
      .lt('last_seen', new Date(Date.now() - 30000).toISOString());

    // Insert new session
    const { error } = await supabase
      .from('active_sessions')
      .insert([{
        user_name: normalized,
        session_id: sessionId,
        last_seen: new Date().toISOString(),
      }]);

    if (error) {
      console.error('Error registering session:', error);
      throw error;
    }
  },

  /**
   * Send heartbeat — update last_seen for the current session.
   */
  sendHeartbeat: async (sessionId) => {
    if (!sessionId) return;

    const { error } = await supabase
      .from('active_sessions')
      .update({ last_seen: new Date().toISOString() })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error sending heartbeat:', error);
    }
  },

  /**
   * End session — delete by session_id (not user_name).
   */
  endSession: async (sessionId) => {
    if (!sessionId) return;

    const { error } = await supabase
      .from('active_sessions')
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error ending session:', error);
    }
  },
};

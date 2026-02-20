import { supabase } from '../lib/supabaseClient';

/**
 * Game Settings Service
 * Manages the single-row game_settings table (UUID primary key).
 * Controls: show_winner toggle, current_question_id tracking, winner_name.
 */

export const GameSettingsService = {

  /**
   * Get the single settings row. Creates one if none exists.
   * Returns: { id, showWinner, currentQuestionId, winnerName }
   */
  getSettings: async () => {
    const { data, error } = await supabase
      .from('game_settings')
      .select('*')
      .limit(1)
      .single();

    // Row exists — return it
    if (data && !error) {
      return {
        id: data.id,
        showWinner: data.show_winner ?? false,
        currentQuestionId: data.current_question_id ?? null,
        winnerName: data.winner_name ?? null,
      };
    }

    // No row found — create the initial one
    const { data: created, error: insertError } = await supabase
      .from('game_settings')
      .insert([{ show_winner: false, current_question_id: null }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating game settings:', insertError);
      return { id: null, showWinner: false, currentQuestionId: null };
    }

    return {
      id: created.id,
      showWinner: false,
      currentQuestionId: null,
      winnerName: null,
    };
  },

  /**
   * Toggle the show_winner flag.
   * When enabling, stores winnerName. When disabling, clears it.
   */
  toggleShowWinner: async (currentValue, winnerName = null) => {
    const settings = await GameSettingsService.getSettings();
    if (!settings.id) throw new Error('No game settings row found');

    const newValue = !currentValue;

    const { error } = await supabase
      .from('game_settings')
      .update({
        show_winner: newValue,
        winner_name: newValue ? winnerName : null,
      })
      .eq('id', settings.id);

    if (error) {
      console.error('Error toggling show_winner:', error);
      throw error;
    }

    return newValue;
  },

  /**
   * Set current question and auto-reset show_winner to false.
   * Called when admin creates a new question.
   */
  setCurrentQuestion: async (questionId) => {
    const settings = await GameSettingsService.getSettings();
    if (!settings.id) return;

    const { error } = await supabase
      .from('game_settings')
      .update({
        current_question_id: questionId,
        show_winner: false,
      })
      .eq('id', settings.id);

    if (error) {
      console.error('Error setting current question:', error);
    }
  },
};

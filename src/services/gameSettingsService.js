import { supabase } from '../lib/supabaseClient';

/**
 * Game Settings Service
 * Manages the single-row game_settings table.
 * Controls: show_winner toggle, current_question_id tracking.
 */

export const GameSettingsService = {

  /**
   * Get the current game settings (single row, id = 1).
   */
  getSettings: async () => {
    const { data, error } = await supabase
      .from('game_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching game settings:', error);
      return { showWinner: false, currentQuestionId: null };
    }

    return {
      showWinner: data.show_winner ?? false,
      currentQuestionId: data.current_question_id ?? null,
    };
  },

  /**
   * Toggle the show_winner flag.
   */
  toggleShowWinner: async (currentValue) => {
    const { error } = await supabase
      .from('game_settings')
      .update({ show_winner: !currentValue })
   .update({ show_winner: newValue })
.not('id', 'is', null)

    if (error) {
      console.error('Error toggling show_winner:', error);
      throw error;
    }

    return !currentValue;
  },

  /**
   * Set current question and auto-reset show_winner to false.
   * Called when admin creates a new question.
   */
  setCurrentQuestion: async (questionId) => {
    const { error } = await supabase
      .from('game_settings')
      .update({
        current_question_id: questionId,
        show_winner: false,
      })
     getSettings: async () => {
  const { data, error } = await supabase
    .from('game_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) throw error;
  return data;
}

    if (error) {
      console.error('Error setting current question:', error);
    }
  },
};

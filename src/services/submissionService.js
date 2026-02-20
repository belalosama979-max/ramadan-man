import { supabase } from '../lib/supabaseClient';

/**
 * Submission Model:
 * {
 *   id: string,
 *   questionId: string,
 *   name: string,
 *   normalizedName: string, // Lowercase, trimmed for uniqueness check
 *   answer: string,
 *   isCorrect: boolean,
 *   resultViewed: boolean,   // true once user has seen their result post-question
 *   submittedAt: ISOString
 * }
 */

export const SubmissionService = {
  getAll: async () => {
    const { data, error } = await supabase
        .from('submissions')
        .select('*');
    if (error) throw error;
    return data.map(mapSubmission);
  },

  getByQuestionId: async (questionId) => {
    const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('question_id', questionId);
        
    if (error) throw error;
    return data.map(mapSubmission);
  },

  submit: async ({ user, question, answer }) => {
    if (!question || !user || !answer) {
        throw new Error("Invalid submission data.");
    }

    // 1. Check if question is still active (Client-side validation using passed object)
    const now = new Date();
    const end = new Date(question.endTime);
    if (now > end) {
        throw new Error("انتهى وقت الإجابة على هذا السؤال.");
    }

    // 2. Normalize Name
    const normalizedName = user.trim().toLowerCase();

    // 3. Strict: One submission per person per question (Async Check)
    const hasSubmitted = await SubmissionService.hasUserAnswered(question.id, user);
    if (hasSubmitted) {
        throw new Error("لقد قمت بالإجابة على هذا السؤال مسبقاً.");
    }

    // 4. Check Answer (Case-insensitive)
    const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

    // 5. Save to Supabase
    const { data, error } = await supabase
        .from('submissions')
        .insert([{
            question_id: question.id,
            name: user.trim(),
            normalized_name: normalizedName,
            answer: answer.trim(),
            is_correct: isCorrect,
            // id and submitted_at handled by DB
        }])
        .select()
        .single();

    if (error) throw error;

    return mapSubmission(data);
  },

  hasUserAnswered: async (questionId, userName) => {
      if (!userName) return false;
      const normalized = userName.trim().toLowerCase();
      
      const { count, error } = await supabase
        .from('submissions')
        .select('id', { count: 'exact', head: true })
        .eq('question_id', questionId)
        .eq('normalized_name', normalized);

      if (error) {
          console.error("Error checking submission:", error);
          return false;
      }
      
      return count > 0;
  },

  /**
   * Get a specific user's submission for a question.
   * Returns the submission with isCorrect, or null if not found.
   */
  getUserSubmission: async (questionId, userName) => {
      if (!questionId || !userName) return null;
      const normalized = userName.trim().toLowerCase();

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('question_id', questionId)
        .eq('normalized_name', normalized)
        .maybeSingle();

      if (error) {
          console.error("Error fetching user submission:", error);
          return null;
      }

      return data ? mapSubmission(data) : null;
  },

  /**
   * Mark a submission's result as viewed. Called once when the user sees their result.
   * Only updates the result_viewed flag — no other data is modified.
   */
  markResultViewed: async (submissionId) => {
      if (!submissionId) return;

      const { error } = await supabase
        .from('submissions')
        .update({ result_viewed: true })
        .eq('id', submissionId);

      if (error) {
          console.error('Error marking result as viewed:', error);
      }
  }
};

// Helper to map snake_case DB to camelCase model
const mapSubmission = (s) => ({
    id: s.id,
    questionId: s.question_id,
    name: s.name,
    normalizedName: s.normalized_name,
    answer: s.answer,
    isCorrect: s.is_correct,
    resultViewed: s.result_viewed ?? false,
    submittedAt: s.submitted_at
});

import { supabase } from '../lib/supabaseClient';

/**
 * Question Model:
 * {
 *   id: string,
 *   text: string,
 *   correctAnswer: string,
 *   startTime: ISOString,
 *   endTime: ISOString,
 *   createdAt: ISOString
 * }
 */

export const QuestionService = {
  // Fetch all questions
  getAll: async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Map back to camelCase for app consistency
    return data.map(q => ({
        ...q,
        correctAnswer: q.correct_answer,
        startTime: q.start_time,
        endTime: q.end_time,
        createdAt: q.created_at
    }));
  },

  add: async (questionData) => {
    // Validate inputs
    if (!questionData.text || !questionData.correctAnswer || !questionData.startTime || !questionData.endTime) {
      throw new Error("Missing required question fields.");
    }

    if (new Date(questionData.endTime) <= new Date(questionData.startTime)) {
        throw new Error("End time must be after start time.");
    }

    const { data, error } = await supabase
      .from('questions')
      .insert([{
          text: questionData.text,
          correct_answer: questionData.correctAnswer,
          start_time: questionData.startTime,
          end_time: questionData.endTime,
          // id and created_at handled by DB defaults
      }])
      .select()
      .single();

    if (error) throw error;
    
    return {
        ...data,
        correctAnswer: data.correct_answer,
        startTime: data.start_time,
        endTime: data.end_time,
        createdAt: data.created_at
    };
  },

  getActive: async () => {
    const now = new Date().toISOString();
    
    // Fetch questions that started before NOW and end after NOW
    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .lte('start_time', now)
        .gte('end_time', now)
        .maybeSingle(); // Expecting one active question at a time

    if (error) {
        console.error("Error fetching active question:", error);
        return null;
    }
    
    if (!data) return null;

    return {
        ...data,
        correctAnswer: data.correct_answer,
        startTime: data.start_time,
        endTime: data.end_time,
        createdAt: data.created_at
    };
  },

  // Get currently active or future questions
  getSchedule: async () => {
      const all = await QuestionService.getAll();
      return all.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  },

  forceEnd: async (id) => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('questions')
        .update({ end_time: now })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
          ...data,
          correctAnswer: data.correct_answer,
          startTime: data.start_time,
          endTime: data.end_time,
          createdAt: data.created_at
      };
  }
};

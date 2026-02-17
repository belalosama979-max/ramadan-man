import { supabase } from '../lib/supabaseClient';

/*
Question Model (App Side - camelCase):
{
  id: string,
  text: string,
  correctAnswer: string,
  startTime: ISOString,
  endTime: ISOString,
  createdAt: ISOString
}
*/

export const QuestionService = {

  // 🔹 Get all questions
  getAll: async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(q => ({
      id: q.id,
      text: q.text,
      correctAnswer: q.correct_answer,
      startTime: q.start_time,
      endTime: q.end_time,
      createdAt: q.created_at
    }));
  },


  // 🔹 Add new question
  add: async (questionData) => {

    if (
      !questionData.text ||
      !questionData.correctAnswer ||
      !questionData.startTime ||
      !questionData.endTime
    ) {
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
        start_time: new Date(questionData.startTime).toISOString(),
        end_time: new Date(questionData.endTime).toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      text: data.text,
      correctAnswer: data.correct_answer,
      startTime: data.start_time,
      endTime: data.end_time,
      createdAt: data.created_at
    };
  },


  // 🔹 Get currently active question (SERVER-SIDE FILTERING ONLY)
  getActive: async () => {

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .lte('start_time', now)
      .gte('end_time', now)
      .order('start_time', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching active question:", error);
      throw error;
    }

    if (!data || data.length === 0) return null;

    const q = data[0];

    return {
      id: q.id,
      text: q.text,
      correctAnswer: q.correct_answer,
      startTime: q.start_time,
      endTime: q.end_time,
      createdAt: q.created_at
    };
  },


  // 🔹 Get schedule (sorted by start time)
  getSchedule: async () => {
    const all = await QuestionService.getAll();
    return all.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  },


  // 🔹 Force end question immediately
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
      id: data.id,
      text: data.text,
      correctAnswer: data.correct_answer,
      startTime: data.start_time,
      endTime: data.end_time,
      createdAt: data.created_at
    };
  }
};

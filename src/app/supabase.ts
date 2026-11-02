import { Injectable } from '@angular/core';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { NewSurvey, NewVote, Survey, Vote } from './interfaces/survey.interface';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabase = createClient('https://pabhhpafcgfqlmzyxrzt.supabase.co', 'sb_publishable_E47gw43W5OMWTara2z0BKw_9owhWnU9');

  /**
   * Loads all surveys sorted by end date, earliest first.
   * Surveys without an end date are placed last.
   * @returns A list of all surveys.
   */
  async getSurveys(): Promise<Survey[]> {
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*')
      .order('end_date', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data as Survey[];
  }

  /**
   * Loads a single survey by its id.
   * @param id The id of the survey.
   * @returns The matching survey.
   */
  async getSurvey(id: number): Promise<Survey> {
    const { data, error } = await this.supabase
      .from('surveys').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Survey;
  }

  /**
   * Creates a new survey.
   * @param survey The survey data without id and creation date.
   * @returns The created survey.
   */
  async createSurvey(survey: NewSurvey): Promise<Survey> {
    const { data, error } = await this.supabase
      .from('surveys').insert(survey).select().single();
    if (error) throw error;
    return data as Survey;
  }

  /**
   * Loads all votes of a survey.
   * @param surveyId The id of the survey.
   * @returns A list of votes.
   */
  async getVotes(surveyId: number): Promise<Vote[]> {
    const { data, error } = await this.supabase
      .from('votes').select('*').eq('survey_id', surveyId);
    if (error) throw error;
    return data as Vote[];
  }

  /**
   * Saves one or more votes in a single request.
   * @param votes The votes to save.
   */
  async addVotes(votes: NewVote[]): Promise<void> {
    const { error } = await this.supabase.from('votes').insert(votes);
    if (error) throw error;
  }

  /**
   * Listens to new votes of a survey in real time.
   * @param surveyId The id of the survey.
   * @param onVote Callback that receives each new vote.
   * @returns The channel, needed to unsubscribe later.
   */
  subscribeToVotes(surveyId: number, onVote: (vote: Vote) => void): RealtimeChannel {
    return this.supabase
      .channel(`votes-${surveyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes', filter: `survey_id=eq.${surveyId}` },
        (payload) => onVote(payload.new as Vote)
      )
      .subscribe();
  }

  /**
   * Stops a realtime subscription.
   * @param channel The channel returned by subscribeToVotes.
   */
  unsubscribe(channel: RealtimeChannel): void {
    this.supabase.removeChannel(channel);
  }
}
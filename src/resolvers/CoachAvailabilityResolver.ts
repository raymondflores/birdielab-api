import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from "type-graphql";
import { CoachAvailability } from "../entities/CoachAvailability";
import { CreateCoachAvailabilityInput, UpdateCoachAvailabilityInput, CoachAvailabilityFilterInput } from "../entities/CoachAvailabilityInput";
import { supabaseAdmin } from "../config/supabase";
import { Request } from "express";

interface Context {
  req: Request;
  user: any;
}

@Resolver(CoachAvailability)
export class CoachAvailabilityResolver {
  @Authorized()
  @Mutation(() => CoachAvailability)
  async createCoachAvailability(
    @Ctx() context: Context,
    @Arg("input") input: CreateCoachAvailabilityInput
  ): Promise<CoachAvailability> {
    try {
      // First get the user's profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('auth_id', context.user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User profile not found. Please create a profile first.');
      }

      // Get the coach record
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('user_id', profile.id)
        .single();
      
      if (coachError || !coach) {
        throw new Error('Coach profile not found. Please become a coach first.');
      }

      // Validate day_of_week (0-6)
      if (input.day_of_week < 0 || input.day_of_week > 6) {
        throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
      }

      // Validate time format and that start_time is before end_time
      const startTime = new Date(`2000-01-01T${input.start_time}`);
      const endTime = new Date(`2000-01-01T${input.end_time}`);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error('Invalid time format. Use HH:MM:SS format');
      }
      
      if (startTime >= endTime) {
        throw new Error('Start time must be before end time');
      }

      // Check for overlapping availability on the same day
      const { data: existingAvailability } = await supabaseAdmin
        .from('coach_availabilities')
        .select('id, start_time, end_time')
        .eq('coach_id', coach.id)
        .eq('day_of_week', input.day_of_week);
      
      if (existingAvailability) {
        for (const existing of existingAvailability) {
          const existingStart = new Date(`2000-01-01T${existing.start_time}`);
          const existingEnd = new Date(`2000-01-01T${existing.end_time}`);
          
          // Check for overlap
          if ((startTime < existingEnd && endTime > existingStart)) {
            throw new Error(`Availability overlaps with existing time slot (${existing.start_time} - ${existing.end_time})`);
          }
        }
      }

      // Create availability entry
      const { data: availability, error: availabilityError } = await supabaseAdmin
        .from('coach_availabilities')
        .insert({
          coach_id: coach.id,
          day_of_week: input.day_of_week,
          start_time: input.start_time,
          end_time: input.end_time,
          timezone: input.timezone
        })
        .select()
        .single();
      
      if (availabilityError) {
        throw new Error('Failed to create coach availability');
      }
      
      return new CoachAvailability(
        availability.id,
        availability.coach_id,
        availability.day_of_week,
        availability.start_time,
        availability.end_time,
        availability.created_at,
        availability.updated_at,
        availability.timezone
      );
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create coach availability');
    }
  }

  @Authorized()
  @Mutation(() => CoachAvailability, { nullable: true })
  async updateCoachAvailability(
    @Ctx() context: Context,
    @Arg("id") id: string,
    @Arg("input") input: UpdateCoachAvailabilityInput
  ): Promise<CoachAvailability | null> {
    try {
      // First get the user's profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('auth_id', context.user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User profile not found.');
      }

      // Get the coach record
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('user_id', profile.id)
        .single();
      
      if (coachError || !coach) {
        throw new Error('Coach profile not found.');
      }

      // Verify ownership of the availability
      const { data: existingAvailability, error: checkError } = await supabaseAdmin
        .from('coach_availabilities')
        .select('id, coach_id')
        .eq('id', id)
        .single();
      
      if (checkError || !existingAvailability) {
        throw new Error('Coach availability not found');
      }
      
      if (existingAvailability.coach_id !== coach.id) {
        throw new Error('You can only update your own availability');
      }

      // Validate inputs if provided
      if (input.day_of_week !== undefined && (input.day_of_week < 0 || input.day_of_week > 6)) {
        throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
      }

      if (input.start_time && input.end_time) {
        const startTime = new Date(`2000-01-01T${input.start_time}`);
        const endTime = new Date(`2000-01-01T${input.end_time}`);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          throw new Error('Invalid time format. Use HH:MM:SS format');
        }
        
        if (startTime >= endTime) {
          throw new Error('Start time must be before end time');
        }
      }

      // Update availability
      const updateData: any = {};
      if (input.day_of_week !== undefined) updateData.day_of_week = input.day_of_week;
      if (input.start_time !== undefined) updateData.start_time = input.start_time;
      if (input.end_time !== undefined) updateData.end_time = input.end_time;
      if (input.timezone !== undefined) updateData.timezone = input.timezone;

      const { data: availability, error: availabilityError } = await supabaseAdmin
        .from('coach_availabilities')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (availabilityError) {
        throw new Error('Failed to update coach availability');
      }
      
      return availability ? new CoachAvailability(
        availability.id,
        availability.coach_id,
        availability.day_of_week,
        availability.start_time,
        availability.end_time,
        availability.created_at,
        availability.updated_at,
        availability.timezone
      ) : null;
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update coach availability');
    }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteCoachAvailability(
    @Ctx() context: Context,
    @Arg("id") id: string
  ): Promise<boolean> {
    try {
      // First get the user's profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('auth_id', context.user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User profile not found.');
      }

      // Get the coach record
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('user_id', profile.id)
        .single();
      
      if (coachError || !coach) {
        throw new Error('Coach profile not found.');
      }

      // Verify ownership of the availability
      const { data: existingAvailability, error: checkError } = await supabaseAdmin
        .from('coach_availabilities')
        .select('id, coach_id')
        .eq('id', id)
        .single();
      
      if (checkError || !existingAvailability) {
        throw new Error('Coach availability not found');
      }
      
      if (existingAvailability.coach_id !== coach.id) {
        throw new Error('You can only delete your own availability');
      }

      // Delete availability
      const { error: deleteError } = await supabaseAdmin
        .from('coach_availabilities')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        throw new Error('Failed to delete coach availability');
      }
      
      return true;
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete coach availability');
    }
  }

  @Query(() => [CoachAvailability])
  async getCoachAvailabilities(
    @Arg("filter", { nullable: true }) filter?: CoachAvailabilityFilterInput
  ): Promise<CoachAvailability[]> {
    try {
      let query = supabaseAdmin
        .from('coach_availabilities')
        .select('*');

      if (filter) {
        if (filter.coach_id) {
          query = query.eq('coach_id', filter.coach_id);
        }
        if (filter.day_of_week !== undefined) {
          query = query.eq('day_of_week', filter.day_of_week);
        }
      }

      const { data: availabilities, error } = await query.order('day_of_week').order('start_time');
      
      if (error) {
        throw new Error('Failed to fetch coach availabilities');
      }
      
      return availabilities.map((av: any) => new CoachAvailability(
        av.id,
        av.coach_id,
        av.day_of_week,
        av.start_time,
        av.end_time,
        av.created_at,
        av.updated_at,
        av.timezone
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch coach availabilities');
    }
  }

  @Authorized()
  @Query(() => [CoachAvailability])
  async getMyCoachAvailabilities(
    @Ctx() context: Context
  ): Promise<CoachAvailability[]> {
    try {
      // First get the user's profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('auth_id', context.user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User profile not found.');
      }

      // Get the coach record
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('user_id', profile.id)
        .single();
      
      if (coachError || !coach) {
        throw new Error('Coach profile not found.');
      }

      // Get coach's availabilities
      const { data: availabilities, error } = await supabaseAdmin
        .from('coach_availabilities')
        .select('*')
        .eq('coach_id', coach.id)
        .order('day_of_week')
        .order('start_time');
      
      if (error) {
        throw new Error('Failed to fetch coach availabilities');
      }
      
      return availabilities.map((av: any) => new CoachAvailability(
        av.id,
        av.coach_id,
        av.day_of_week,
        av.start_time,
        av.end_time,
        av.created_at,
        av.updated_at,
        av.timezone
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch coach availabilities');
    }
  }
}

import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from "type-graphql";
import { Coach } from "../entities/Coach";
import { supabaseAdmin } from "../config/supabase";
import { Request } from "express";

interface Context {
  req: Request;
  user: any;
}

@Resolver(Coach)
export class CoachResolver {
  @Authorized()
  @Mutation(() => Coach)
  async becomeCoach(
    @Ctx() context: Context,
    @Arg("bio") bio: string
  ): Promise<Coach> {
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

      // Check if user is already a coach
      const { data: existingCoach, error: checkError } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('user_id', profile.id)
        .single();
      
      if (!checkError && existingCoach) {
        throw new Error('You are already a coach.');
      }

      // Create coach entry
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .insert({
          user_id: profile.id,
          bio: bio
        })
        .select()
        .single();
      
      if (coachError) {
        throw new Error('Failed to create coach profile');
      }
      
      return new Coach(
        coach.id,
        coach.user_id,
        coach.bio,
        coach.created_at
      );
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to become a coach');
    }
  }

  @Authorized()
  @Mutation(() => Coach, { nullable: true })
  async updateCoachProfile(
    @Ctx() context: Context,
    @Arg("bio") bio: string
  ): Promise<Coach | null> {
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

      // Update coach bio
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .update({ bio: bio })
        .eq('user_id', profile.id)
        .select()
        .single();
      
      if (coachError) {
        throw new Error('Failed to update coach profile');
      }
      
      return coach ? new Coach(
        coach.id,
        coach.user_id,
        coach.bio,
        coach.created_at
      ) : null;
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update coach profile');
    }
  }

}

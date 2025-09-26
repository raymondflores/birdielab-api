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
        .from('profiles')
        .select('id')
        .eq('user_id', context.user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('User profile not found. Please create a profile first.');
      }

      // Check if user is already a coach
      const { data: existingCoach, error: checkError } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('profile_id', profile.id)
        .single();
      
      if (!checkError && existingCoach) {
        throw new Error('You are already a coach.');
      }

      // Create coach entry
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .insert({
          profile_id: profile.id,
          bio: bio
        })
        .select()
        .single();
      
      if (coachError) {
        throw new Error('Failed to create coach profile');
      }
      
      return new Coach(
        coach.id,
        coach.profile_id,
        coach.bio,
        coach.created_at
      );
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to become a coach');
    }
  }
}

import { Resolver, Query, Mutation, Arg, Int, Ctx, Authorized } from "type-graphql";
import { Profile } from "../entities/Profile";
import { supabaseAdmin } from "../config/supabase";
import { Request } from "express";

interface Context {
  req: Request;
  user: any;
}

@Resolver(Profile)
export class ProfileResolver {
  @Authorized()
  @Query(() => Profile, { nullable: true })
  async getCurrentProfile(@Ctx() context: Context): Promise<Profile | null> {
    try {
      // Get the user's profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profile')
        .select('*')
        .eq('id', context.user.id)
        .single();
      
      if (profileError) {
        return null;
      }
      
      return profile ? new Profile(
        profile.id,
        profile.name,
        profile.location,
        profile.handicap
      ) : null;
      
    } catch (error) {
      return null;
    }
  }

  @Authorized()
  @Mutation(() => Profile, { nullable: true })
  async updateProfile(
    @Ctx() context: Context,
    @Arg("name", { nullable: true }) name?: string,
    @Arg("location", { nullable: true }) location?: string,
    @Arg("handicap", () => Int, { nullable: true }) handicap?: number
  ): Promise<Profile | null> {    
    try {      
      // Prepare update data
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (location !== undefined) updateData.location = location;
      if (handicap !== undefined) updateData.handicap = handicap;
      
      // Check if profile exists, if not create it
      const { data: existingProfile, error: fetchError } = await supabaseAdmin
        .from('profile')
        .select('*')
        .eq('id', context.user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error('Failed to fetch profile');
      }
      
      let result;
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabaseAdmin
          .from('profile')
          .update(updateData)
          .eq('id', context.user.id)
          .select()
          .single();
        
        if (error) {
          throw new Error('Failed to update profile');
        }
        
        result = data;
      } else {
        // Create new profile
        const profileData = {
          id: context.user.id,
          name: name || '',
          location: location || '',
          handicap: handicap || 0,
        };
        
        const { data, error } = await supabaseAdmin
          .from('profile')
          .insert(profileData)
          .select()
          .single();
        
        if (error) {
          throw new Error('Failed to create profile');
        }
        
        result = data;
      }
      
      return result ? new Profile(
        result.id,
        result.name,
        result.location,
        result.handicap
      ) : null;
      
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  }
}

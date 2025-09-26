import { Resolver, Query, Mutation, Arg, Int, Ctx, Authorized, FieldResolver, Root } from "type-graphql";
import { Profile } from "../entities/Profile";
import { Coach } from "../entities/Coach";
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
        .from('profiles')
        .select('*')
        .eq('user_id', context.user.id)
        .single();
      
      if (profileError) {
        return null;
      }
      
      return profile ? new Profile(
        profile.id,
        profile.user_id,
        profile.name,
        profile.location,
        profile.handicap,
        profile.created_at
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
        .from('profiles')
        .select('*')
        .eq('user_id', context.user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error('Failed to fetch profile');
      }
      
      let result;
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('user_id', context.user.id)
          .select()
          .single();
        
        if (error) {
          throw new Error('Failed to update profile');
        }
        
        result = data;
      } else {
        // Create new profile
        const profileData = {
          user_id: context.user.id,
          name: name,
          location: location,
          handicap: handicap,
        };
        
        const { data, error } = await supabaseAdmin
          .from('profiles')
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
        result.user_id,
        result.name,
        result.location,
        result.handicap,
        result.created_at
      ) : null;
      
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  }

  @FieldResolver(() => Coach, { nullable: true })
  async coach(@Root() profile: Profile): Promise<Coach | null> {
    try {
      const { data: coach, error } = await supabaseAdmin
        .from('coaches')
        .select('*')
        .eq('profile_id', profile.id)
        .single();
      
      if (error || !coach) {
        return null;
      }
      
      return new Coach(
        coach.id,
        coach.profile_id,
        coach.bio,
        coach.created_at
      );
    } catch (error) {
      return null;
    }
  }

  @Query(() => [Profile])
  async coaches(): Promise<Profile[]> {
    try {
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select(`
          id,
          user_id,
          name,
          location,
          handicap,
          created_at,
          coaches!inner(
            id,
            profile_id,
            bio,
            created_at
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error('Failed to fetch coach profiles');
      }
      
      return profiles.map((profile: any) => new Profile(
        profile.id,
        profile.user_id,
        profile.name,
        profile.location,
        profile.handicap,
        profile.created_at
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch coach profiles');
    }
  }
}

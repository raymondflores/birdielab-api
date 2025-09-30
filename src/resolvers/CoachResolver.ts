import { Resolver, Query, Mutation, Arg, Ctx, Authorized, Int } from "type-graphql";
import { Coach } from "../entities/Coach";
import { User } from "../entities/User";
import { supabaseAdmin } from "../config/supabase";
import { Request } from "express";

interface Context {
  req: Request;
  user: any; // Database user object
}

@Resolver(Coach)
export class CoachResolver {
  @Authorized()
  @Mutation(() => Coach)
  async becomeCoach(
    @Ctx() context: Context,
    @Arg("bio") bio: string,
    @Arg("name") name: string,
    @Arg("country") country: string,
    @Arg("city", { nullable: true }) city?: string,
    @Arg("state", { nullable: true }) state?: string
  ): Promise<Coach> {
    try {
      // Check if user is already a coach
      const { data: existingCoach, error: checkError } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('user_id', context.user.id)
        .single();
      
      if (!checkError && existingCoach) {
        throw new Error('You are already a coach.');
      }

      // Update user profile with name and location fields
      const updateData: any = {
        name: name,
        country: country
      };
      
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      
      const { error: userError } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', context.user.id);
      
      if (userError) {
        throw new Error('Failed to update user profile');
      }

      // Create coach entry
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .insert({
          user_id: context.user.id,
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
    @Arg("bio") bio: string,
    @Arg("name", { nullable: true }) name?: string,
    @Arg("city", { nullable: true }) city?: string,
    @Arg("state", { nullable: true }) state?: string,
    @Arg("country", { nullable: true }) country?: string,
    @Arg("handicap", () => Int, { nullable: true }) handicap?: number
  ): Promise<Coach | null> {
    try {
      // Update user profile if any user fields provided
      if (name !== undefined || city !== undefined || state !== undefined || country !== undefined || handicap !== undefined) {
        const userUpdateData: any = {};
        if (name !== undefined) userUpdateData.name = name;
        if (city !== undefined) userUpdateData.city = city;
        if (state !== undefined) userUpdateData.state = state;
        if (country !== undefined) userUpdateData.country = country;
        if (handicap !== undefined) userUpdateData.handicap = handicap;
        
        const { error: userError } = await supabaseAdmin
          .from('users')
          .update(userUpdateData)
          .eq('id', context.user.id);
        
        if (userError) {
          throw new Error('Failed to update user profile');
        }
      }

      // Update coach bio
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .update({ bio: bio })
        .eq('user_id', context.user.id)
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

  @Authorized()
  @Query(() => [User])
  async myStudents(@Ctx() context: Context): Promise<User[]> {
    try {
      // Check if the user is a coach using auth_id directly
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('user_id', context.user.id)
        .single();
      
      if (coachError || !coach) {
        throw new Error('User is not a coach.');
      }

      // Get all unique students who have lessons with this coach
      const { data: students, error } = await supabaseAdmin
        .from('lessons')
        .select(`
          student_id,
          users!lessons_student_id_fkey(
            id,
            auth_id,
            name,
            location,
            handicap,
            created_at
          )
        `)
        .eq('coach_id', coach.id)
        .neq('status', 'CANCELLED'); // Exclude cancelled lessons
      
      if (error) {
        throw new Error('Failed to fetch students');
      }

      // Extract unique students from the results
      const uniqueStudents = new Map();
      students.forEach((lesson: any) => {
        if (lesson.users) {
          uniqueStudents.set(lesson.users.id, lesson.users);
        }
      });

      return Array.from(uniqueStudents.values()).map((student: any) => new User(
        student.id,
        student.auth_id,
        student.name,
        student.country,
        student.handicap,
        student.created_at,
        student.city || undefined,
        student.state || undefined
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch students');
    }
  }

}

import { Resolver, Query, Mutation, Arg, Int, Ctx, Authorized, FieldResolver, Root } from "type-graphql";
import { User } from "../entities/User";
import { Coach } from "../entities/Coach";
import { supabaseAdmin } from "../config/supabase";
import { Request } from "express";

interface Context {
  req: Request;
  user: any;
}

@Resolver(User)
export class UserResolver {
  @Authorized()
  @Query(() => User, { nullable: true })
  async getCurrentUser(@Ctx() context: Context): Promise<User | null> {
    try {
      // Get the user's profile
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_id', context.user.id)
        .single();
      
      if (userError) {
        return null;
      }
      
      return user ? new User(
        user.id,
        user.auth_id,
        user.name,
        user.location,
        user.handicap,
        user.created_at
      ) : null;
      
    } catch (error) {
      return null;
    }
  }

  @Authorized()
  @Mutation(() => User, { nullable: true })
  async updateUser(
    @Ctx() context: Context,
    @Arg("name", { nullable: true }) name?: string,
    @Arg("location", { nullable: true }) location?: string,
    @Arg("handicap", () => Int, { nullable: true }) handicap?: number
  ): Promise<User | null> {    
    try {      
      // Prepare update data
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (location !== undefined) updateData.location = location;
      if (handicap !== undefined) updateData.handicap = handicap;
      
      // Check if user exists, if not create it
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_id', context.user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error('Failed to fetch user');
      }
      
      let result;
      if (existingUser) {
        // Update existing user
        const { data, error } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('auth_id', context.user.id)
          .select()
          .single();
        
        if (error) {
          throw new Error('Failed to update user');
        }
        
        result = data;
      } else {
        // Create new user
        const userData = {
          auth_id: context.user.id,
          name: name,
          location: location,
          handicap: handicap,
        };
        
        const { data, error } = await supabaseAdmin
          .from('users')
          .insert(userData)
          .select()
          .single();
        
        if (error) {
          throw new Error('Failed to create user');
        }
        
        result = data;
      }
      
      return result ? new User(
        result.id,
        result.auth_id,
        result.name,
        result.location,
        result.handicap,
        result.created_at
      ) : null;
      
    } catch (error) {
      throw new Error('Failed to update user');
    }
  }

  @FieldResolver(() => Coach, { nullable: true })
  async coach(@Root() user: User): Promise<Coach | null> {
    try {
      const { data: coach, error } = await supabaseAdmin
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error || !coach) {
        return null;
      }
      
      return new Coach(
        coach.id,
        coach.user_id,
        coach.bio,
        coach.created_at
      );
    } catch (error) {
      return null;
    }
  }

  @Authorized()
  @Query(() => [User])
  async coaches(@Ctx() context: Context): Promise<User[]> {
    try {
      // First get the current user to exclude them from results
      const { data: currentUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('auth_id', context.user.id)
        .single();
      
      if (userError || !currentUser) {
        throw new Error('User not found.');
      }

      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select(`
          id,
          auth_id,
          name,
          location,
          handicap,
          created_at,
          coaches!inner(
            id,
            user_id,
            bio,
            created_at
          )
        `)
        .neq('id', currentUser.id) // Exclude current user
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error('Failed to fetch coach users');
      }
      
      return users.map((user: any) => new User(
        user.id,
        user.auth_id,
        user.name,
        user.location,
        user.handicap,
        user.created_at
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch coach users');
    }
  }
}

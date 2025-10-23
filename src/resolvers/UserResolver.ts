import { Resolver, Query, Mutation, Arg, Int, Ctx, Authorized } from "type-graphql";
import { User } from "../entities/User";
import { supabaseAdmin } from "../config/supabase";
import { Request } from "express";

interface Context {
  req: Request;
  user: any; // Database user object
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
        .eq('id', context.user.id)
        .single();
      
      if (userError) {
        return null;
      }
      
      return user ? new User(
        user.id,
        user.auth_id,
        user.name,
        user.country,
        user.handicap,
        user.created_at,
        user.city || undefined,
        user.state || undefined
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
    @Arg("city", { nullable: true }) city?: string,
    @Arg("state", { nullable: true }) state?: string,
    @Arg("country", { nullable: true }) country?: string,
    @Arg("handicap", () => Int, { nullable: true }) handicap?: number
  ): Promise<User | null> {    
    try {      
      // Prepare update data
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (city !== undefined) updateData.city = city;
      if (state !== undefined) updateData.state = state;
      if (country !== undefined) updateData.country = country;
      if (handicap !== undefined) updateData.handicap = handicap;
      
      // Check if user exists, if not create it
      const { data: existingUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', context.user.id)
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
          .eq('id', context.user.id)
          .select()
          .single();
        
        if (error) {
          throw new Error('Failed to update user');
        }
        
        result = data;
      } else {
        // Create new user
        const userData = {
          auth_id: context.user.auth_id,
          name: name,
          city: city,
          state: state,
          country: country,
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
        result.country,
        result.handicap,
        result.created_at,
        result.city || undefined,
        result.state || undefined
      ) : null;
      
    } catch (error) {
      throw new Error('Failed to update user');
    }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteUser(@Ctx() context: Context): Promise<boolean> {
    try {
      const userId = context.user.id;
      const authId = context.user.auth_id;

      // First, delete the user record from the users table
      const { error: deleteUserError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteUserError) {
        console.error('Failed to delete user from database:', deleteUserError);
        throw new Error('Failed to delete user account');
      }

      // Then, delete the auth user from Supabase Auth
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authId);

      if (deleteAuthError) {
        console.error('Failed to delete auth user:', deleteAuthError);
        throw new Error('Failed to delete user authentication');
      }

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user account');
    }
  }

}

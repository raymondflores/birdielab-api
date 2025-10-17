import { Resolver, Mutation, Arg, Ctx, Authorized } from "type-graphql";
import { UserFeedback } from "../entities/UserFeedback";
import { supabaseAdmin } from "../config/supabase";
import { Request } from "express";

interface Context {
  req: Request;
  user: any; // Database user object
}

@Resolver(UserFeedback)
export class UserFeedbackResolver {
  @Authorized()
  @Mutation(() => UserFeedback)
  async submitFeedback(
    @Ctx() context: Context,
    @Arg("comment") comment: string
  ): Promise<UserFeedback> {
    try {
      // Insert feedback into the database
      const { data, error } = await supabaseAdmin
        .from('user_feedback')
        .insert({
          user_id: context.user.id,
          comment: comment
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to submit feedback');
      }

      return new UserFeedback(
        data.id,
        data.user_id,
        data.comment,
        data.created_at
      );
      
    } catch (error) {
      throw new Error('Failed to submit feedback');
    }
  }
}

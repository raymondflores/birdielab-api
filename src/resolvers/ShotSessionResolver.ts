import { Resolver, Query, Mutation, FieldResolver, Root, Arg, Ctx, Authorized, InputType, Field, ID, Int, Float } from "type-graphql";
import { ShotSession } from "../entities/ShotSession";
import { ShotAttempt } from "../entities/ShotAttempt";
import { supabaseAdmin } from "../config/supabase";
import { Request } from "express";

interface Context {
  req: Request;
  user: any; // Database user object
}

@InputType()
class ShotAttemptInput {
  @Field()
  club!: string;

  @Field()
  shot_type!: string;

  @Field({ nullable: true, description: "Must be 'Base' or 'Advanced'" })
  difficulty?: string;

  @Field()
  success!: boolean;
}

@Resolver(ShotSession)
export class ShotSessionResolver {
  @Authorized()
  @Query(() => [ShotSession])
  async myShotSessions(@Ctx() context: Context): Promise<ShotSession[]> {
    try {
      const { data: sessions, error } = await supabaseAdmin
        .from('shot_sessions')
        .select('*')
        .eq('user_id', context.user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error('Failed to fetch shot sessions');
      }
      
      return sessions.map((session: any) => new ShotSession(
        session.id,
        session.user_id,
        session.started_at,
        session.created_at,
        session.ended_at
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch shot sessions');
    }
  }

  @Authorized()
  @Query(() => ShotSession, { nullable: true })
  async shotSession(
    @Ctx() context: Context,
    @Arg("sessionId") sessionId: string
  ): Promise<ShotSession | null> {
    try {
      const { data: session, error } = await supabaseAdmin
        .from('shot_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', context.user.id)
        .single();
      
      if (error || !session) {
        return null;
      }
      
      return new ShotSession(
        session.id,
        session.user_id,
        session.started_at,
        session.created_at,
        session.ended_at
      );
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch shot session');
    }
  }

  @Authorized()
  @Query(() => [ShotAttempt])
  async shotAttempts(
    @Ctx() context: Context,
    @Arg("sessionId") sessionId: string
  ): Promise<ShotAttempt[]> {
    try {
      // First verify the session belongs to the user
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('shot_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', context.user.id)
        .single();
      
      if (sessionError || !session) {
        throw new Error('Shot session not found or access denied');
      }

      const { data: attempts, error } = await supabaseAdmin
        .from('shot_attempts')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw new Error('Failed to fetch shot attempts');
      }
      
      return attempts.map((attempt: any) => new ShotAttempt(
        attempt.id,
        attempt.session_id,
        attempt.club,
        attempt.shot_type,
        attempt.success,
        attempt.created_at,
        attempt.difficulty
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch shot attempts');
    }
  }

  @Authorized()
  @Mutation(() => ShotSession)
  async startShotSession(@Ctx() context: Context): Promise<ShotSession> {
    try {
      const { data: session, error } = await supabaseAdmin
        .from('shot_sessions')
        .insert({
          user_id: context.user.id
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        throw new Error('Failed to start shot session');
      }

      return new ShotSession(
        session.id,
        session.user_id,
        session.started_at,
        session.created_at,
        session.ended_at
      );
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to start shot session');
    }
  }

  @Authorized()
  @Mutation(() => ShotAttempt)
  async recordShotAttempt(
    @Ctx() context: Context,
    @Arg("sessionId") sessionId: string,
    @Arg("shot") shot: ShotAttemptInput
  ): Promise<ShotAttempt> {
    try {
      // Validate difficulty if provided
      if (shot.difficulty && !['Base', 'Advanced'].includes(shot.difficulty)) {
        throw new Error('Difficulty must be either "Base" or "Advanced"');
      }

      // First verify the session belongs to the user and is still active (no ended_at)
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('shot_sessions')
        .select('id, ended_at')
        .eq('id', sessionId)
        .eq('user_id', context.user.id)
        .single();
      
      if (sessionError || !session) {
        console.error(sessionError);
        throw new Error('Shot session not found or access denied');
      }

      if (session.ended_at) {
        console.error(session.ended_at);
        throw new Error('Cannot record shot to an ended session');
      }

      // Record the shot attempt
      const { data: attempt, error: attemptError } = await supabaseAdmin
        .from('shot_attempts')
        .insert({
          session_id: sessionId,
          club: shot.club,
          shot_type: shot.shot_type,
          difficulty: shot.difficulty,
          success: shot.success
        })
        .select()
        .single();

      if (attemptError) {
        console.error(attemptError);
        throw new Error('Failed to record shot attempt');
      }

      return new ShotAttempt(
        attempt.id,
        attempt.session_id,
        attempt.club,
        attempt.shot_type,
        attempt.success,
        attempt.created_at,
        attempt.difficulty
      );
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to record shot attempt');
    }
  }

  @Authorized()
  @Mutation(() => ShotSession)
  async endShotSession(
    @Ctx() context: Context,
    @Arg("sessionId") sessionId: string
  ): Promise<ShotSession> {
    try {
      // Verify the session belongs to the user
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('shot_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', context.user.id)
        .single();
      
      if (sessionError || !session) {
        throw new Error('Shot session not found or access denied');
      }

      // End the session
      const { data: updatedSession, error: updateError } = await supabaseAdmin
        .from('shot_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) {
        throw new Error('Failed to end shot session');
      }

      return new ShotSession(
        updatedSession.id,
        updatedSession.user_id,
        updatedSession.started_at,
        updatedSession.created_at,
        updatedSession.ended_at
      );
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to end shot session');
    }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deleteShotSession(
    @Ctx() context: Context,
    @Arg("sessionId") sessionId: string
  ): Promise<boolean> {
    try {
      // Verify the session belongs to the user
      const { data: session, error: sessionError } = await supabaseAdmin
        .from('shot_sessions')
        .select('id')
        .eq('id', sessionId)
        .eq('user_id', context.user.id)
        .single();
      
      if (sessionError || !session) {
        throw new Error('Shot session not found or access denied');
      }

      // Delete the session (attempts will be cascade deleted)
      const { error: deleteError } = await supabaseAdmin
        .from('shot_sessions')
        .delete()
        .eq('id', sessionId);

      if (deleteError) {
        throw new Error('Failed to delete shot session');
      }

      return true;
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete shot session');
    }
  }


  @FieldResolver(() => [ShotAttempt])
  async attempts(@Root() shotSession: ShotSession): Promise<ShotAttempt[]> {
    try {
      const { data: attempts, error } = await supabaseAdmin
        .from('shot_attempts')
        .select('*')
        .eq('session_id', shotSession.id)
        .order('created_at', { ascending: true });
      
      if (error) {
        throw new Error('Failed to fetch shot attempts');
      }
      
      return attempts.map((attempt: any) => new ShotAttempt(
        attempt.id,
        attempt.session_id,
        attempt.club,
        attempt.shot_type,
        attempt.success,
        attempt.created_at,
        attempt.difficulty
      ));
      
    } catch (error) {
      return [];
    }
  }

  @FieldResolver(() => Int)
  async total_shots(@Root() shotSession: ShotSession): Promise<number> {
    try {
      const { data: attempts, error } = await supabaseAdmin
        .from('shot_attempts')
        .select('id')
        .eq('session_id', shotSession.id);
      
      if (error || !attempts) {
        return 0;
      }
      
      return attempts.length;
      
    } catch (error) {
      return 0;
    }
  }

  @FieldResolver(() => Float, { nullable: true })
  async success_rate(@Root() shotSession: ShotSession): Promise<number | null> {
    try {
      const { data: attempts, error } = await supabaseAdmin
        .from('shot_attempts')
        .select('success')
        .eq('session_id', shotSession.id);
      
      if (error || !attempts || attempts.length === 0) {
        return null;
      }
      
      const successfulShots = attempts.filter((a: any) => a.success).length;
      const successRate = (successfulShots / attempts.length) * 100;
      
      return Math.round(successRate * 100) / 100; // Round to 2 decimal places
      
    } catch (error) {
      return null;
    }
  }
}


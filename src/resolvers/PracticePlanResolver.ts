import { Resolver, Query, Mutation, FieldResolver, Root, Arg, Ctx, Authorized, InputType, Field, ID, Int } from "type-graphql";
import { PracticePlan } from "../entities/PracticePlan";
import { PracticePlanDrill } from "../entities/PracticePlanDrill";
import { supabaseAdmin } from "../config/supabase";
import { Request } from "express";

interface Context {
  req: Request;
  user: any; // Database user object
}

@InputType()
class DrillInput {
  @Field(() => ID)
  drill_id!: string;

  @Field(() => Int)
  position!: number;

  @Field({ nullable: true })
  notes?: string;
}

@Resolver(PracticePlan)
export class PracticePlanResolver {
  @Query(() => [PracticePlan])
  async practicePlans(): Promise<PracticePlan[]> {
    try {
      const { data: practicePlans, error } = await supabaseAdmin
        .from('practice_plans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error('Failed to fetch practice plans');
      }
      
      return practicePlans.map((plan: any) => new PracticePlan(
        plan.id,
        plan.name,
        plan.user_id,
        plan.description,
        plan.is_global,
        plan.created_at
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch practice plans');
    }
  }

  @Query(() => [PracticePlanDrill])
  async practicePlanDrills(@Arg("planId") planId: string): Promise<PracticePlanDrill[]> {
    console.log('practice plans')
    try {
      const { data: drills, error } = await supabaseAdmin
        .from('practice_plan_drills')
        .select('*')
        .eq('plan_id', planId)
        .order('position', { ascending: true });
      
      if (error) {
        console.log(error)
        throw new Error('Failed to fetch practice plan drills');
      }
      
      return drills.map((drill: any) => new PracticePlanDrill(
        drill.id,
        drill.plan_id,
        drill.drill_id,
        drill.position,
        drill.notes,
        drill.created_at
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch practice plan drills');
    }
  }

  @Authorized()
  @Mutation(() => PracticePlan)
  async createPracticePlan(
    @Ctx() context: Context,
    @Arg("name") name: string,
    @Arg("description", { nullable: true }) description?: string,
    @Arg("drills", () => [DrillInput], { nullable: true }) drills?: DrillInput[]
  ): Promise<PracticePlan> {
    try {
      // Create the practice plan
      const { data: plan, error: planError } = await supabaseAdmin
        .from('practice_plans')
        .insert({
          user_id: context.user.id,
          name: name,
          description: description,
          is_global: false
        })
        .select()
        .single();

      if (planError) {
        throw new Error('Failed to create practice plan');
      }

      // If drills are provided, add them to the practice plan
      if (drills && drills.length > 0) {
        const drillsToInsert = drills.map(drill => ({
          plan_id: plan.id,
          drill_id: drill.drill_id,
          position: drill.position,
          notes: drill.notes
        }));

        const { error: drillsError } = await supabaseAdmin
          .from('practice_plan_drills')
          .insert(drillsToInsert);

        if (drillsError) {
          // Rollback: delete the practice plan if drills insertion fails
          await supabaseAdmin
            .from('practice_plans')
            .delete()
            .eq('id', plan.id);
          throw new Error('Failed to add drills to practice plan');
        }
      }

      return new PracticePlan(
        plan.id,
        plan.name,
        plan.user_id,
        plan.description,
        plan.is_global,
        plan.created_at
      );

    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create practice plan');
    }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async deletePracticePlan(
    @Ctx() context: Context,
    @Arg("planId") planId: string
  ): Promise<boolean> {
    try {
      // First, verify that the practice plan belongs to the authenticated user
      const { data: plan, error: fetchError } = await supabaseAdmin
        .from('practice_plans')
        .select('id, user_id')
        .eq('id', planId)
        .single();

      if (fetchError || !plan) {
        throw new Error('Practice plan not found');
      }

      // Check if the user owns this practice plan
      if (plan.user_id !== context.user.id) {
        throw new Error('You do not have permission to delete this practice plan');
      }

      // Delete the practice plan (drills will be cascade deleted if foreign key is set up correctly)
      const { error: deleteError } = await supabaseAdmin
        .from('practice_plans')
        .delete()
        .eq('id', planId);

      if (deleteError) {
        throw new Error('Failed to delete practice plan');
      }

      return true;

    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete practice plan');
    }
  }

  @FieldResolver(() => Number, { nullable: true })
  async total_duration_minutes(@Root() practicePlan: PracticePlan): Promise<number | null> {
    try {
      const { data: drills, error } = await supabaseAdmin
        .from('practice_plan_drills')
        .select(`
          drill_id,
          drills!inner(
            duration_minutes
          )
        `)
        .eq('plan_id', practicePlan.id);
      
      if (error) {
        throw new Error('Failed to fetch practice plan drills');
      }
      
      if (!drills || drills.length === 0) {
        return 0;
      }
      
      const totalDuration = drills.reduce((sum: number, drill: any) => {
        return sum + (drill.drills?.duration_minutes || 0);
      }, 0);
      
      return totalDuration;
    } catch (error) {
      throw new Error('Failed to calculate total duration');
    }
  }

  @FieldResolver(() => String, { nullable: true })
  async overall_difficulty(@Root() practicePlan: PracticePlan): Promise<string | null> {
    try {
      const { data: drills, error } = await supabaseAdmin
        .from('practice_plan_drills')
        .select(`
          drill_id,
          drills!inner(
            difficulty
          )
        `)
        .eq('plan_id', practicePlan.id);
      
      if (error) {
        throw new Error('Failed to fetch practice plan drills');
      }
      
      if (!drills || drills.length === 0) {
        return null;
      }
      
      // Get all difficulties from drills
      const difficulties = drills
        .map((drill: any) => drill.drills?.difficulty)
        .filter(difficulty => difficulty); // Remove null/undefined values
      
      if (difficulties.length === 0) {
        return null;
      }
      
      // Determine overall difficulty based on the highest difficulty found
      // Priority: Advanced > Intermediate > Beginner
      const difficultyLevels = {
        'Advanced': 3,
        'Intermediate': 2,
        'Beginner': 1
      };
      
      const maxDifficulty = difficulties.reduce((max: string, current: string) => {
        const currentLevel = difficultyLevels[current as keyof typeof difficultyLevels] || 0;
        const maxLevel = difficultyLevels[max as keyof typeof difficultyLevels] || 0;
        return currentLevel > maxLevel ? current : max;
      }, difficulties[0]);
      
      return maxDifficulty;
    } catch (error) {
      throw new Error('Failed to calculate overall difficulty');
    }
  }
}

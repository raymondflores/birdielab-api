import { Resolver, Query, FieldResolver, Root, Arg } from "type-graphql";
import { PracticePlan } from "../entities/PracticePlan";
import { PracticePlanDrill } from "../entities/PracticePlanDrill";
import { supabaseAdmin } from "../config/supabase";

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
    try {
      const { data: drills, error } = await supabaseAdmin
        .from('practice_plan_drills')
        .select('*')
        .eq('plan_id', planId)
        .order('position', { ascending: true });
      
      if (error) {
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

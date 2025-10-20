import { Resolver, Query } from "type-graphql";
import { Drill } from "../entities/Drill";
import { supabaseAdmin } from "../config/supabase";

@Resolver(Drill)
export class DrillResolver {
  @Query(() => [Drill])
  async drills(): Promise<Drill[]> {
    try {
      const { data: drills, error } = await supabaseAdmin
        .from('drills')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error('Failed to fetch drills');
      }
      
      return drills.map((drill: any) => new Drill(
        drill.id,
        drill.name,
        drill.created_at,
        drill.skill_focus,
        drill.duration_minutes,
        drill.difficulty,
        drill.instructions
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch drills');
    }
  }
}

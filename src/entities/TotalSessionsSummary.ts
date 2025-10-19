import { ObjectType, Field, ID, Int, Float } from "type-graphql";
import GraphQLJSON from "graphql-type-json";

@ObjectType()
export class PerformanceStats {
  @Field(() => Int)
  attempts: number;

  @Field(() => Int)
  success_shots: number;

  constructor(attempts: number, success_shots: number) {
    this.attempts = attempts;
    this.success_shots = success_shots;
  }
}

@ObjectType()
export class TotalSessionsSummary {
  @Field(() => Int)
  total_shots: number;

  @Field(() => Int)
  success_shots: number;

  @Field(() => GraphQLJSON)
  club_performance: Record<string, PerformanceStats>;

  @Field(() => GraphQLJSON)
  shot_type_performance: Record<string, PerformanceStats>;

  constructor(
    total_shots: number,
    success_shots: number,
    club_performance: Record<string, PerformanceStats>,
    shot_type_performance: Record<string, PerformanceStats>
  ) {
    this.total_shots = total_shots;
    this.success_shots = success_shots;
    this.club_performance = club_performance;
    this.shot_type_performance = shot_type_performance;
  }
}


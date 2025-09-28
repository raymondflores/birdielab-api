import { ObjectType, Field, ID, Int } from "type-graphql";
import { Coach } from "./Coach";

@ObjectType()
export class CoachAvailability {
  @Field(() => ID)
  id: string;

  @Field()
  coach_id: string;

  @Field(() => Int)
  day_of_week: number; // 0 = Sunday, 6 = Saturday

  @Field()
  start_time: string; // TIME format (HH:MM:SS)

  @Field()
  end_time: string; // TIME format (HH:MM:SS)

  @Field({ nullable: true })
  timezone?: string; // Timezone text (e.g., "America/New_York", "EST", "UTC-5")

  @Field()
  created_at: string;

  @Field()
  updated_at: string;

  @Field(() => Coach, { nullable: true })
  coach?: Coach;

  constructor(
    id: string,
    coach_id: string,
    day_of_week: number,
    start_time: string,
    end_time: string,
    created_at: string,
    updated_at: string,
    timezone?: string
  ) {
    this.id = id;
    this.coach_id = coach_id;
    this.day_of_week = day_of_week;
    this.start_time = start_time;
    this.end_time = end_time;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.timezone = timezone;
  }
}

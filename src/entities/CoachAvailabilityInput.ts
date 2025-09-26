import { InputType, Field, Int } from "type-graphql";

@InputType()
export class CreateCoachAvailabilityInput {
  @Field(() => Int)
  day_of_week!: number; // 0 = Sunday, 6 = Saturday

  @Field()
  start_time!: string; // TIME format (HH:MM:SS)

  @Field()
  end_time!: string; // TIME format (HH:MM:SS)
}

@InputType()
export class UpdateCoachAvailabilityInput {
  @Field(() => Int, { nullable: true })
  day_of_week?: number;

  @Field({ nullable: true })
  start_time?: string;

  @Field({ nullable: true })
  end_time?: string;
}

@InputType()
export class CoachAvailabilityFilterInput {
  @Field(() => Int, { nullable: true })
  day_of_week?: number;

  @Field({ nullable: true })
  coach_id?: string;
}

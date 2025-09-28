import { InputType, Field } from "type-graphql";
import { LessonStatus } from "./Lesson";

@InputType()
export class CreateLessonInput {
  @Field()
  coach_id!: string;

  @Field()
  start_time!: string; // ISO timestamp

  @Field()
  end_time!: string; // ISO timestamp
}

@InputType()
export class UpdateLessonInput {
  @Field({ nullable: true })
  start_time?: string;

  @Field({ nullable: true })
  end_time?: string;

  @Field(() => String, { nullable: true })
  status?: LessonStatus;
}

@InputType()
export class LessonFilterInput {
  @Field({ nullable: true })
  coach_id?: string;

  @Field({ nullable: true })
  student_id?: string;

  @Field(() => String, { nullable: true })
  status?: LessonStatus;

  @Field({ nullable: true })
  date?: string; // ISO date format for filtering by date
}

@InputType()
export class AvailableSlotsInput {
  @Field()
  coach_id!: string;

  @Field()
  date!: string; // ISO date format (YYYY-MM-DD)

  @Field({ nullable: true })
  duration_minutes?: number; // Default lesson duration in minutes
}

import { ObjectType, Field, ID } from "type-graphql";
import { User } from "./User";

export enum LessonStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed"
}

@ObjectType()
export class Lesson {
  @Field(() => ID)
  id: string;

  @Field()
  coach_id: string;

  @Field()
  student_id: string;

  @Field()
  start_time: string; // ISO timestamp

  @Field()
  end_time: string; // ISO timestamp

  @Field(() => String)
  status: LessonStatus;

  @Field()
  created_at: string;

  @Field()
  updated_at: string;

  @Field(() => User, { nullable: true })
  coach?: User;

  @Field(() => User, { nullable: true })
  student?: User;

  constructor(
    id: string,
    coach_id: string,
    student_id: string,
    start_time: string,
    end_time: string,
    status: LessonStatus,
    created_at: string,
    updated_at: string
  ) {
    this.id = id;
    this.coach_id = coach_id;
    this.student_id = student_id;
    this.start_time = start_time;
    this.end_time = end_time;
    this.status = status;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

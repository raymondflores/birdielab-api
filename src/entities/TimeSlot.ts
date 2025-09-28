import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class TimeSlot {
  @Field()
  start_time: string; // ISO timestamp

  @Field()
  end_time: string; // ISO timestamp

  @Field()
  duration_minutes: number;

  constructor(start_time: string, end_time: string, duration_minutes: number) {
    this.start_time = start_time;
    this.end_time = end_time;
    this.duration_minutes = duration_minutes;
  }
}

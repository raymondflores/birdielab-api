import { ObjectType, Field, ID, Int, Float } from "type-graphql";

@ObjectType()
export class ShotSession {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  user_id: string;

  @Field()
  started_at: string;

  @Field({ nullable: true })
  ended_at?: string;

  @Field(() => Int)
  total_shots?: number;

  @Field(() => Float, { nullable: true })
  success_rate?: number;

  @Field()
  created_at: string;

  constructor(
    id: string,
    user_id: string,
    started_at: string,
    created_at: string,
    ended_at?: string
  ) {
    this.id = id;
    this.user_id = user_id;
    this.started_at = started_at;
    this.ended_at = ended_at;
    this.created_at = created_at;
  }
}


import { ObjectType, Field, ID, Int } from "type-graphql";

@ObjectType()
export class PracticePlan {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { nullable: true })
  user_id?: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  is_global?: boolean;

  @Field({ nullable: true })
  created_at?: string;

  @Field(() => Int, { nullable: true })
  total_duration_minutes?: number;

  @Field({ nullable: true })
  overall_difficulty?: string;

  constructor(
    id: string,
    name: string,
    user_id?: string,
    description?: string,
    is_global?: boolean,
    created_at?: string
  ) {
    this.id = id;
    this.name = name;
    this.user_id = user_id;
    this.description = description;
    this.is_global = is_global;
    this.created_at = created_at;
  }
}

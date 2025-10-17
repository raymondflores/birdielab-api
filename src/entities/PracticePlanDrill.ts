import { ObjectType, Field, ID, Int } from "type-graphql";

@ObjectType()
export class PracticePlanDrill {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { nullable: true })
  plan_id?: string;

  @Field(() => ID, { nullable: true })
  drill_id?: string;

  @Field(() => Int, { nullable: true })
  position?: number;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  created_at?: string;

  constructor(
    id: string,
    plan_id?: string,
    drill_id?: string,
    position?: number,
    notes?: string,
    created_at?: string
  ) {
    this.id = id;
    this.plan_id = plan_id;
    this.drill_id = drill_id;
    this.position = position;
    this.notes = notes;
    this.created_at = created_at;
  }
}

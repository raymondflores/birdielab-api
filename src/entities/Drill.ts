import { ObjectType, Field, ID, Int } from "type-graphql";

@ObjectType()
export class Drill {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  skill_focus?: string;

  @Field(() => Int, { nullable: true })
  duration_minutes?: number;

  @Field({ nullable: true })
  difficulty?: string;

  @Field({ nullable: true })
  instructions?: string;

  @Field()
  created_at: string;

  constructor(
    id: string,
    name: string,
    created_at: string,
    skill_focus?: string,
    duration_minutes?: number,
    difficulty?: string,
    instructions?: string
  ) {
    this.id = id;
    this.name = name;
    this.created_at = created_at;
    this.skill_focus = skill_focus;
    this.duration_minutes = duration_minutes;
    this.difficulty = difficulty;
    this.instructions = instructions;
  }
}

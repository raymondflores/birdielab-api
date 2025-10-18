import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
export class ShotAttempt {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  session_id: string;

  @Field()
  club: string;

  @Field()
  shot_type: string;

  @Field({ nullable: true })
  difficulty?: string;

  @Field()
  success: boolean;

  @Field()
  created_at: string;

  constructor(
    id: string,
    session_id: string,
    club: string,
    shot_type: string,
    success: boolean,
    created_at: string,
    difficulty?: string
  ) {
    this.id = id;
    this.session_id = session_id;
    this.club = club;
    this.shot_type = shot_type;
    this.difficulty = difficulty;
    this.success = success;
    this.created_at = created_at;
  }
}


import { ObjectType, Field, ID } from "type-graphql";
import { CoachAvailability } from "./CoachAvailability";

@ObjectType()
export class Coach {
  @Field(() => ID)
  id: string;

  @Field()
  profile_id: string;

  @Field()
  bio: string;

  @Field()
  created_at: string;

  @Field(() => [CoachAvailability], { nullable: true })
  availabilities?: CoachAvailability[];

  constructor(id: string, profile_id: string, bio: string, created_at: string) {
    this.id = id;
    this.profile_id = profile_id;
    this.bio = bio;
    this.created_at = created_at;
  }
}

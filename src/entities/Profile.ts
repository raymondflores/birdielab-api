import { ObjectType, Field, ID, Int } from "type-graphql";

@ObjectType()
export class Profile {
  @Field(() => ID)
  id: string;

  @Field()
  user_id: string;

  @Field()
  name: string;

  @Field()
  location: string;

  @Field(() => Int)
  handicap: number;

  @Field()
  created_at: string;

  constructor(id: string, user_id: string, name: string, location: string, handicap: number, created_at: string) {
    this.id = id;
    this.user_id = user_id;
    this.name = name;
    this.location = location;
    this.handicap = handicap;
    this.created_at = created_at;
  }
}

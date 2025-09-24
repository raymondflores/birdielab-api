import { ObjectType, Field, ID, Int } from "type-graphql";

@ObjectType()
export class Profile {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  location: string;

  @Field(() => Int)
  handicap: number;

  constructor(id: string, name: string, location: string, handicap: number) {
    this.id = id;
    this.name = name;
    this.location = location;
    this.handicap = handicap;
  }
}

import { ObjectType, Field, ID, Int } from "type-graphql";
import { Coach } from "./Coach";

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  auth_id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  country?: string;

  @Field(() => Int)
  handicap: number;

  @Field()
  created_at: string;

  @Field(() => Coach, { nullable: true })
  coach?: Coach;

  constructor(id: string, auth_id: string, name: string, country: string, handicap: number, created_at: string, city?: string, state?: string) {
    this.id = id;
    this.auth_id = auth_id;
    this.name = name;
    this.country = country;
    this.handicap = handicap;
    this.created_at = created_at;
    this.city = city;
    this.state = state;
  }
}

import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
export class UserFeedback {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  user_id: string;

  @Field()
  comment: string;

  @Field()
  created_at: string;

  constructor(id: string, user_id: string, comment: string, created_at: string) {
    this.id = id;
    this.user_id = user_id;
    this.comment = comment;
    this.created_at = created_at;
  }
}

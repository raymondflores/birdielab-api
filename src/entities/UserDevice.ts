import { ObjectType, Field, ID } from "type-graphql";

@ObjectType()
export class UserDevice {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  user_id: string;

  @Field()
  device_token: string;

  @Field()
  platform: string;

  @Field()
  created_at: string;

  @Field()
  updated_at: string;

  constructor(
    id: string,
    user_id: string,
    device_token: string,
    platform: string,
    created_at: string,
    updated_at: string
  ) {
    this.id = id;
    this.user_id = user_id;
    this.device_token = device_token;
    this.platform = platform;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

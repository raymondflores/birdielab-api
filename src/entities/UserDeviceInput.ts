import { InputType, Field } from "type-graphql";

@InputType()
export class RegisterDeviceInput {
  @Field()
  device_token: string;

  @Field()
  platform: string; // 'ios', 'android', 'web'
}

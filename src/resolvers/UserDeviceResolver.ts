import { Resolver, Mutation, Arg, Ctx, Authorized } from "type-graphql";
import { UserDevice } from "../entities/UserDevice";
import { RegisterDeviceInput } from "../entities/UserDeviceInput";
import { supabaseAdmin } from "../config/supabase";
import { Request } from "express";

interface Context {
  req: Request;
  user: any; // Database user object
}

@Resolver(UserDevice)
export class UserDeviceResolver {
  @Authorized()
  @Mutation(() => UserDevice)
  async registerDevice(
    @Ctx() context: Context,
    @Arg("input") input: RegisterDeviceInput
  ): Promise<UserDevice> {
    try {
      // Check if device token already exists for this user
      const { data: existingDevice, error: checkError } = await supabaseAdmin
        .from('user_devices')
        .select('id')
        .eq('user_id', context.user.id)
        .eq('device_token', input.device_token)
        .single();

      if (!checkError && existingDevice) {
        // Device already registered, return existing record
        const { data: device, error: fetchError } = await supabaseAdmin
          .from('user_devices')
          .select('*')
          .eq('id', existingDevice.id)
          .single();

        if (fetchError || !device) {
          throw new Error('Failed to fetch existing device');
        }

        return new UserDevice(
          device.id,
          device.user_id,
          device.device_token,
          device.platform,
          device.created_at,
          device.updated_at
        );
      }

      // Register new device
      const { data: device, error } = await supabaseAdmin
        .from('user_devices')
        .insert({
          user_id: context.user.id,
          device_token: input.device_token,
          platform: input.platform
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to register device');
      }

      return new UserDevice(
        device.id,
        device.user_id,
        device.device_token,
        device.platform,
        device.created_at,
        device.updated_at
      );

    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to register device');
    }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async unregisterDevice(
    @Ctx() context: Context,
    @Arg("device_token") device_token: string
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('user_devices')
        .delete()
        .eq('user_id', context.user.id)
        .eq('device_token', device_token);

      if (error) {
        throw new Error('Failed to unregister device');
      }

      return true;

    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to unregister device');
    }
  }
}

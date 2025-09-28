import { Resolver, Query, Mutation, Arg, Ctx, Authorized, FieldResolver, Root } from "type-graphql";
import { Lesson, LessonStatus } from "../entities/Lesson";
import { CreateLessonInput, UpdateLessonInput, LessonFilterInput, AvailableSlotsInput } from "../entities/LessonInput";
import { TimeSlot } from "../entities/TimeSlot";
import { User } from "../entities/User";
import { supabaseAdmin } from "../config/supabase";
import { Request } from "express";

interface Context {
  req: Request;
  user: any;
}

@Resolver(Lesson)
export class LessonResolver {
  @Authorized()
  @Mutation(() => Lesson)
  async createLesson(
    @Ctx() context: Context,
    @Arg("input") input: CreateLessonInput
  ): Promise<Lesson> {
    try {
      // First get the current user
      const { data: currentUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('auth_id', context.user.id)
        .single();
      
      if (userError || !currentUser) {
        throw new Error('User not found. Please create a profile first.');
      }

      // Validate that the coach exists and get the user_id
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .select('id, user_id')
        .eq('id', input.coach_id)
        .single();
      
      if (coachError || !coach) {
        throw new Error('Coach not found.');
      }

      // Convert coach_id to user_id for the lesson
      const coachUserId = coach.user_id;

      // Validate time inputs
      const startTime = new Date(input.start_time);
      const endTime = new Date(input.end_time);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error('Invalid time format. Use ISO timestamp format');
      }
      
      if (startTime >= endTime) {
        throw new Error('Start time must be before end time');
      }

      // Check for overlapping lessons for the coach
      const { data: overlappingLessons } = await supabaseAdmin
        .from('lessons')
        .select('id')
        .eq('coach_id', coachUserId) // Use the converted user_id
        .or(`and(start_time.lt.${input.end_time},end_time.gt.${input.start_time})`);
      
      if (overlappingLessons && overlappingLessons.length > 0) {
        throw new Error('Coach has overlapping lessons at this time');
      }

      // Check for overlapping lessons for the student
      const { data: studentOverlappingLessons } = await supabaseAdmin
        .from('lessons')
        .select('id')
        .eq('student_id', currentUser.id)
        .or(`and(start_time.lt.${input.end_time},end_time.gt.${input.start_time})`);
      
      if (studentOverlappingLessons && studentOverlappingLessons.length > 0) {
        throw new Error('You have overlapping lessons at this time');
      }

      // Create lesson
      const { data: lesson, error: lessonError } = await supabaseAdmin
        .from('lessons')
        .insert({
          coach_id: coachUserId, // Use the converted user_id instead of coach_id
          student_id: currentUser.id,
          start_time: input.start_time,
          end_time: input.end_time,
          status: LessonStatus.PENDING
        })
        .select()
        .single();
      
      if (lessonError) {
        console.error('Lesson creation error:', lessonError);
        throw new Error('Failed to create lesson');
      }
      
      return new Lesson(
        lesson.id,
        lesson.coach_id,
        lesson.student_id,
        lesson.start_time,
        lesson.end_time,
        lesson.status,
        lesson.created_at,
        lesson.updated_at
      );
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create lesson');
    }
  }

  @Authorized()
  @Mutation(() => Lesson, { nullable: true })
  async updateLesson(
    @Ctx() context: Context,
    @Arg("id") id: string,
    @Arg("input") input: UpdateLessonInput
  ): Promise<Lesson | null> {
    try {
      // First get the current user
      const { data: currentUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('auth_id', context.user.id)
        .single();
      
      if (userError || !currentUser) {
        throw new Error('User not found.');
      }

      // Verify ownership of the lesson (student or coach)
      const { data: existingLesson, error: checkError } = await supabaseAdmin
        .from('lessons')
        .select('id, student_id, coach_id')
        .eq('id', id)
        .single();
      
      if (checkError || !existingLesson) {
        throw new Error('Lesson not found');
      }
      
      if (existingLesson.student_id !== currentUser.id && existingLesson.coach_id !== currentUser.id) {
        throw new Error('You can only update your own lessons');
      }

      // Validate time inputs if provided
      if (input.start_time && input.end_time) {
        const startTime = new Date(input.start_time);
        const endTime = new Date(input.end_time);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          throw new Error('Invalid time format. Use ISO timestamp format');
        }
        
        if (startTime >= endTime) {
          throw new Error('Start time must be before end time');
        }
      }

      // Update lesson
      const updateData: any = {};
      if (input.start_time !== undefined) updateData.start_time = input.start_time;
      if (input.end_time !== undefined) updateData.end_time = input.end_time;
      if (input.status !== undefined) updateData.status = input.status;

      const { data: lesson, error: lessonError } = await supabaseAdmin
        .from('lessons')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (lessonError) {
        throw new Error('Failed to update lesson');
      }
      
      return lesson ? new Lesson(
        lesson.id,
        lesson.coach_id,
        lesson.student_id,
        lesson.start_time,
        lesson.end_time,
        lesson.status,
        lesson.created_at,
        lesson.updated_at
      ) : null;
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update lesson');
    }
  }

  @Authorized()
  @Mutation(() => Boolean)
  async cancelLesson(
    @Ctx() context: Context,
    @Arg("id") id: string
  ): Promise<boolean> {
    try {
      // First get the current user
      const { data: currentUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('auth_id', context.user.id)
        .single();
      
      if (userError || !currentUser) {
        throw new Error('User not found.');
      }

      // Verify ownership of the lesson
      const { data: existingLesson, error: checkError } = await supabaseAdmin
        .from('lessons')
        .select('id, student_id, coach_id')
        .eq('id', id)
        .single();
      
      if (checkError || !existingLesson) {
        throw new Error('Lesson not found');
      }
      
      if (existingLesson.student_id !== currentUser.id && existingLesson.coach_id !== currentUser.id) {
        throw new Error('You can only cancel your own lessons');
      }

      // Update lesson status to cancelled
      const { error: updateError } = await supabaseAdmin
        .from('lessons')
        .update({ status: LessonStatus.CANCELLED })
        .eq('id', id);
      
      if (updateError) {
        throw new Error('Failed to cancel lesson');
      }
      
      return true;
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to cancel lesson');
    }
  }

  @Query(() => [Lesson])
  async getLessons(
    @Arg("filter", { nullable: true }) filter?: LessonFilterInput
  ): Promise<Lesson[]> {
    try {
      let query = supabaseAdmin
        .from('lessons')
        .select('*');

      if (filter) {
        if (filter.coach_id) {
          query = query.eq('coach_id', filter.coach_id);
        }
        if (filter.student_id) {
          query = query.eq('student_id', filter.student_id);
        }
        if (filter.status) {
          query = query.eq('status', filter.status);
        }
        if (filter.date) {
          const startOfDay = new Date(filter.date);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(filter.date);
          endOfDay.setHours(23, 59, 59, 999);
          
          query = query
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString());
        }
      }

      const { data: lessons, error } = await query.order('start_time');
      
      if (error) {
        throw new Error('Failed to fetch lessons');
      }
      
      return lessons.map((lesson: any) => new Lesson(
        lesson.id,
        lesson.coach_id,
        lesson.student_id,
        lesson.start_time,
        lesson.end_time,
        lesson.status,
        lesson.created_at,
        lesson.updated_at
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch lessons');
    }
  }

  @Authorized()
  @Query(() => [Lesson])
  async getMyLessons(
    @Ctx() context: Context
  ): Promise<Lesson[]> {
    try {
      // First get the current user
      const { data: currentUser, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('auth_id', context.user.id)
        .single();
      
      if (userError || !currentUser) {
        throw new Error('User not found.');
      }

      // Get lessons where user is either student or coach
      const { data: lessons, error } = await supabaseAdmin
        .from('lessons')
        .select('*')
        .or(`student_id.eq.${currentUser.id},coach_id.eq.${currentUser.id}`)
        .order('start_time');
      
      if (error) {
        throw new Error('Failed to fetch lessons');
      }
      
      return lessons.map((lesson: any) => new Lesson(
        lesson.id,
        lesson.coach_id,
        lesson.student_id,
        lesson.start_time,
        lesson.end_time,
        lesson.status,
        lesson.created_at,
        lesson.updated_at
      ));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch lessons');
    }
  }

  @Query(() => [TimeSlot])
  async getAvailableSlots(
    @Arg("input") input: AvailableSlotsInput
  ): Promise<TimeSlot[]> {
    try {
      // Validate that the coach exists
      const { data: coach, error: coachError } = await supabaseAdmin
        .from('coaches')
        .select('id')
        .eq('id', input.coach_id)
        .single();
      
      if (coachError || !coach) {
        throw new Error('Coach not found.');
      }

      // Parse the requested date
      const requestedDate = new Date(input.date);
      if (isNaN(requestedDate.getTime())) {
        throw new Error('Invalid date format. Use YYYY-MM-DD format');
      }

      // Get the day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = requestedDate.getDay();

      // Get coach's availability for this day of week
      const { data: availability, error: availabilityError } = await supabaseAdmin
        .from('coach_availabilities')
        .select('start_time, end_time')
        .eq('coach_id', input.coach_id)
        .eq('day_of_week', dayOfWeek);
      
      if (availabilityError) {
        throw new Error('Failed to fetch coach availability');
      }

      if (!availability || availability.length === 0) {
        return []; // No availability for this day
      }

      // Get existing lessons for this coach on this date
      const startOfDay = new Date(requestedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(requestedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingLessons, error: lessonsError } = await supabaseAdmin
        .from('lessons')
        .select('start_time, end_time')
        .eq('coach_id', input.coach_id)
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString())
        .neq('status', LessonStatus.CANCELLED);
      
      if (lessonsError) {
        throw new Error('Failed to fetch existing lessons');
      }

      const durationMinutes = input.duration_minutes || 60; // Default 1 hour
      const availableSlots: TimeSlot[] = [];

      // Process each availability window
      for (const avail of availability) {
        const slots = this.generateTimeSlots(
          requestedDate,
          avail.start_time,
          avail.end_time,
          durationMinutes,
          existingLessons || []
        );
        availableSlots.push(...slots);
      }

      return availableSlots.sort((a, b) => a.start_time.localeCompare(b.start_time));
      
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch available slots');
    }
  }

  private generateTimeSlots(
    date: Date,
    availabilityStart: string,
    availabilityEnd: string,
    durationMinutes: number,
    existingLessons: any[]
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    // Parse availability times
    const [startHour, startMinute] = availabilityStart.split(':').map(Number);
    const [endHour, endMinute] = availabilityEnd.split(':').map(Number);
    
    const availabilityStartTime = new Date(date);
    availabilityStartTime.setHours(startHour, startMinute, 0, 0);
    
    const availabilityEndTime = new Date(date);
    availabilityEndTime.setHours(endHour, endMinute, 0, 0);
    
    // Generate slots in the availability window
    const currentTime = new Date(availabilityStartTime);
    
    while (currentTime.getTime() + (durationMinutes * 60 * 1000) <= availabilityEndTime.getTime()) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + (durationMinutes * 60 * 1000));
      
      // Check if this slot conflicts with existing lessons
      const hasConflict = existingLessons.some(lesson => {
        const lessonStart = new Date(lesson.start_time);
        const lessonEnd = new Date(lesson.end_time);
        
        // Check for overlap
        return (slotStart < lessonEnd && slotEnd > lessonStart);
      });
      
      if (!hasConflict) {
        slots.push(new TimeSlot(
          slotStart.toISOString(),
          slotEnd.toISOString(),
          durationMinutes
        ));
      }
      
      // Move to next slot (30-minute intervals by default)
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    
    return slots;
  }

  @FieldResolver(() => User, { nullable: true })
  async coach(@Root() lesson: Lesson): Promise<User | null> {
    try {
      const { data: coach, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', lesson.coach_id)
        .single();
      
      if (error || !coach) {
        return null;
      }
      
      return new User(
        coach.id,
        coach.auth_id,
        coach.name,
        coach.location,
        coach.handicap,
        coach.created_at
      );
    } catch (error) {
      return null;
    }
  }

  @FieldResolver(() => User, { nullable: true })
  async student(@Root() lesson: Lesson): Promise<User | null> {
    try {
      const { data: student, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', lesson.student_id)
        .single();
      
      if (error || !student) {
        return null;
      }
      
      return new User(
        student.id,
        student.auth_id,
        student.name,
        student.location,
        student.handicap,
        student.created_at
      );
    } catch (error) {
      return null;
    }
  }
}

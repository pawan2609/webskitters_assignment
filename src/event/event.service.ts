// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class EventService {}

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event } from './schemas/event.schema';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';

@Injectable()
export class EventService {
  constructor(@InjectModel(Event.name) private eventModel: Model<Event>) {}

  async create(createEventDto: CreateEventDto, userId: string, bannerFilename?: string): Promise<Event> {
    const eventDate = new Date(createEventDto.date);
    if (eventDate < new Date()) {
      throw new BadRequestException('Event date must be in the future');
    }

    const event = new this.eventModel({
      ...createEventDto,
      createdBy: userId,
      banner: bannerFilename || createEventDto.banner,
    });

    return event.save();
  }

  async findAll(queryDto: QueryEventDto) {
    const { page = 1, limit = 10, search, dateFrom, dateTo } = queryDto;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const [events, total] = await Promise.all([
      this.eventModel
        .find(query)
        .populate('createdBy', 'name email')
        .populate('attendees', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ date: 1 })
        .exec(),
      this.eventModel.countDocuments(query),
    ]);

    return {
      data: events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventModel
      .findById(id)
      .populate('createdBy', 'name email')
      .populate('attendees', 'name email')
      .exec();

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, userId: string, userRole: string, bannerFilename?: string): Promise<Event> {
    const event = await this.eventModel.findById(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (userRole !== 'admin' && event.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only update your own events');
    }

    if (updateEventDto.date) {
      const eventDate = new Date(updateEventDto.date);
      if (eventDate < new Date()) {
        throw new BadRequestException('Event date must be in the future');
      }
    }

    const updateData = { ...updateEventDto };
    if (bannerFilename) {
      updateData.banner = bannerFilename;
    }

    // return this.eventModel
    //   .findByIdAndUpdate(id, updateData, { new: true })
    //   .populate('createdBy', 'name email')
    //   .populate('attendees', 'name email')
    //   .exec();
    const updatedEvent = await this.eventModel
  .findByIdAndUpdate(id, updateData, { new: true })
  .populate('createdBy', 'name email')
  .populate('attendees', 'name email')
  .exec();

if (!updatedEvent) {
  throw new NotFoundException('Event not found after update');
}

return updatedEvent;

  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const event = await this.eventModel.findById(id);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (userRole !== 'admin' && event.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own events');
    }

    await this.eventModel.findByIdAndDelete(id).exec();
  }

  async registerAttendee(eventId: string, userId: string): Promise<Event> {
    const event = await this.eventModel.findById(eventId);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.attendees.some(attendee => attendee.toString() === userId)) {
      throw new BadRequestException('Already registered for this event');
    }

    event.attendees.push(userId as any);
    await event.save();

    // return this.eventModel
    //   .findById(eventId)
    //   .populate('createdBy', 'name email')
    //   .populate('attendees', 'name email')
    //   .exec();

    const updatedEvent = await this.eventModel
  .findById(eventId)
  .populate('createdBy', 'name email')
  .populate('attendees', 'name email')
  .exec();

if (!updatedEvent) {
  throw new NotFoundException('Event not found after registration');
}

return updatedEvent;
  }
}
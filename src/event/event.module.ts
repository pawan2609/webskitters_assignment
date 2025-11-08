
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { AuthModule } from 'src/auth/auth.module';
import { Event, EventSchema } from './schemas/event.schema';

@Module({
  imports: [AuthModule,MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }])],
  providers: [EventService],
  controllers: [EventController],
})
export class EventModule {}
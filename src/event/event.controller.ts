import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';
import type { FastifyRequest } from 'fastify';
import { writeFile, mkdir } from 'fs/promises';
import { extname, join } from 'path';
import { existsSync } from 'fs';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  private async handleFileUpload(req: FastifyRequest, fieldName: string): Promise<string | undefined> {
    const data = await req.file();
    if (!data) {
      return undefined;
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(data.mimetype)) {
      throw new BadRequestException('Only image files (jpg, jpeg, png, gif) are allowed');
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    const buffer = await data.toBuffer();
    if (buffer.length > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Ensure uploads directory exists
    const uploadDir = './uploads/banners';
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    const filename = `${randomName}${extname(data.filename)}`;
    const filepath = join(uploadDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    return filename;
  }

  private async parseMultipartData(req: FastifyRequest): Promise<{ [key: string]: any }> {
    const data: { [key: string]: any } = {};
    const parts = req.parts();

    for await (const part of parts) {
      if (part.type === 'file') {
        // Handle file upload
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedMimeTypes.includes(part.mimetype)) {
          throw new BadRequestException('Only image files (jpg, jpeg, png, gif) are allowed');
        }

        const maxSize = 5 * 1024 * 1024;
        const buffer = await part.toBuffer();
        if (buffer.length > maxSize) {
          throw new BadRequestException('File size exceeds 5MB limit');
        }

        const uploadDir = './uploads/banners';
        if (!existsSync(uploadDir)) {
          await mkdir(uploadDir, { recursive: true });
        }

        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        const filename = `${randomName}${extname(part.filename)}`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);
        data[part.fieldname] = filename;
      } else {
        // Handle form fields
        data[part.fieldname] = part.value;
      }
    }

    return data;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Req() req: FastifyRequest, @Body() createEventDto?: CreateEventDto) {
    console.log("req::>>",req);
    console.log("createEventDto",createEventDto);
    
    
    let bannerFilename: string | undefined;
    let finalDto: CreateEventDto;

    // Check if request is multipart
    if (req.isMultipart && req.isMultipart()) {
      // For multipart requests, parse manually (don't use @Body())
      const formData = await this.parseMultipartData(req);
      finalDto = {
        title: formData.title as string,
        description: formData.description as string,
        date: formData.date as string,
        banner: formData.banner as string,
      };
      bannerFilename = formData.banner as string;
    } else {
      // For JSON requests, use @Body() decorator
      if (!createEventDto) {
        throw new BadRequestException('Request body is required');
      }
      finalDto = createEventDto;
      bannerFilename = finalDto?.banner;
    }

    return this.eventService.create(
      finalDto,
      (req as any).user.userId,
      bannerFilename,
    );
  }

  @Get()
  findAll(@Query() queryDto: QueryEventDto) {
    return this.eventService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Req() req: FastifyRequest, @Body() updateEventDto?: UpdateEventDto) {
    let bannerFilename: string | undefined;
    let finalDto: UpdateEventDto;

    // Check if request is multipart
    if (req.isMultipart && req.isMultipart()) {
      // For multipart requests, parse manually (don't use @Body())
      const formData = await this.parseMultipartData(req);
      finalDto = {
        title: formData.title as string,
        description: formData.description as string,
        date: formData.date as string,
        banner: formData.banner as string,
      };
      bannerFilename = formData.banner as string;
    } else {
      // For JSON requests, use @Body() decorator
      if (!updateEventDto) {
        throw new BadRequestException('Request body is required');
      }
      finalDto = updateEventDto;
      bannerFilename = finalDto?.banner;
    }

    // Remove undefined fields
    Object.keys(finalDto).forEach(key => {
      if (finalDto[key] === undefined) {
        delete finalDto[key];
      }
    });

    return this.eventService.update(
      id,
      finalDto,
      (req as any).user.userId,
      (req as any).user.role,
      bannerFilename,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.eventService.remove(id, req.user.userId, req.user.role);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  registerAttendee(@Param('id') id: string, @Request() req) {
    return this.eventService.registerAttendee(id, req.user.userId);
  }
}

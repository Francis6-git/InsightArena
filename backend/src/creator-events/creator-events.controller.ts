import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatorEventsService } from './creator-events.service';
import { ListParticipantsQueryDto } from './dto/list-participants-query.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { UserEventsQueryDto } from './dto/user-events-query.dto';
import { PaginatedEventsResponseDto } from './dto/event-response.dto';
import { PaginatedUserEventsResponseDto } from './dto/user-event-response.dto';

@ApiTags('creator-events')
@Controller('creator-events')
export class CreatorEventsController {
  constructor(private readonly creatorEventsService: CreatorEventsService) {}

  /**
   * GET /api/creator-events
   * #723 — Fetch all creator events with pagination, filtering, and sorting.
   */
  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutes
  @ApiOperation({
    summary: 'Get all creator events with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of events',
    type: PaginatedEventsResponseDto,
  })
  getAllEvents(@Query() query: ListEventsQueryDto) {
    return this.creatorEventsService.getAllEvents(query);
  }

  /**
   * GET /api/creator-events/:id
   * #724 — Fetch a single event by ID with enriched details.
   */
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(120) // 2 minutes
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event details with enriched data' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  getEvent(@Param('id') id: string) {
    return this.creatorEventsService.getEventById(id);
  }

  /**
   * GET /api/creator-events/:id/participants
   * #734 — Fetch paginated participants for an event with scores.
   */
  @Get(':id/participants')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60) // 1 minute
  @ApiOperation({
    summary: 'Get event participants with scores and pagination',
  })
  @ApiResponse({ status: 200, description: 'Paginated participant list' })
  getParticipants(
    @Param('id') id: string,
    @Query() query: ListParticipantsQueryDto,
  ) {
    return this.creatorEventsService.getParticipants(id, query);
  }

  /**
   * GET /api/creator-events/user/:address
   * #726 — Fetch all events a user has joined or created.
   */
  @Get('user/:address')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(60) // 1 minute
  @ApiOperation({ summary: 'Get user events (joined or created)' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of user events',
    type: PaginatedUserEventsResponseDto,
  })
  getUserEvents(
    @Param('address') address: string,
    @Query() query: UserEventsQueryDto,
  ) {
    return this.creatorEventsService.getUserEvents(address, query);
  }
}

@ApiTags('admin')
@Controller('admin/creator-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@ApiBearerAuth()
export class AdminCreatorEventsController {
  constructor(private readonly creatorEventsService: CreatorEventsService) {}

  /**
   * GET /api/admin/creator-events/config
   * #737 — Fetch current contract configuration (admin only).
   */
  @Get('config')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutes
  @ApiOperation({ summary: 'Get contract configuration (admin only)' })
  @ApiResponse({ status: 200, description: 'Contract configuration' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getConfig() {
    return this.creatorEventsService.getContractConfig();
  }
}

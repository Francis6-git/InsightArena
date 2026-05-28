import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import {
  CreatorEventsController,
  AdminCreatorEventsController,
} from './creator-events.controller';
import { CreatorEventsService } from './creator-events.service';
import {
  ListEventsQueryDto,
  EventStatus,
  EventSortBy,
} from './dto/list-events-query.dto';
import { UserEventsQueryDto, UserEventType } from './dto/user-events-query.dto';
import {
  ListParticipantsQueryDto,
  ParticipantSortBy,
  SortOrder,
} from './dto/list-participants-query.dto';

describe('CreatorEventsController', () => {
  let controller: CreatorEventsController;
  let service: jest.Mocked<CreatorEventsService>;

  const mockEnrichedEvent = {
    eventId: 'event-1',
    inviteCode: 'code-123',
    creator: 'creator-address',
    title: 'Test Event',
    description: 'Test Description',
    startTime: 1000000,
    endTime: 2000000,
    maxParticipants: 100,
    participantCount: 50,
    isActive: true,
    matchCount: 2,
    matchPreview: [
      { matchId: 'match-1', homeTeam: 'Team A', awayTeam: 'Team B' },
      { matchId: 'match-2', homeTeam: 'Team C', awayTeam: 'Team D' },
    ],
    winnerCount: 2,
    creatorVerified: true,
  };

  const mockPaginatedEvents = {
    data: [mockEnrichedEvent],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const mockParticipants = {
    data: [
      {
        address: 'user-1',
        joinedAt: 1000000,
        totalPredictions: 5,
        correctPredictions: 3,
        accuracyPct: 60,
        rank: 1,
      },
    ],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  beforeEach(async () => {
    const mockCreatorEventsService = {
      getEventById: jest.fn(),
      getParticipants: jest.fn(),
      getAllEvents: jest.fn(),
      getUserEvents: jest.fn(),
      getContractConfig: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [CreatorEventsController, AdminCreatorEventsController],
      providers: [
        {
          provide: CreatorEventsService,
          useValue: mockCreatorEventsService,
        },
      ],
    }).compile();

    controller = module.get<CreatorEventsController>(CreatorEventsController);
    service = module.get(CreatorEventsService);
  });

  describe('getAllEvents', () => {
    it('should return paginated events', async () => {
      service.getAllEvents.mockResolvedValue(mockPaginatedEvents);

      const query: ListEventsQueryDto = {
        page: 1,
        limit: 20,
        status: EventStatus.All,
        sortBy: EventSortBy.CreatedAt,
        sortOrder: SortOrder.Desc,
      };

      const result = await controller.getAllEvents(query);

      expect(result).toEqual(mockPaginatedEvents);
      expect(service.getAllEvents).toHaveBeenCalledWith(query);
    });

    it('should accept filter parameters', async () => {
      service.getAllEvents.mockResolvedValue(mockPaginatedEvents);

      const query: ListEventsQueryDto = {
        page: 1,
        limit: 50,
        status: EventStatus.Active,
        creator: 'creator-address',
        search: 'test',
        sortBy: EventSortBy.ParticipantCount,
        sortOrder: SortOrder.Asc,
      };

      await controller.getAllEvents(query);

      expect(service.getAllEvents).toHaveBeenCalledWith(query);
    });
  });

  describe('getEvent', () => {
    it('should return event by ID', async () => {
      service.getEventById.mockResolvedValue(mockEnrichedEvent);

      const result = await controller.getEvent('event-1');

      expect(result).toEqual(mockEnrichedEvent);
      expect(service.getEventById).toHaveBeenCalledWith('event-1');
    });
  });

  describe('getParticipants', () => {
    it('should return paginated participants', async () => {
      service.getParticipants.mockResolvedValue(mockParticipants);

      const query: ListParticipantsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: ParticipantSortBy.JoinedAt,
        sortOrder: SortOrder.Desc,
      };

      const result = await controller.getParticipants('event-1', query);

      expect(result).toEqual(mockParticipants);
      expect(service.getParticipants).toHaveBeenCalledWith('event-1', query);
    });
  });

  describe('getUserEvents', () => {
    it('should return user events', async () => {
      service.getUserEvents.mockResolvedValue(mockPaginatedEvents);

      const query: UserEventsQueryDto = {
        type: UserEventType.All,
        status: EventStatus.All,
        page: 1,
        limit: 20,
      };

      const result = await controller.getUserEvents('user-address', query);

      expect(result).toEqual(mockPaginatedEvents);
      expect(service.getUserEvents).toHaveBeenCalledWith('user-address', query);
    });

    it('should accept type and status filters', async () => {
      service.getUserEvents.mockResolvedValue(mockPaginatedEvents);

      const query: UserEventsQueryDto = {
        type: UserEventType.Joined,
        status: EventStatus.Active,
        page: 1,
        limit: 20,
      };

      await controller.getUserEvents('user-address', query);

      expect(service.getUserEvents).toHaveBeenCalledWith('user-address', query);
    });
  });
});

describe('AdminCreatorEventsController', () => {
  let controller: AdminCreatorEventsController;
  let service: jest.Mocked<CreatorEventsService>;

  const mockConfig = {
    admin: 'admin-address',
    aiAgent: 'ai-agent-address',
    treasury: 'treasury-address',
    celoToken: 'celo-token-address',
    creationFee: '1000',
    paused: false,
  };

  beforeEach(async () => {
    const mockCreatorEventsService = {
      getContractConfig: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [AdminCreatorEventsController],
      providers: [
        {
          provide: CreatorEventsService,
          useValue: mockCreatorEventsService,
        },
      ],
    }).compile();

    controller = module.get<AdminCreatorEventsController>(
      AdminCreatorEventsController,
    );
    service = module.get(CreatorEventsService);
  });

  describe('getConfig', () => {
    it('should return contract configuration', async () => {
      service.getContractConfig.mockResolvedValue(mockConfig);

      const result = await controller.getConfig();

      expect(result).toEqual(mockConfig);
      expect(service.getContractConfig).toHaveBeenCalled();
    });
  });
});

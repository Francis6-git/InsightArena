import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  CreatorEventsService,
  EnrichedEvent,
  PaginatedEvents,
} from './creator-events.service';
import {
  ContractService,
  ContractEvent,
  ContractParticipant,
} from '../contract/contract.service';
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

describe('CreatorEventsService', () => {
  let service: CreatorEventsService;
  let contractService: jest.Mocked<ContractService>;

  const mockEvent: ContractEvent = {
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
  };

  const mockMatches = [
    {
      matchId: 'match-1',
      eventId: 'event-1',
      homeTeam: 'Team A',
      awayTeam: 'Team B',
      startTime: 1000000,
      resolved: false,
      outcome: null,
    },
    {
      matchId: 'match-2',
      eventId: 'event-1',
      homeTeam: 'Team C',
      awayTeam: 'Team D',
      startTime: 1100000,
      resolved: false,
      outcome: null,
    },
  ];

  const mockWinners = [
    { address: 'winner-1', totalStake: '1000', payout: '2000' },
    { address: 'winner-2', totalStake: '500', payout: '1000' },
  ];

  const mockParticipants: ContractParticipant[] = [
    { address: 'user-1', joinedAt: 1000000, predictionCount: 5 },
    { address: 'user-2', joinedAt: 1000100, predictionCount: 3 },
  ];

  beforeEach(async () => {
    const mockContractService = {
      getEvent: jest.fn(),
      getEventMatches: jest.fn(),
      getEventWinners: jest.fn(),
      isVerified: jest.fn(),
      getEventParticipants: jest.fn(),
      getConfig: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorEventsService,
        {
          provide: ContractService,
          useValue: mockContractService,
        },
      ],
    }).compile();

    service = module.get<CreatorEventsService>(CreatorEventsService);
    contractService = module.get(ContractService);
  });

  describe('getEventById', () => {
    it('should return enriched event with matches, winners, and verification status', async () => {
      contractService.getEvent.mockResolvedValue(mockEvent);
      contractService.getEventMatches.mockResolvedValue(mockMatches);
      contractService.getEventWinners.mockResolvedValue(mockWinners);
      contractService.isVerified.mockResolvedValue(true);

      const result = await service.getEventById('event-1');

      expect(result).toEqual({
        ...mockEvent,
        matchCount: 2,
        matchPreview: [
          { matchId: 'match-1', homeTeam: 'Team A', awayTeam: 'Team B' },
          { matchId: 'match-2', homeTeam: 'Team C', awayTeam: 'Team D' },
        ],
        winnerCount: 2,
        creatorVerified: true,
      });
    });

    it('should throw NotFoundException when event not found', async () => {
      contractService.getEvent.mockResolvedValue(null);

      await expect(service.getEventById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle empty matches and winners', async () => {
      contractService.getEvent.mockResolvedValue(mockEvent);
      contractService.getEventMatches.mockResolvedValue([]);
      contractService.getEventWinners.mockResolvedValue([]);
      contractService.isVerified.mockResolvedValue(false);

      const result = await service.getEventById('event-1');

      expect(result.matchCount).toBe(0);
      expect(result.matchPreview).toEqual([]);
      expect(result.winnerCount).toBe(0);
      expect(result.creatorVerified).toBe(false);
    });
  });

  describe('getParticipants', () => {
    it('should return paginated participants with stats', async () => {
      contractService.getEventParticipants.mockResolvedValue(mockParticipants);

      const query: ListParticipantsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: ParticipantSortBy.JoinedAt,
        sortOrder: SortOrder.Asc,
      };

      const result = await service.getParticipants('event-1', query);

      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].address).toBe('user-1');
      expect(result.data[0].totalPredictions).toBe(5);
    });

    it('should sort participants by score', async () => {
      contractService.getEventParticipants.mockResolvedValue(mockParticipants);

      const query: ListParticipantsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: ParticipantSortBy.Score,
        sortOrder: SortOrder.Desc,
      };

      const result = await service.getParticipants('event-1', query);

      expect(result.data).toHaveLength(2);
    });

    it('should handle pagination correctly', async () => {
      const manyParticipants = Array.from({ length: 50 }, (_, i) => ({
        address: `user-${i}`,
        joinedAt: 1000000 + i * 100,
        predictionCount: 5,
      }));

      contractService.getEventParticipants.mockResolvedValue(manyParticipants);

      const query: ListParticipantsQueryDto = {
        page: 2,
        limit: 20,
        sortBy: ParticipantSortBy.JoinedAt,
        sortOrder: SortOrder.Asc,
      };

      const result = await service.getParticipants('event-1', query);

      expect(result.total).toBe(50);
      expect(result.totalPages).toBe(3);
      expect(result.data).toHaveLength(20);
      expect(result.page).toBe(2);
    });
  });

  describe('getAllEvents', () => {
    it('should return paginated events', async () => {
      const query: ListEventsQueryDto = {
        page: 1,
        limit: 20,
        status: EventStatus.All,
        sortBy: EventSortBy.CreatedAt,
        sortOrder: SortOrder.Desc,
      };

      const result = await service.getAllEvents(query);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    });

    it('should accept all query parameters', async () => {
      const query: ListEventsQueryDto = {
        page: 1,
        limit: 50,
        status: EventStatus.Active,
        creator: 'creator-address',
        search: 'test',
        sortBy: EventSortBy.ParticipantCount,
        sortOrder: SortOrder.Asc,
      };

      const result = await service.getAllEvents(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
    });
  });

  describe('getUserEvents', () => {
    it('should return paginated user events', async () => {
      const query: UserEventsQueryDto = {
        type: UserEventType.All,
        status: EventStatus.All,
        page: 1,
        limit: 20,
      };

      const result = await service.getUserEvents('user-address', query);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    });

    it('should accept all query parameters', async () => {
      const query: UserEventsQueryDto = {
        type: UserEventType.Joined,
        status: EventStatus.Active,
        page: 1,
        limit: 20,
      };

      const result = await service.getUserEvents('user-address', query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('getContractConfig', () => {
    it('should return contract configuration', async () => {
      const mockConfig = {
        admin: 'admin-address',
        aiAgent: 'ai-agent-address',
        treasury: 'treasury-address',
        celoToken: 'celo-token-address',
        creationFee: '1000',
        paused: false,
      };

      contractService.getConfig.mockResolvedValue(mockConfig);

      const result = await service.getContractConfig();

      expect(result).toEqual(mockConfig);
    });

    it('should return default config when contract returns null', async () => {
      contractService.getConfig.mockResolvedValue(null);

      const result = await service.getContractConfig();

      expect(result).toEqual({
        admin: '',
        aiAgent: '',
        treasury: '',
        celoToken: '',
        creationFee: '0',
        paused: false,
      });
    });
  });
});

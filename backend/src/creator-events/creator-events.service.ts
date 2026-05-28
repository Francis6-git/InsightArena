import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ContractService,
  ContractEvent,
  ContractConfig,
  ContractParticipant,
} from '../contract/contract.service';
import {
  ListParticipantsQueryDto,
  ParticipantSortBy,
  SortOrder,
} from './dto/list-participants-query.dto';
import {
  ListEventsQueryDto,
  EventStatus,
  EventSortBy,
} from './dto/list-events-query.dto';
import { UserEventsQueryDto } from './dto/user-events-query.dto';

export interface EnrichedEvent extends ContractEvent {
  matchCount: number;
  matchPreview: Array<{ matchId: string; homeTeam: string; awayTeam: string }>;
  winnerCount: number;
  creatorVerified: boolean;
}

export interface ParticipantWithStats {
  address: string;
  joinedAt: number;
  totalPredictions: number;
  correctPredictions: number;
  accuracyPct: number;
  rank: number;
}

export interface PaginatedParticipants {
  data: ParticipantWithStats[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedEvents {
  data: EnrichedEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserEventWithStats extends EnrichedEvent {
  userScore?: number;
  userAccuracy?: number;
  predictedAll?: boolean;
  pendingPredictions?: number;
  participantStats?: {
    total: number;
    active: number;
  };
  status?: 'active' | 'completed' | 'cancelled';
}

@Injectable()
export class CreatorEventsService {
  private readonly logger = new Logger(CreatorEventsService.name);

  constructor(private readonly contractService: ContractService) {}

  async getEventById(id: string): Promise<EnrichedEvent> {
    const event = await this.contractService.getEvent(id);

    if (!event) {
      throw new NotFoundException(`Event ${id} not found`);
    }

    const [matches, winners, creatorVerified] = await Promise.all([
      this.contractService.getEventMatches(id),
      this.contractService.getEventWinners(id),
      this.contractService.isVerified(event.creator),
    ]);

    return {
      ...event,
      matchCount: matches.length,
      matchPreview: matches.slice(0, 5).map((m) => ({
        matchId: m.matchId,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
      })),
      winnerCount: winners.length,
      creatorVerified,
    };
  }

  async getParticipants(
    eventId: string,
    query: ListParticipantsQueryDto,
  ): Promise<PaginatedParticipants> {
    const raw: ContractParticipant[] =
      await this.contractService.getEventParticipants(eventId);

    const withStats: ParticipantWithStats[] = raw.map((p, i) => {
      const correct =
        typeof (p as ContractParticipant & { correctPredictions?: number })
          .correctPredictions === 'number'
          ? (p as ContractParticipant & { correctPredictions: number })
              .correctPredictions
          : 0;
      const accuracy =
        p.predictionCount > 0
          ? Math.round((correct / p.predictionCount) * 100)
          : 0;
      return {
        address: p.address,
        joinedAt: p.joinedAt,
        totalPredictions: p.predictionCount,
        correctPredictions: correct,
        accuracyPct: accuracy,
        rank: i + 1,
      };
    });

    const sorted = this.sortParticipants(
      withStats,
      query.sortBy,
      query.sortOrder,
    );
    sorted.forEach((p, i) => {
      p.rank = i + 1;
    });

    const total = sorted.length;
    const start = (query.page - 1) * query.limit;
    const data = sorted.slice(start, start + query.limit);

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async getContractConfig(): Promise<ContractConfig> {
    const config = await this.contractService.getConfig();

    if (!config) {
      this.logger.warn(
        'getContractConfig: contract returned null, returning defaults',
      );
      return {
        admin: '',
        aiAgent: '',
        treasury: '',
        celoToken: '',
        creationFee: '0',
        paused: false,
      };
    }

    return config;
  }

  async getAllEvents(query: ListEventsQueryDto): Promise<PaginatedEvents> {
    // Note: This is a placeholder implementation that would need to be replaced
    // with actual database queries once the schema is implemented (issue #719)
    // For now, we return an empty paginated response
    await Promise.resolve(); // Placeholder to satisfy require-await
    this.logger.debug('getAllEvents called with query:', query);

    return {
      data: [],
      total: 0,
      page: query.page,
      limit: query.limit,
      totalPages: 0,
    };
  }

  async getUserEvents(
    userAddress: string,
    query: UserEventsQueryDto,
  ): Promise<PaginatedEvents> {
    // Note: This is a placeholder implementation that would need to be replaced
    // with actual database queries once the schema is implemented (issue #719)
    // For now, we return an empty paginated response
    await Promise.resolve(); // Placeholder to satisfy require-await
    this.logger.debug(
      'getUserEvents called for address:',
      userAddress,
      'with query:',
      query,
    );

    return {
      data: [],
      total: 0,
      page: query.page,
      limit: query.limit,
      totalPages: 0,
    };
  }

  private sortParticipants(
    participants: ParticipantWithStats[],
    sortBy: ParticipantSortBy,
    sortOrder: SortOrder,
  ): ParticipantWithStats[] {
    const dir = sortOrder === SortOrder.Asc ? 1 : -1;

    return [...participants].sort((a, b) => {
      switch (sortBy) {
        case ParticipantSortBy.JoinedAt:
          return (a.joinedAt - b.joinedAt) * dir;
        case ParticipantSortBy.Score:
          return (a.accuracyPct - b.accuracyPct) * dir;
        case ParticipantSortBy.Address:
          return a.address.localeCompare(b.address) * dir;
        default:
          return 0;
      }
    });
  }

  private filterEvents(
    events: EnrichedEvent[],
    query: ListEventsQueryDto,
  ): EnrichedEvent[] {
    return events.filter((event) => {
      // Filter by status
      if (query.status !== EventStatus.All) {
        const eventStatus = event.isActive
          ? EventStatus.Active
          : EventStatus.Completed;
        if (eventStatus !== query.status) return false;
      }

      // Filter by creator
      if (
        query.creator &&
        event.creator.toLowerCase() !== query.creator.toLowerCase()
      ) {
        return false;
      }

      // Filter by search term
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(searchLower);
        const matchesDescription = event.description
          .toLowerCase()
          .includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }

      return true;
    });
  }

  private sortEvents(
    events: EnrichedEvent[],
    sortBy: EventSortBy,
    sortOrder: SortOrder,
  ): EnrichedEvent[] {
    const dir = sortOrder === SortOrder.Asc ? 1 : -1;

    return [...events].sort((a, b) => {
      switch (sortBy) {
        case EventSortBy.CreatedAt:
          return (a.startTime - b.startTime) * dir;
        case EventSortBy.ParticipantCount:
          return (a.participantCount - b.participantCount) * dir;
        case EventSortBy.MatchCount:
          return (a.matchCount - b.matchCount) * dir;
        default:
          return 0;
      }
    });
  }
}

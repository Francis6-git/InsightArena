import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserEventResponseDto {
  @ApiProperty({ description: 'Event ID' })
  eventId: string;

  @ApiProperty({ description: 'Invite code' })
  inviteCode: string;

  @ApiProperty({ description: 'Creator address' })
  creator: string;

  @ApiProperty({ description: 'Event title' })
  title: string;

  @ApiProperty({ description: 'Event description' })
  description: string;

  @ApiProperty({ description: 'Start time (Unix timestamp)' })
  startTime: number;

  @ApiProperty({ description: 'End time (Unix timestamp)' })
  endTime: number;

  @ApiProperty({ description: 'Maximum participants' })
  maxParticipants: number;

  @ApiProperty({ description: 'Current participant count' })
  participantCount: number;

  @ApiProperty({ description: 'Total matches in event' })
  matchCount: number;

  @ApiProperty({ description: 'Is event active' })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'User score (correct predictions / total matches)',
  })
  userScore?: number;

  @ApiPropertyOptional({ description: 'User accuracy percentage' })
  userAccuracy?: number;

  @ApiPropertyOptional({ description: 'Has user predicted all matches' })
  predictedAll?: boolean;

  @ApiPropertyOptional({ description: 'Number of pending predictions' })
  pendingPredictions?: number;

  @ApiPropertyOptional({
    description: 'Number of participants (for created events)',
  })
  participantStats?: {
    total: number;
    active: number;
  };

  @ApiPropertyOptional({ description: 'Event status' })
  status?: 'active' | 'completed' | 'cancelled';
}

export class PaginatedUserEventsResponseDto {
  @ApiProperty({
    description: 'Array of user events',
    type: [UserEventResponseDto],
  })
  data: UserEventResponseDto[];

  @ApiProperty({ description: 'Total count of events' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}

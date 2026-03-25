import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MarketsService } from './markets.service';
import { Market } from './entities/market.entity';

@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch all markets' })
  @ApiResponse({
    status: 200,
    description: 'Markets retrieved successfully',
    type: [Market],
  })
  async getAllMarkets(): Promise<Market[]> {
    return this.marketsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch market by ID' })
  @ApiResponse({
    status: 200,
    description: 'Market retrieved successfully',
    type: Market,
  })
  @ApiResponse({ status: 404, description: 'Market not found' })
  async getMarketById(@Param('id') id: string): Promise<Market | null> {
    return this.marketsService.findById(id);
  }
}

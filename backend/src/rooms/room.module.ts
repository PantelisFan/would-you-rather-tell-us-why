import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { GameEngine } from '../game/game.engine';
import { QuestionBank } from '../questions/question.bank';

@Module({
  providers: [RoomService, RoomGateway, GameEngine, QuestionBank],
  exports: [RoomService],
})
export class RoomModule {}

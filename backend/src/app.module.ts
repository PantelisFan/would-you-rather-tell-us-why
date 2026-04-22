import { Module } from '@nestjs/common';
import { RoomModule } from './rooms/room.module';

@Module({
  imports: [RoomModule],
})
export class AppModule {}

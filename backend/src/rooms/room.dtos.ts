import {
  IsObject,
  IsString,
  Length,
  Matches,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @Length(1, 20)
  hostName!: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

export class JoinRoomDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]{4}$/)
  code!: string;

  @IsString()
  @Length(1, 20)
  name!: string;
}

export class RejoinRoomDto {
  @IsString()
  @Matches(/^[A-Za-z0-9]{4}$/)
  code!: string;

  @IsString()
  @Length(16, 16)
  playerId!: string;
}

export class UpdateConfigDto {
  @IsObject()
  config!: Record<string, unknown>;
}

export class LiveControlDto {
  @IsObject()
  controls!: Record<string, unknown>;
}

export class VoteSubmitDto {
  @IsString()
  @Length(1, 64)
  questionId!: string;

  @IsString()
  @Length(1, 64)
  optionId!: string;

  @IsString()
  @MaxLength(280)
  why!: string;
}

export class BestSubmitDto {
  @IsString()
  @Length(1, 64)
  questionId!: string;

  @IsString()
  @Length(1, 64)
  targetPlayerId!: string;
}

export class StorySubmitDto {
  @IsString()
  @Length(1, 64)
  questionId!: string;

  @IsString()
  @Length(1, 500)
  text!: string;
}

export class ChaosTriggerDto {
  @IsString()
  @Length(1, 32)
  type!: string;
}
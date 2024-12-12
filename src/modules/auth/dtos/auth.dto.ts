import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsString,
} from 'class-validator';

export class SignUpRequestDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
  })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  name: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'The password of the user. Must be between 8 and 20 characters.',
    minLength: 8,
    maxLength: 20,
  })
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(20)
  password: string;
}

export class SignUpResponseDto {
  @ApiProperty({
    example: '1ABC2DEF',
    description: 'The unique ID of the user',
  })
  @IsString()
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
  })
  @IsEmail()
  email: string;
}

export class SignInRequestDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The email address of the user',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'The password of the user',
  })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password: string;
}

export class RefreshAccessTokenResponseDto {
  @ApiProperty({
    example: 'abc123',
    description: 'The new access token for the user',
  })
  @IsString()
  accessToken: string;
}

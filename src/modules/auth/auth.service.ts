import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { EnvVariablesEnum } from '../../common/enums/env.enum';
import { ErrorMessageEnum } from '../../common/enums/error-messages.enum';
import { JwtUtils } from '../../common/modules/jwt-wrapper/jwt-wrapper.utils';
import { UserService } from '../user/user.service';
import {
  RefreshAccessTokenResponseDto,
  SignInRequestDto,
  SignUpRequestDto,
  SignUpResponseDto,
} from './dtos/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private jwtUtils: JwtUtils,
    private readonly userService: UserService
  ) {}

  generateRefreshToken(userId: string) {
    this.logger.log(`Generating refresh token for user ID: ${userId}`);

    return this.jwtService.sign(
      { userId },
      {
        secret: this.configService.get<string>(EnvVariablesEnum.JWT_SECRET),
        expiresIn: this.configService.get<string>(
          EnvVariablesEnum.REFRESH_TOKEN_EXPIRES_IN
        ),
      }
    );
  }

  generateAccessToken(userId: string) {
    this.logger.log(`Generating access token for user ID: ${userId}`);

    return this.jwtService.sign(
      { userId },
      {
        secret: this.configService.get<string>(EnvVariablesEnum.JWT_SECRET),
        expiresIn: this.configService.get<string>(
          EnvVariablesEnum.ACCESS_TOKEN_EXPIRES_IN
        ),
      }
    );
  }

  async signUp(signUpDto: SignUpRequestDto): Promise<SignUpResponseDto> {
    const { email, password } = signUpDto;

    this.logger.log(`Attempting sign up for email: ${email}`);

    const maxUsers = parseInt(
      this.configService.get<string>(EnvVariablesEnum.MAX_USERS, '4'),
      10
    );

    const userCount = await this.userService.getUserCount();
    if (userCount >= maxUsers) {
      this.logger.warn(
        `Cannot create new user. Maximum of ${maxUsers} users already reached.`
      );
      throw new ConflictException(
        `Maximum of ${maxUsers} users allowed. Please contact support.`
      );
    }

    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      this.logger.warn(`User with email ${email} already exists`);
      throw new ConflictException(ErrorMessageEnum.INTERNAL_SERVER_ERROR);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.createUser({
      ...signUpDto,
      password: hashedPassword,
    });
    this.logger.log(`User successfully signed up with email: ${email}`);

    return {
      id: user.id,
      email: user.email,
    };
  }

  async signIn({ email, password }: SignInRequestDto) {
    this.logger.log(`Attempting sign in for email: ${email}`);
    const user = await this.userService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      this.logger.warn(`Invalid credentials for email: ${email}`);
      throw new UnauthorizedException(ErrorMessageEnum.INVALID_CREDENTIALS);
    }

    this.logger.log(`User with email ${email} successfully authenticated`);
    const refreshToken = this.generateRefreshToken(user.id);
    const accessToken = this.generateAccessToken(user.id);
    const decodedRefreshToken = this.jwtService.decode(refreshToken) as {
      exp: number;
    };
    const maxAgeRefreshToken = decodedRefreshToken.exp * 1000 - Date.now();
    return {
      refreshToken,
      accessToken,
      maxAgeRefreshToken,
    };
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<RefreshAccessTokenResponseDto> {
    this.logger.log(`Attempting to refresh access token`);

    const payload = this.jwtUtils.verifyToken(refreshToken);
    if (!payload) {
      this.logger.warn(`Invalid refresh token`);
      throw new UnauthorizedException(ErrorMessageEnum.INVALID_REFRESH_TOKEN);
    }

    const { userId } = payload;
    const accessToken = this.generateAccessToken(userId);

    this.logger.log(
      `Successfully refreshed access token for user ID: ${userId}`
    );
    return {
      accessToken,
    };
  }
}

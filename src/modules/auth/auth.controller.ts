import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Version,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiHeader,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Response } from 'express-serve-static-core';
import { JwtAuthGuard } from '../../common/modules/jwt-wrapper/jwt-wrapper-auth.guard';
import { EnvVariablesEnum } from '../../common/enums/env.enum';
import { ErrorMessageEnum } from '../../common/enums/error-messages.enum';
import { AuthService } from './auth.service';
import {
  RefreshAccessTokenResponseDto,
  SignInRequestDto,
  SignUpRequestDto,
  SignUpResponseDto,
} from './dtos/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully signed up.',
    type: SignUpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request. Validation failed.',
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists.',
    schema: {
      example: {
        statusCode: 409,
        message: ErrorMessageEnum.INTERNAL_SERVER_ERROR,
      },
    },
  })
  @Version('1')
  @Post('signup')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async signUp(
    @Body() signUpDto: SignUpRequestDto
  ): Promise<SignUpResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @ApiOperation({ summary: 'Sign in a user' })
  @ApiHeader({
    name: 'Set-Cookie',
    description: 'HttpOnly refreshToken cookie is set in the response',
  })
  @ApiResponse({
    status: 200,
    description:
      'User successfully signed in. Access token is returned in the response body. Refresh token is set as an HttpOnly cookie.',
    schema: {
      example: {
        accessToken: 'JWT access token',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: `Invalid credentials. Error code: ${ErrorMessageEnum.INVALID_CREDENTIALS}`,
    schema: {
      example: {
        statusCode: 401,
        message: ErrorMessageEnum.INVALID_CREDENTIALS,
      },
    },
  })
  @Version('1')
  @HttpCode(200)
  @Post('signin')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async signIn(@Body() signInDto: SignInRequestDto, @Res() res: Response) {
    const { accessToken, refreshToken, maxAgeRefreshToken } =
      await this.authService.signIn(signInDto);

    res.cookie('refreshToken', refreshToken, {
      ...this.getPartialCookieDetails(),
      maxAge: maxAgeRefreshToken,
    });

    return res.json({ accessToken });
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiCookieAuth()
  @ApiHeader({
    name: 'Cookie',
    description: 'HttpOnly refreshToken must be present in the request cookies',
  })
  @ApiResponse({
    status: 200,
    description: 'Access token successfully refreshed.',
    type: RefreshAccessTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: `Invalid refresh token. Ensure the refresh token is provided in the cookie. Error code: ${ErrorMessageEnum.INVALID_REFRESH_TOKEN}`,
    schema: {
      example: {
        statusCode: 401,
        message: `${ErrorMessageEnum.INVALID_REFRESH_TOKEN}`,
      },
    },
  })
  @Version('1')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Post('refresh-access-token')
  async refreshAccessToken(@Req() req): Promise<RefreshAccessTokenResponseDto> {
    const { refreshToken } = req.cookies;
    return this.authService.refreshAccessToken(refreshToken);
  }

  @ApiOperation({ summary: 'Log out a user' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description:
      'User successfully logged out. Refresh token cookie is cleared.',
  })
  @Version('1')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @Post('logout')
  async logout(@Req() _req, @Res() res: Response) {
    res.clearCookie('refreshToken', {
      ...this.getPartialCookieDetails(),
      path: '/',
    });
    return res.json();
  }

  private async getPartialCookieDetails() {
    return {
      httpOnly: true,
      secure:
        this.configService.get<string>(EnvVariablesEnum.COOKIE_SECURE) ===
        'true',
      sameSite: this.configService.get<'lax' | 'strict' | 'none'>(
        EnvVariablesEnum.COOKIE_SAME_SITE
      ),
    };
  }
}

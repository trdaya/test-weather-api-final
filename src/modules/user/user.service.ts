import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignUpRequestDto } from '../auth/dtos/auth.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    this.logger.log(`Attempting to find user by email: ${email}`);
    const user = await this.userRepository.findOne({ where: { email } });

    if (user) {
      this.logger.log(`User found with email: ${email}`);
    } else {
      this.logger.warn(`No user found with email: ${email}`);
    }

    return user;
  }

  async createUser(createUserDto: SignUpRequestDto): Promise<User> {
    this.logger.log(`Creating new user with email: ${createUserDto.email}`);
    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    this.logger.log(`User created successfully with ID: ${savedUser.id}`);
    return savedUser;
  }

  async getUserCount(): Promise<number> {
    return this.userRepository.count();
  }

  async findById(id: string): Promise<User> {
    this.logger.log(`Attempting to find user by ID: ${id}`);
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['locations'],
    });

    if (!user) {
      this.logger.error(`User not found with ID: ${id}`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User found with ID: ${id}`);
    return user;
  }

  async save(user: User): Promise<void> {
    this.logger.log(`Attempting to save user with ID: ${user.id}`);
    await this.userRepository.save(user);
    this.logger.log(`Successfully saved user with ID: ${user.id}`);
  }
}

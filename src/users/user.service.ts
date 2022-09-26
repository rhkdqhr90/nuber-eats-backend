import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput } from './dtos/edit-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<{ ok: boolean; error?: string }> {
    // check new user
    try {
      const exists = await this.users.findOne({ where: { email } });
      if (exists) {
        //make error

        return { ok: false, error: '이미 존재 하는 이메일 입니다.' };
      }
      await this.users.save(this.users.create({ email, password, role }));
      return { ok: true };
    } catch (e) {
      //make error
      return { ok: false, error: '계정을 생성 할 수 없습니다. ' };
    }
    // create user $ hash the password
  }

  async login({
    email,
    password,
  }: LoginInput): Promise<{ ok: boolean; error?: string; token?: string }> {
    //find the user with the email
    //check the password wheather right or worng
    try {
      const user = await this.users.findOne({ where: { email } });
      if (!user) {
        return {
          ok: false,
          error: '이메일이 잘못 되었습니다.',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (passwordCorrect) {
        return {
          ok: false,
          error: '잘못된 비밀 번호 입니다.',
        };
      }
      const token = this.jwtService.sign({ id: user.id });
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async findById(id: number): Promise<User> {
    return this.users.findOne({ where: { id } });
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<User> {
    const checkEmail = await this.users.findOne({ where: { email } });
    if (checkEmail) {
      throw new Error('이미 존재하는 이메일입니다.');
    }

    const user = await this.users.findOne({ where: { id: userId } });

    if (email) {
      user.email = email;
    }
    if (password) {
      user.password = password;
    }

    return this.users.save(user);
  }
}

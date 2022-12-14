import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { LoginInput, LonginOutPut } from './dtos/login.dto';
import { User } from './entities/user.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailOutput } from './dtos/verify-emai.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly veritication: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    // check new user
    try {
      const exists = await this.users.findOne({ where: { email } });
      if (exists) {
        //make error

        return { ok: false, error: '이미 존재 하는 이메일 입니다.' };
      }
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      const verification = await this.veritication.save(
        this.veritication.create({ user }),
      );

      this.mailService.sendVerificationEmail(user.email, verification.code);
      return { ok: true };
    } catch (e) {
      //make error
      return { ok: false, error: '계정을 생성 할 수 없습니다. ' };
    }
    // create user $ hash the password
  }

  async login({ email, password }: LoginInput): Promise<LonginOutPut> {
    //find the user with the email
    //check the password wheather right or worng
    try {
      const user = await this.users.findOne({
        where: { email },
        select: ['password', 'id'],
      });
      if (!user) {
        return {
          ok: false,
          error: '이메일이 잘못 되었습니다.',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
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

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOne({ where: { id } });
      if (!user) {
        throw Error();
      }
      return {
        ok: Boolean(user),
        user,
      };
    } catch (error) {
      return {
        error: '유저를 찾지 못했습니다.',
        ok: false,
      };
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const checkEmail = await this.users.findOne({ where: { email } });
      if (checkEmail) {
        throw new Error('이미 존재하는 이메일입니다.');
      }

      const user = await this.users.findOne({ where: { id: userId } });

      if (email) {
        user.email = email;
        user.verified = false;
        const verification = await this.veritication.save(
          this.veritication.create({ user }),
        );

        this.mailService.sendVerificationEmail(user.email, verification.code);
      }
      if (password) {
        user.password = password;
      }

      this.users.save(user);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.veritication.findOne({
        where: { code },
        relations: ['user'],
      });
      if (verification) {
        verification.user.verified = true;
        await this.users.save(verification.user);
        await this.veritication.delete(verification.id);
        return {
          ok: true,
        };
      }
      return {
        ok: false,
        error: '인증문자가 틀렸습니다.',
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }
}

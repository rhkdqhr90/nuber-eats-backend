import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './user.service';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});
const mockJwtService = {
  sign: jest.fn(() => 'signed-token-baby'),
  verify: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn(),
};

type mockRepository<T = any> = Partial<
  Record<keyof Repository<User>, jest.Mock>
>;

describe('UserService', () => {
  let service: UsersService;
  let usersRepository: mockRepository<User>;
  let verificationRepository: mockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationRepository = module.get(getRepositoryToken(Verification));
  });
  it('it should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArg = {
      email: '',
      password: '',
      role: 0,
    };
    it('should fale if user exist', async () => {
      usersRepository.findOne.mockResolvedValue({
        where: {
          id: 1,
          email: '',
        },
      });
      const result = await service.createAccount(createAccountArg);
      expect(result).toMatchObject({
        ok: false,
        error: '이미 존재 하는 이메일 입니다.',
      });
    });
    it('should create a new user', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArg);
      usersRepository.save.mockResolvedValue(createAccountArg);
      verificationRepository.create.mockReturnValue({ user: createAccountArg });
      verificationRepository.save.mockResolvedValue({
        code: 'code',
      });
      const result = await service.createAccount(createAccountArg);
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArg);
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArg);
      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: createAccountArg,
      });
      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith({
        user: createAccountArg,
      });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
      expect(result).toEqual({ ok: true });
    });
    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error(':)'));

      const result = await service.createAccount(createAccountArg);
      expect(result).toEqual({
        ok: false,
        error: '계정을 생성 할 수 없습니다. ',
      });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'sadf@asdf',
      password: '1234',
    };
    it('should fail if user does not exsit', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.login(loginArgs);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(expect.any(Object));

      expect(result).toEqual({
        ok: false,
        error: '이메일이 잘못 되었습니다.',
      });
    });
    it('should fail if the password is wrong', async () => {
      const mockUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: '잘못된 비밀 번호 입니다.' });
    });
    it('should return token if password correct', async () => {
      const mockUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockUser);
      const result = await service.login(loginArgs);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual({ ok: true, token: 'signed-token-baby' });
    });
  });
  describe('findById', () => {
    const findById = {
      id: 1,
    };
    it('should find an existing user', async () => {
      usersRepository.findOne.mockResolvedValue(findById);
      const result = await service.findById(1);

      expect(result).toEqual({ ok: true, user: { id: 1 } });
    });
    it('should fail if no user if found', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(result).toEqual({ error: '유저를 찾지 못했습니다.', ok: false });
    });
  });
  describe('editProfile', () => {
    it('should change email', async () => {
      const oldUser = {
        email: '123@afd',
        verified: true,
      };
      const editProfileArg = {
        userId: 1,
        input: { email: '3@123' },
      };
      const newVerification = {
        code: 'code',
      };
      const newUser = {
        verified: false,
        email: editProfileArg.input.email,
      };
      usersRepository.findOne.mockResolvedValue(oldUser);

      verificationRepository.create.mockReturnValue(newVerification);
      verificationRepository.save.mockResolvedValue(newVerification);

      await service.editProfile(editProfileArg.userId, editProfileArg.input);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: editProfileArg.input,
      });
      // expect(verificationRepository.create).toHaveBeenCalledWith({
      //   user: newUser,
      // });
      // expect(verificationRepository.save).toHaveBeenCalledWith(newVerification);

      // expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
      //   newUser.email,
      //   newVerification.code,
      // );
    });
    // it('change [asswprd', async () => {
    //   const editProfileArg = {
    //     userId: 1,
    //     input: { password: '123' },
    //   };
    //   const dd = await service.editProfile(1, { password: '123' });
    //   console.log(dd);
    // });
  });
  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const mockedVerificaton = {
        user: {
          verified: true,
        },
        id: 1,
      };
      verificationRepository.findOne.mockResolvedValue(mockedVerificaton);
      await service.verifyEmail('');

      expect(verificationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationRepository.findOne).toHaveBeenCalledWith({
        relations: ['user'],
        where: { code: '' },
      });
    });
    // it('should fail on verification not found');
    // it('should fail on verification not found');
  });
});

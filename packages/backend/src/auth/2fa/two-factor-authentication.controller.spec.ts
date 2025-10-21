import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorAuthenticationController } from './two-factor-authentication.controller';
import { TwoFactorAuthenticationService } from './two-factor-authentication.service';
import { UserService } from '../../user/user.service';
import { AuthService } from '../auth.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { TurnOn2faDto, User } from '@live-chat/shared';

describe('TwoFactorAuthenticationController', () => {
  let controller: TwoFactorAuthenticationController;
  let twoFactorAuthService: jest.Mocked<TwoFactorAuthenticationService>;
  let userService: jest.Mocked<UserService>;
  let authService: jest.Mocked<AuthService>;
  let encryptionService: jest.Mocked<EncryptionService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwoFactorAuthenticationController],
      providers: [
        {
          provide: TwoFactorAuthenticationService,
          useValue: {
            generateSecret: jest.fn(),
            generateQrCodeDataURL: jest.fn(),
            isCodeValid: jest.fn(),
          },
        },
        {
          provide: UserService,
          useValue: {
            turnOnTwoFactorAuthentication: jest.fn(),
            findOneById: jest.fn(),
            turnOffTwoFactorAuthentication: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            loginAndReturnTokens: jest.fn(),
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn(),
            decrypt: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TwoFactorAuthenticationController>(
      TwoFactorAuthenticationController
    );
    twoFactorAuthService = module.get(TwoFactorAuthenticationService);
    userService = module.get(UserService);
    authService = module.get(AuthService);
    encryptionService = module.get(EncryptionService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generate', () => {
    it('should generate a QR code and set a cookie', async () => {
      const req = { user: { id: '1' } };
      const res = { cookie: jest.fn(), json: jest.fn() };
      twoFactorAuthService.generateSecret.mockResolvedValue({
        secret: 'secret',
        otpAuthUrl: 'otp',
      });
      twoFactorAuthService.generateQrCodeDataURL.mockResolvedValue('qr-code');
      encryptionService.encrypt.mockReturnValue('encrypted-secret');

      await controller.generate(req as any, res as any);

      expect(res.cookie).toHaveBeenCalledWith(
        '2fa_secret',
        'encrypted-secret',
        expect.any(Object)
      );
      expect(res.json).toHaveBeenCalledWith({ qrCodeDataURL: 'qr-code' });
    });
  });

  describe('turnOn', () => {
    const turnOnDto: TurnOn2faDto = { code: '123456' };

    it('should throw BadRequestException if cookie is missing', async () => {
      const req = { cookies: {} };
      await expect(controller.turnOn(req as any, turnOnDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw UnauthorizedException if code is invalid', async () => {
      const req = { user: { id: '1' }, cookies: { '2fa_secret': 'secret' } };
      encryptionService.decrypt.mockReturnValue('decrypted-secret');
      twoFactorAuthService.isCodeValid.mockReturnValue(false);

      await expect(controller.turnOn(req as any, turnOnDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should turn on 2FA and return recovery codes', async () => {
      const req = { user: { id: '1' }, cookies: { '2fa_secret': 'secret' } };
      const recoveryCodes = ['code1'];
      encryptionService.decrypt.mockReturnValue('decrypted-secret');
      twoFactorAuthService.isCodeValid.mockReturnValue(true);
      userService.turnOnTwoFactorAuthentication.mockResolvedValue({
        user: {} as User,
        recoveryCodes,
      });

      const result = await controller.turnOn(req as any, turnOnDto);

      expect(result.recoveryCodes).toEqual(recoveryCodes);
    });
  });

  describe('authenticate', () => {
    const authDto: TurnOn2faDto = { code: '123456' };

    it('should throw ForbiddenException if 2FA is not enabled', async () => {
      const req = { user: { sub: '1' }, ip: 'ip', headers: {} };
      const user = { isTwoFactorAuthenticationEnabled: false } as User;
      userService.findOneById.mockResolvedValue(user);

      await expect(
        controller.authenticate(req as any, authDto, {} as any)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException if code is invalid', async () => {
      const req = { user: { sub: '1' }, ip: 'ip', headers: {} };
      const user = {
        isTwoFactorAuthenticationEnabled: true,
        twoFactorAuthenticationSecret: 'secret',
      } as User;
      userService.findOneById.mockResolvedValue(user);
      encryptionService.decrypt.mockReturnValue('decrypted-secret');
      twoFactorAuthService.isCodeValid.mockReturnValue(false);

      await expect(
        controller.authenticate(req as any, authDto, {} as any)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens and user on successful authentication', async () => {
      const req = { user: { sub: '1' }, ip: 'ip', headers: {} };
      const res = { cookie: jest.fn(), json: jest.fn(), clearCookie: jest.fn() };
      const user = {
        isTwoFactorAuthenticationEnabled: true,
        twoFactorAuthenticationSecret: 'secret',
      } as User;
      const tokens = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user,
      };
      userService.findOneById.mockResolvedValue(user);
      encryptionService.decrypt.mockReturnValue('decrypted-secret');
      twoFactorAuthService.isCodeValid.mockReturnValue(true);
      authService.loginAndReturnTokens.mockResolvedValue(tokens);
      configService.get.mockReturnValue('30d');

      await controller.authenticate(req as any, authDto, res as any);

      expect(res.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh',
        expect.any(Object)
      );
      expect(res.clearCookie).toHaveBeenCalledWith('2fa_partial_token');
      expect(res.json).toHaveBeenCalledWith({ accessToken: 'access', user });
    });
  });

  describe('turnOff', () => {
    const turnOffDto: TurnOn2faDto = { code: '123456' };

    it('should throw ForbiddenException if 2FA is not enabled', async () => {
      const req = { user: { id: '1' } };
      const user = { isTwoFactorAuthenticationEnabled: false } as User;
      userService.findOneById.mockResolvedValue(user);

      await expect(controller.turnOff(req as any, turnOffDto)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw UnauthorizedException if code is invalid', async () => {
      const req = { user: { id: '1' } };
      const user = {
        isTwoFactorAuthenticationEnabled: true,
        twoFactorAuthenticationSecret: 'secret',
      } as User;
      userService.findOneById.mockResolvedValue(user);
      encryptionService.decrypt.mockReturnValue('decrypted-secret');
      twoFactorAuthService.isCodeValid.mockReturnValue(false);

      await expect(controller.turnOff(req as any, turnOffDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should turn off 2FA successfully', async () => {
      const req = { user: { id: '1' } };
      const user = {
        isTwoFactorAuthenticationEnabled: true,
        twoFactorAuthenticationSecret: 'secret',
      } as User;
      userService.findOneById.mockResolvedValue(user);
      encryptionService.decrypt.mockReturnValue('decrypted-secret');
      twoFactorAuthService.isCodeValid.mockReturnValue(true);

      const result = await controller.turnOff(req as any, turnOffDto);

      expect(userService.turnOffTwoFactorAuthentication).toHaveBeenCalledWith('1');
      expect(result.message).toContain('disabled');
    });
  });
});
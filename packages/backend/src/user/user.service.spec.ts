import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  User,
  UserStatus,
  RefreshToken,
  TwoFactorRecoveryCode,
} from '@live-chat/shared';
import { EntityManager, Repository } from 'typeorm';
import { EncryptionService } from '../common/services/encryption.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('bcrypt');
jest.mock('crypto');

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<Repository<User>>;
  let refreshTokenRepository: jest.Mocked<Repository<RefreshToken>>;
  let entityManager: jest.Mocked<EntityManager>;
  let encryptionService: jest.Mocked<EncryptionService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            preload: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: EntityManager,
          useValue: {
            transaction: jest.fn().mockImplementation((cb) => cb(entityManager)),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            remove: jest.fn(),
            create: jest.fn(),
            findOneBy: jest.fn(),
          } as any,
        },
        {
          provide: EncryptionService,
          useValue: {
            encrypt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken));
    entityManager = module.get(EntityManager);
    encryptionService = module.get(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOneById', () => {
    it('should return a user if found', async () => {
      const user = new User();
      userRepository.findOne.mockResolvedValue(user);
      const result = await service.findOneById('1');
      expect(result).toEqual(user);
    });

    it('should throw an error if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.findOneById('1')).rejects.toThrow();
    });
  });

  describe('requestEmailChange', () => {
    it('should throw error if password is wrong', async () => {
      const user = { passwordHash: 'hashed' } as User;
      jest.spyOn(service, 'findOneById').mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.requestEmailChange('1', 'new@test.com', 'wrong-pw')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return true for a valid token', async () => {
      const token = { expiresAt: new Date(Date.now() + 1000) } as RefreshToken;
      refreshTokenRepository.find.mockResolvedValue([token]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.verifyRefreshToken('token', '1');
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const token = { expiresAt: new Date(Date.now() - 1000) } as RefreshToken;
      refreshTokenRepository.find.mockResolvedValue([token]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.verifyRefreshToken('token', '1')).rejects.toThrow(
        UnauthorizedException
      );
      expect(refreshTokenRepository.delete).toHaveBeenCalledWith(token.id);
    });
  });

  describe('turnOnTwoFactorAuthentication', () => {
    it('should turn on 2FA and return recovery codes', async () => {
      const user = new User();
      encryptionService.encrypt.mockReturnValue('encrypted');
      (crypto.randomBytes as jest.Mock).mockReturnValue(Buffer.from('code'));
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      entityManager.findOneBy.mockResolvedValue(user);

      const result = await service.turnOnTwoFactorAuthentication('1', 'secret');

      expect(entityManager.update).toHaveBeenCalledWith(
        User,
        '1',
        expect.any(Object)
      );
      expect(entityManager.delete).toHaveBeenCalledWith(TwoFactorRecoveryCode, {
        userId: '1',
      });
      expect(entityManager.save).toHaveBeenCalled();
      expect(result.recoveryCodes.length).toBe(10);
    });
  });

  describe('turnOffTwoFactorAuthentication', () => {
    it('should turn off 2FA for a user', async () => {
      const user = new User();
      entityManager.findOneBy.mockResolvedValue(user);

      await service.turnOffTwoFactorAuthentication('1');

      expect(entityManager.update).toHaveBeenCalledWith(User, '1', {
        isTwoFactorAuthenticationEnabled: false,
        twoFactorAuthenticationSecret: null,
      });
      expect(entityManager.delete).toHaveBeenCalledWith(TwoFactorRecoveryCode, {
        userId: '1',
      });
    });
  });
});
import { RefreshToken } from "./refresh-token.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { TwoFactorRecoveryCode } from "./two-factor-recovery-code.entity";
import { UserIdentity } from "./user-identity.entity";
import { Role } from "./roles.enum"; // Legacy - for backward compatibility
import { GlobalRole } from "./global-roles.enum";
import { ProjectMember } from "./project-member.entity";

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

@Entity("users")
export class User {
  // --- Group 1: Identity & Authentication ---
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, type: "varchar" })
  email: string;

  @Column({ type: "varchar", nullable: true })
  passwordHash: string | null;

  @Column({ type: "boolean", default: false })
  isEmailVerified: boolean;

  // --- Group 2: Personal Information & UX ---
  @Column({ type: "varchar", nullable: true })
  fullName: string;

  @Column({ type: "varchar", nullable: true })
  avatarUrl: string;

  @Column({ type: "varchar", default: "Asia/Ho_Chi_Minh" })
  timezone: string;

  @Column({ type: "varchar", length: 2, default: "vi" })
  language: string;

  // --- Group 3: Status, Roles & Relationships ---
  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  // Global application-level role (for system features like admin dashboard)
  @Column({
    type: "enum",
    enum: GlobalRole,
    default: GlobalRole.USER,
  })
  role: GlobalRole;

  @Column({ type: "timestamptz", nullable: true })
  lastLoginAt: Date;

  @OneToMany(() => ProjectMember, (projectMember) => projectMember.user)
  projectMemberships: ProjectMember[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  hashedRefreshTokens: RefreshToken[];

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  tokensValidFrom: Date;

  // --- Group 4: New Features (2FA & Social Login) ---
  @Column({ type: "boolean", default: false })
  isTwoFactorAuthenticationEnabled: boolean;

  @Column({ type: "text", nullable: true })
  twoFactorAuthenticationSecret: string | null;

  @OneToMany(() => TwoFactorRecoveryCode, (code) => code.user)
  recoveryCodes: TwoFactorRecoveryCode[];

  @OneToMany(() => UserIdentity, (identity) => identity.user)
  identities: UserIdentity[];

  // --- Group 5: Timestamps ---
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}

/**
 * User response type - excludes sensitive fields and adds computed properties
 * This is what the API returns to clients
 */
export type UserResponse = Omit<User, "passwordHash"> & {
  hasPassword: boolean;
};

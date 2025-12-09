import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import db from '@/config/database';

export class AuthService {
  private readonly saltRounds = 12;
  private readonly jwtSecret = process.env.JWT_SECRET!;

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const { username, email, password, full_name, role = 'DEVELOPER' } = userData;

    // Check if user already exists
    const existingUser = await db('users')
      .where('email', email)
      .orWhere('username', username)
      .first();

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email already registered');
      }
      if (existingUser.username === username) {
        throw new Error('Username already taken');
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, this.saltRounds);

    // Create user
    const newUser: User = {
      id: uuidv4(),
      username,
      email,
      password_hash,
      role: role as UserRole,
      full_name,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db('users').insert(newUser);

    // Remove password hash from response
    const { password_hash: _, ...userResponse } = newUser;

    // Generate JWT token
    const token = this.generateToken(newUser.id);

    return {
      user: userResponse,
      token,
    };
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user
    const user = await db('users')
      .where({ email, is_active: true })
      .first();

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await db('users')
      .where({ id: user.id })
      .update({ last_login: new Date() });

    // Remove password hash from response
    const { password_hash: _, ...userResponse } = user;

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      user: userResponse,
      token,
    };
  }

  async getUserById(userId: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await db('users')
      .where({ id: userId, is_active: true })
      .first();

    if (!user) {
      return null;
    }

    const { password_hash: _, ...userResponse } = user;
    return userResponse;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<Omit<User, 'password_hash'>> {
    // Remove sensitive fields and auto-managed fields
    const { id, password_hash, created_at, created_by, ...allowedUpdates } = updates as any;

    const updateData = {
      ...allowedUpdates,
      updated_at: new Date(),
    };

    await db('users')
      .where({ id: userId })
      .update(updateData);

    const updatedUser = await db('users')
      .where({ id: userId })
      .first();

    const { password_hash: _, ...userResponse } = updatedUser;
    return userResponse;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get current user
    const user = await db('users')
      .where({ id: userId })
      .first();

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, this.saltRounds);

    // Update password
    await db('users')
      .where({ id: userId })
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date(),
      });
  }

  async deactivateUser(userId: string): Promise<void> {
    await db('users')
      .where({ id: userId })
      .update({
        is_active: false,
        updated_at: new Date(),
      });
  }

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: UserRole
  ): Promise<{ users: Omit<User, 'password_hash'>[]; total: number }> {
    let query = db('users')
      .where('is_active', true);

    if (search) {
      query = query.where((builder) => {
        builder
          .where('username', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('full_name', 'like', `%${search}%`);
      });
    }

    if (role) {
      query = query.where('role', role);
    }

    // Get total count
    const totalQuery = query.clone().clearSelect().clearOrder().count('* as count');
    const [{ count }] = await totalQuery;
    const total = parseInt(count as string);

    // Get paginated results
    const users = await query
      .select('*')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    // Remove password hashes
    const usersWithoutPasswords = users.map(user => {
      const { password_hash: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      users: usersWithoutPasswords,
      total,
    };
  }

  private generateToken(userId: string): string {
    const expiresInEnv = process.env.JWT_EXPIRES_IN;
    const expiresIn = expiresInEnv && /^\d+$/.test(expiresInEnv)
      ? Number(expiresInEnv)
      : 60 * 60 * 24 * 7;
    const options: jwt.SignOptions = { expiresIn };
    return jwt.sign(
      { userId },
      this.jwtSecret as jwt.Secret,
      options
    );
  }

  verifyToken(token: string): { userId: string } | null {
    try {
      return jwt.verify(token, this.jwtSecret) as { userId: string };
    } catch (error) {
      return null;
    }
  }
}

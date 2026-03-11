import prisma from '../../lib/prisma';
import { generateToken, generateRefreshToken } from '../../lib/jwt';
import { RegisterUserDto, UpdateUserDto, AddChildDto, UpdateChildDto } from './users.dto';
import { findOrCreateSchool } from '../schools/schools.service';

export async function registerUser(data: RegisterUserDto) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new Error('User with this email already exists');
  }

  const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existingPhone) {
    throw new Error('User with this phone already exists');
  }

  let schoolId = data.schoolId;

  // Auto-create school if schoolName is provided but schoolId is not
  if (!schoolId && data.schoolName && data.board && data.city) {
    const school = await findOrCreateSchool(
      data.schoolName,
      data.city,
      data.board
    );
    if (school) {
      schoolId = school.id;
    }
  }

  const userData = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    city: data.city,
    address: data.address,
    schoolId: schoolId,
    board: data.board,
    isVerified: true,
  };

  const user = await prisma.user.create({
    data: userData,
    include: { children: true, school: true },
  });

  const payload = { userId: user.id, email: user.email };
  return {
    user,
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { children: { include: { school: true } }, school: true },
  });
  if (!user) throw new Error('User not found');
  return user;
}

export async function updateUser(userId: string, data: UpdateUserDto) {
  return prisma.user.update({
    where: { id: userId },
    data,
    include: { children: { include: { school: true } }, school: true },
  });
}

export async function addChild(userId: string, data: AddChildDto) {
  return prisma.child.create({
    data: { ...data, userId },
    include: { school: true },
  });
}

export async function updateChild(userId: string, childId: string, data: UpdateChildDto) {
  const child = await prisma.child.findFirst({
    where: { id: childId, userId },
  });
  if (!child) throw new Error('Child not found');

  return prisma.child.update({
    where: { id: childId },
    data,
    include: { school: true },
  });
}

export async function deleteChild(userId: string, childId: string) {
  const child = await prisma.child.findFirst({
    where: { id: childId, userId },
  });
  if (!child) throw new Error('Child not found');

  await prisma.child.delete({ where: { id: childId } });
  return { message: 'Child removed' };
}

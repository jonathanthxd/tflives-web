import { CreatorApplicationStatus, CreatorStatus, Prisma, type Role } from "@prisma/client";
import { normalizeUsername } from "@/modules/authentication/validation";
import { logAdminAction } from "@/modules/administration/action-log";
import { createNotification } from "@/modules/notifications/service";
import { publicIdentitySelect, toPublicIdentity } from "@/modules/profiles/service";
import { prisma } from "@/infrastructure/database/prisma";
import type {
  AdminCreatorUpdateInput,
  CreatorApplicationInput,
  CreatorProfileUpdateInput,
  CreatorReviewInput,
} from "@/modules/creators/validation";

export class CreatorError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const publicCreatorInclude = {
  user: { select: publicIdentitySelect },
  platforms: { select: { type: true, url: true }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.CreatorProfileInclude;

type PublicCreatorRecord = Prisma.CreatorProfileGetPayload<{ include: typeof publicCreatorInclude }>;

export interface PublicCreator {
  id: string;
  username: string;
  displayName: string | null;
  name: string | null;
  image: string | null;
  category: string;
  headline: string | null;
  description: string;
  featured: boolean;
  platforms: { type: string; url: string }[];
}

export function toPublicCreator(creator: PublicCreatorRecord): PublicCreator | null {
  const identity = toPublicIdentity(creator.user);
  if (!identity.username) return null;
  return {
    id: creator.id,
    username: identity.username,
    displayName: identity.displayName,
    name: identity.name,
    image: identity.image,
    category: creator.category,
    headline: creator.headline,
    description: creator.description,
    featured: creator.featured,
    platforms: creator.platforms,
  };
}

export async function listPublicCreators(category?: string, query?: string) {
  const normalizedQuery = query?.trim();
  const creators = await prisma.creatorProfile.findMany({
    where: {
      status: CreatorStatus.ACTIVE,
      ...(category ? { category: category as never } : {}),
      user: {
        username: { not: null },
        ...(normalizedQuery ? {
          OR: [
            { username: { contains: normalizedQuery.replace(/^@/, ""), mode: "insensitive" } },
            { displayName: { contains: normalizedQuery, mode: "insensitive" } },
            { name: { contains: normalizedQuery, mode: "insensitive" } },
          ],
        } : {}),
      },
    },
    include: publicCreatorInclude,
    orderBy: [{ featured: "desc" }, { featuredOrder: "asc" }, { acceptedAt: "desc" }],
    take: 48,
  });
  return creators.map(toPublicCreator).filter((creator): creator is PublicCreator => creator !== null);
}

export async function listFeaturedCreators() {
  const creators = await prisma.creatorProfile.findMany({
    where: { status: CreatorStatus.ACTIVE, featured: true, user: { username: { not: null } } },
    include: publicCreatorInclude,
    orderBy: [{ featuredOrder: "asc" }, { acceptedAt: "desc" }],
    take: 6,
  });
  return creators.map(toPublicCreator).filter((creator): creator is PublicCreator => creator !== null);
}

export async function findPublicCreator(rawUsername: string) {
  const username = normalizeUsername(rawUsername);
  if (!/^[a-z][a-z0-9_]{2,19}$/.test(username)) return null;
  const direct = await prisma.creatorProfile.findFirst({
    where: { status: CreatorStatus.ACTIVE, user: { username: { equals: username, mode: "insensitive" } } },
    include: publicCreatorInclude,
  });
  if (direct) return { creator: toPublicCreator(direct), alias: false };
  const alias = await prisma.usernameAlias.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { user: { select: { creatorProfile: { include: publicCreatorInclude } } } },
  });
  const creator = alias?.user.creatorProfile;
  return creator?.status === CreatorStatus.ACTIVE ? { creator: toPublicCreator(creator), alias: true } : null;
}

export async function getOwnCreatorApplication(userId: string) {
  const application = await prisma.creatorApplication.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      primaryPlatform: true,
      channelUrl: true,
      category: true,
      description: true,
      activityFrequency: true,
      status: true,
      rejectionMessage: true,
      createdAt: true,
      reviewedAt: true,
    },
  });
  return application;
}

export async function getOwnCreatorProfile(userId: string) {
  const creator = await prisma.creatorProfile.findUnique({ where: { userId }, include: publicCreatorInclude });
  if (!creator) return null;
  const publicCreator = toPublicCreator(creator);
  return publicCreator ? { ...publicCreator, status: creator.status } : null;
}

export async function applyForCreator(userId: string, input: CreatorApplicationInput) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  if (!user) throw new CreatorError("User not found", 404);
  if (!user.username) throw new CreatorError("Choose a public username before applying", 400);
  const [creator, pending] = await Promise.all([
    prisma.creatorProfile.findUnique({ where: { userId }, select: { id: true } }),
    prisma.creatorApplication.findFirst({ where: { userId, status: CreatorApplicationStatus.PENDING }, select: { id: true } }),
  ]);
  if (creator) throw new CreatorError("You are already in the creator program", 409);
  if (pending) throw new CreatorError("You already have an active creator application", 409);

  try {
    return await prisma.$transaction(async (tx) => {
      const application = await tx.creatorApplication.create({ data: { userId, ...input } });
      await createNotification({
        userId,
        type: "CREATOR_APPLICATION",
        entityType: "CreatorApplication",
        entityId: application.id,
      }, tx);
      return application;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new CreatorError("You already have an active creator application", 409);
    }
    throw error;
  }
}

export async function reviewCreatorApplication(actorId: string, applicationId: string, input: CreatorReviewInput) {
  const result = await prisma.$transaction(async (tx) => {
    const application = await tx.creatorApplication.findUnique({
      where: { id: applicationId },
      select: { id: true, userId: true, primaryPlatform: true, channelUrl: true, category: true, description: true, status: true, user: { select: { username: true } } },
    });
    if (!application) throw new CreatorError("Creator application not found", 404);
    if (application.status !== CreatorApplicationStatus.PENDING) throw new CreatorError("This application has already been reviewed", 409);
    if (!application.user.username) throw new CreatorError("The applicant needs a public username", 409);

    const now = new Date();
    if (input.action === "approve") {
      const creator = await tx.creatorProfile.upsert({
        where: { userId: application.userId },
        create: {
          userId: application.userId,
          status: CreatorStatus.ACTIVE,
          category: application.category,
          description: application.description,
          acceptedAt: now,
        },
        update: {
          status: CreatorStatus.ACTIVE,
          category: application.category,
          description: application.description,
          acceptedAt: now,
        },
      });
      await tx.creatorPlatform.upsert({
        where: { creatorId_type: { creatorId: creator.id, type: application.primaryPlatform } },
        create: { creatorId: creator.id, type: application.primaryPlatform, url: application.channelUrl },
        update: { url: application.channelUrl },
      });
      await tx.creatorApplication.update({
        where: { id: application.id },
        data: { status: CreatorApplicationStatus.APPROVED, adminNote: input.adminNote ?? null, rejectionMessage: null, reviewedById: actorId, reviewedAt: now },
      });
      await createNotification({ userId: application.userId, type: "CREATOR_APPROVED", actorId, entityType: "CreatorProfile", entityId: creator.id }, tx);
      return { application, creatorId: creator.id, action: input.action };
    }

    await tx.creatorApplication.update({
      where: { id: application.id },
      data: { status: CreatorApplicationStatus.REJECTED, adminNote: input.adminNote ?? null, rejectionMessage: input.rejectionMessage ?? null, reviewedById: actorId, reviewedAt: now },
    });
    await createNotification({ userId: application.userId, type: "CREATOR_REJECTED", actorId, entityType: "CreatorApplication", entityId: application.id }, tx);
    return { application, creatorId: null, action: input.action };
  });
  await logAdminAction({ actorId, action: `creator.application.${result.action}`, targetType: "CreatorApplication", targetId: applicationId, metadata: { applicantId: result.application.userId, creatorId: result.creatorId } });
  return result;
}

export async function updateOwnCreatorProfile(userId: string, input: CreatorProfileUpdateInput) {
  const creator = await prisma.creatorProfile.findUnique({ where: { userId }, select: { id: true, status: true } });
  if (!creator) throw new CreatorError("Creator profile not found", 404);
  if (creator.status !== CreatorStatus.ACTIVE) throw new CreatorError("Only active creators can update their page", 403);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.creatorProfile.update({
      where: { id: creator.id },
      data: {
        ...(input.headline !== undefined ? { headline: input.headline } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
      include: publicCreatorInclude,
    });
    if (input.platforms) {
      await tx.creatorPlatform.deleteMany({ where: { creatorId: creator.id } });
      await tx.creatorPlatform.createMany({ data: input.platforms.map((platform) => ({ creatorId: creator.id, ...platform })) });
      return tx.creatorProfile.findUniqueOrThrow({ where: { id: creator.id }, include: publicCreatorInclude });
    }
    return updated;
  }).then((profile) => toPublicCreator(profile));
}

export async function updateCreatorByAdmin(actorId: string, creatorId: string, input: AdminCreatorUpdateInput) {
  const existing = await prisma.creatorProfile.findUnique({ where: { id: creatorId }, select: { id: true, userId: true, status: true, featured: true } });
  if (!existing) throw new CreatorError("Creator not found", 404);
  const status = input.action === "pause" ? CreatorStatus.PAUSED : input.action === "reactivate" ? CreatorStatus.ACTIVE : existing.status;
  const updated = await prisma.$transaction(async (tx) => {
    const creator = await tx.creatorProfile.update({
      where: { id: creatorId },
      data: {
        status,
        ...(input.category ? { category: input.category } : {}),
        ...(input.headline !== undefined ? { headline: input.headline } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        ...(input.featuredOrder !== undefined ? { featuredOrder: input.featuredOrder } : {}),
      },
      include: publicCreatorInclude,
    });
    if (status !== existing.status) {
      await createNotification({ userId: existing.userId, type: "CREATOR_STATUS", actorId, entityType: "CreatorProfile", entityId: creatorId }, tx);
    }
    if (input.featured === true && !existing.featured) {
      await createNotification({ userId: existing.userId, type: "CREATOR_FEATURED", actorId, entityType: "CreatorProfile", entityId: creatorId }, tx);
    }
    return creator;
  });
  await logAdminAction({ actorId, action: `creator.profile.${input.action}`, targetType: "CreatorProfile", targetId: creatorId, metadata: { status, featured: input.featured } });
  return toPublicCreator(updated);
}

export async function listCreatorAdminData() {
  const [applications, creators] = await Promise.all([
    prisma.creatorApplication.findMany({
      include: { user: { select: publicIdentitySelect }, reviewedBy: { select: publicIdentitySelect } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.creatorProfile.findMany({ include: publicCreatorInclude, orderBy: [{ status: "asc" }, { acceptedAt: "desc" }], take: 100 }),
  ]);
  return {
    applications,
    creators: creators.map((creator) => {
      const publicCreator = toPublicCreator(creator);
      return publicCreator ? { ...publicCreator, status: creator.status } : null;
    }).filter((creator): creator is PublicCreator & { status: CreatorStatus } => creator !== null),
  };
}

export function canManageCreators(role: Role) {
  return role === "ADMIN";
}

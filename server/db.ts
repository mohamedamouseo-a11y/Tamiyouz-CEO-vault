import { eq, and, like, inArray, isNull, isNotNull, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  InsertCategory,
  categories,
  InsertTag,
  tags,
  InsertAccount,
  accounts,
  InsertAccountTag,
  accountTags,
  InsertCustomFieldTemplate,
  customFieldTemplates,
  InsertCustomFieldValue,
  customFieldValues,
  InsertAuditLog,
  auditLogs,
  InsertNotification,
  notifications,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER OPERATIONS =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= CATEGORY OPERATIONS =============

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return result;
}

export async function getCategories(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(categories).where(eq(categories.userId, userId));
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(categories).where(eq(categories.id, id));
}

// ============= TAG OPERATIONS =============

export async function createTag(data: InsertTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tags).values(data);
  return result;
}

export async function getTags(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(tags).where(eq(tags.userId, userId));
}

export async function updateTag(id: number, data: Partial<InsertTag>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(tags).set(data).where(eq(tags.id, id));
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(tags).where(eq(tags.id, id));
}

// ============= ACCOUNT OPERATIONS =============

export async function createAccount(data: InsertAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(accounts).values(data);
  return result;
}

export async function getAccounts(userId: number, filters?: {
  categoryId?: number;
  search?: string;
  isArchived?: boolean;
  tagIds?: number[];
  taskLinkStatus?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(accounts.userId, userId)];

  if (filters?.categoryId) {
    conditions.push(eq(accounts.categoryId, filters.categoryId));
  }

  if (filters?.search) {
    conditions.push(like(accounts.name, `%${filters.search}%`));
  }

  if (filters?.isArchived !== undefined) {
    conditions.push(eq(accounts.isArchived, filters.isArchived));
  }

  if (filters?.taskLinkStatus) {
    conditions.push(eq(accounts.taskLinkStatus, filters.taskLinkStatus));
  }

  return db
    .select()
    .from(accounts)
    .where(and(...conditions))
    .orderBy(desc(accounts.createdAt));
}

export async function getAccountById(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
    .limit(1);
  return result[0];
}

export async function updateAccount(id: number, data: Partial<InsertAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(accounts).set(data).where(eq(accounts.id, id));
}

export async function deleteAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(accounts).where(eq(accounts.id, id));
}

// ============= ACCOUNT-TAG OPERATIONS =============

export async function addTagToAccount(accountId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(accountTags).values({ accountId, tagId });
}

export async function removeTagFromAccount(accountId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .delete(accountTags)
    .where(and(eq(accountTags.accountId, accountId), eq(accountTags.tagId, tagId)));
}

export async function getAccountTags(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(accountTags).where(eq(accountTags.accountId, accountId));
}

// ============= CUSTOM FIELD TEMPLATE OPERATIONS =============

export async function createCustomFieldTemplate(data: InsertCustomFieldTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(customFieldTemplates).values(data);
}

export async function getCustomFieldTemplates(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(customFieldTemplates)
    .where(eq(customFieldTemplates.userId, userId))
    .orderBy(asc(customFieldTemplates.order));
}

export async function updateCustomFieldTemplate(
  id: number,
  data: Partial<InsertCustomFieldTemplate>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(customFieldTemplates).set(data).where(eq(customFieldTemplates.id, id));
}

export async function deleteCustomFieldTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(customFieldTemplates).where(eq(customFieldTemplates.id, id));
}

// ============= CUSTOM FIELD VALUE OPERATIONS =============

export async function setCustomFieldValue(
  accountId: number,
  fieldTemplateId: number,
  value: string | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(customFieldValues)
    .where(
      and(
        eq(customFieldValues.accountId, accountId),
        eq(customFieldValues.fieldTemplateId, fieldTemplateId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return db
      .update(customFieldValues)
      .set({ value })
      .where(
        and(
          eq(customFieldValues.accountId, accountId),
          eq(customFieldValues.fieldTemplateId, fieldTemplateId)
        )
      );
  } else {
    return db.insert(customFieldValues).values({ accountId, fieldTemplateId, value });
  }
}

export async function getCustomFieldValues(accountId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(customFieldValues).where(eq(customFieldValues.accountId, accountId));
}

// ============= AUDIT LOG OPERATIONS =============

export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(auditLogs).values(data);
}

export async function getAuditLogs(userId: number, accountId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(auditLogs.userId, userId)];

  if (accountId) {
    conditions.push(eq(auditLogs.accountId, accountId));
  }

  return db
    .select()
    .from(auditLogs)
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt));
}

// ============= NOTIFICATION OPERATIONS =============

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(notifications).values(data);
}

export async function getNotifications(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [eq(notifications.userId, userId)];

  if (unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  return db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

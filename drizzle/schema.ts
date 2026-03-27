import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, index, foreignKey } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Categories table for organizing accounts
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).default("#3b82f6"),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  index("idx_categories_userId").on(table.userId),
]));

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// Tags table for tagging accounts
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 7 }).default("#8b5cf6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  index("idx_tags_userId").on(table.userId),
]));

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

// Main accounts table
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  username: varchar("username", { length: 255 }),
  email: varchar("email", { length: 320 }),
  password: text("password"),
  url: varchar("url", { length: 2048 }),
  notes: text("notes"),
  taskLinkStatus: varchar("taskLinkStatus", { length: 50 }).default("active"),
  expirationDate: timestamp("expirationDate"),
  isArchived: boolean("isArchived").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  index("idx_accounts_userId").on(table.userId),
  index("idx_accounts_categoryId").on(table.categoryId),
]));

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

// Account-Tag relationship table (many-to-many)
export const accountTags = mysqlTable("accountTags", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  tagId: int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ([
  index("idx_accountTags_accountId").on(table.accountId),
  index("idx_accountTags_tagId").on(table.tagId),
]));

export type AccountTag = typeof accountTags.$inferSelect;
export type InsertAccountTag = typeof accountTags.$inferInsert;

// Custom field templates
export const customFieldTemplates = mysqlTable("customFieldTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fieldType: mysqlEnum("fieldType", ["text", "number", "date", "select", "checkbox", "textarea"]).notNull(),
  isRequired: boolean("isRequired").default(false),
  options: json("options"), // For select field options
  placeholder: varchar("placeholder", { length: 255 }),
  description: text("description"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  index("idx_customFieldTemplates_userId").on(table.userId),
]));

export type CustomFieldTemplate = typeof customFieldTemplates.$inferSelect;
export type InsertCustomFieldTemplate = typeof customFieldTemplates.$inferInsert;

// Custom field values for each account
export const customFieldValues = mysqlTable("customFieldValues", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  fieldTemplateId: int("fieldTemplateId").notNull(),
  value: text("value"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  index("idx_customFieldValues_accountId").on(table.accountId),
  index("idx_customFieldValues_fieldTemplateId").on(table.fieldTemplateId),
]));

export type CustomFieldValue = typeof customFieldValues.$inferSelect;
export type InsertCustomFieldValue = typeof customFieldValues.$inferInsert;

// Audit log for tracking account changes
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId"),
  action: varchar("action", { length: 50 }).notNull(), // create, update, delete, view
  changes: json("changes"), // JSON object with before/after values
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ([
  index("idx_auditLogs_userId").on(table.userId),
  index("idx_auditLogs_accountId").on(table.accountId),
]));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// Notifications table
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  type: mysqlEnum("type", ["account_created", "account_updated", "account_deleted", "category_created", "tag_created"]).notNull(),
  relatedAccountId: int("relatedAccountId"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ([
  index("idx_notifications_userId").on(table.userId),
]));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
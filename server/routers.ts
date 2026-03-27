import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createTag,
  getTags,
  updateTag,
  deleteTag,
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  addTagToAccount,
  removeTagFromAccount,
  getAccountTags,
  createCustomFieldTemplate,
  getCustomFieldTemplates,
  updateCustomFieldTemplate,
  deleteCustomFieldTemplate,
  setCustomFieldValue,
  getCustomFieldValues,
  createAuditLog,
  getAuditLogs,
  createNotification,
  getNotifications,
  markNotificationAsRead,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============= CATEGORIES ROUTER =============
  categories: router({
    list: protectedProcedure.query(({ ctx }) =>
      getCategories(ctx.user.id)
    ),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Category name is required"),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createCategory({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          color: input.color,
          icon: input.icon,
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "create",
          description: `Created category: ${input.name}`,
        });

        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await updateCategory(input.id, {
          name: input.name,
          description: input.description,
          color: input.color,
          icon: input.icon,
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "update",
          description: `Updated category: ${input.name}`,
        });

        return result;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCategory(input.id);

        await createAuditLog({
          userId: ctx.user.id,
          action: "delete",
          description: `Deleted category with ID: ${input.id}`,
        });

        return { success: true };
      }),
  }),

  // ============= TAGS ROUTER =============
  tags: router({
    list: protectedProcedure.query(({ ctx }) =>
      getTags(ctx.user.id)
    ),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Tag name is required"),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createTag({
          userId: ctx.user.id,
          name: input.name,
          color: input.color,
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "create",
          description: `Created tag: ${input.name}`,
        });

        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await updateTag(input.id, {
          name: input.name,
          color: input.color,
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: "update",
          description: `Updated tag: ${input.name}`,
        });

        return result;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteTag(input.id);

        await createAuditLog({
          userId: ctx.user.id,
          action: "delete",
          description: `Deleted tag with ID: ${input.id}`,
        });

        return { success: true };
      }),
  }),

  // ============= ACCOUNTS ROUTER =============
  accounts: router({
    list: protectedProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        search: z.string().optional(),
        isArchived: z.boolean().optional(),
        taskLinkStatus: z.string().optional(),
        tagIds: z.array(z.number()).optional(),
        expirationDateFrom: z.date().optional(),
        expirationDateTo: z.date().optional(),
      }).optional())
      .query(({ ctx, input }) =>
        getAccounts(ctx.user.id, input)
      ),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const account = await getAccountById(input.id, ctx.user.id);
        if (!account) throw new Error("Account not found");

        const tags = await getAccountTags(input.id);
        const customFields = await getCustomFieldValues(input.id);

        return { account, tags, customFields };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Account name is required"),
        categoryId: z.number().optional(),
        description: z.string().optional(),
        username: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().optional(),
        url: z.string().optional(),
        notes: z.string().optional(),
        taskLinkStatus: z.string().optional(),
        expirationDate: z.date().optional(),
        tagIds: z.array(z.number()).optional(),
        customFields: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createAccount({
          userId: ctx.user.id,
          name: input.name,
          categoryId: input.categoryId,
          description: input.description,
          username: input.username,
          email: input.email,
          password: input.password,
          url: input.url,
          notes: input.notes,
          taskLinkStatus: input.taskLinkStatus || "active",
          expirationDate: input.expirationDate,
        });

        const accountId = (result as any).insertId as number;

        // Add tags
        if (input.tagIds && input.tagIds.length > 0) {
          for (const tagId of input.tagIds) {
            await addTagToAccount(accountId, tagId);
          }
        }

        // Add custom fields
        if (input.customFields) {
          for (const [fieldId, value] of Object.entries(input.customFields)) {
            await setCustomFieldValue(accountId, parseInt(fieldId), value);
          }
        }

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          accountId,
          action: "create",
          description: `Created account: ${input.name}`,
        });

        // Create notification
        await createNotification({
          userId: ctx.user.id,
          title: "Account Created",
          content: `New account "${input.name}" has been created.`,
          type: "account_created",
          relatedAccountId: accountId,
        });

        return { id: accountId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        categoryId: z.number().optional(),
        description: z.string().optional(),
        username: z.string().optional(),
        email: z.string().email().optional(),
        password: z.string().optional(),
        url: z.string().optional(),
        notes: z.string().optional(),
        taskLinkStatus: z.string().optional(),
        expirationDate: z.date().optional(),
        isArchived: z.boolean().optional(),
        tagIds: z.array(z.number()).optional(),
        customFields: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const account = await getAccountById(input.id, ctx.user.id);
        if (!account) throw new Error("Account not found");

        await updateAccount(input.id, {
          name: input.name,
          categoryId: input.categoryId,
          description: input.description,
          username: input.username,
          email: input.email,
          password: input.password,
          url: input.url,
          notes: input.notes,
          taskLinkStatus: input.taskLinkStatus,
          expirationDate: input.expirationDate,
          isArchived: input.isArchived,
        });

        // Update tags
        if (input.tagIds) {
          const currentTags = await getAccountTags(input.id);
          const currentTagIds = currentTags.map(t => t.tagId);

          for (const tagId of currentTagIds) {
            if (!input.tagIds.includes(tagId)) {
              await removeTagFromAccount(input.id, tagId);
            }
          }

          for (const tagId of input.tagIds) {
            if (!currentTagIds.includes(tagId)) {
              await addTagToAccount(input.id, tagId);
            }
          }
        }

        // Update custom fields
        if (input.customFields) {
          for (const [fieldId, value] of Object.entries(input.customFields)) {
            await setCustomFieldValue(input.id, parseInt(fieldId), value);
          }
        }

        // Create audit log
        await createAuditLog({
          userId: ctx.user.id,
          accountId: input.id,
          action: "update",
          description: `Updated account: ${input.name || account.name}`,
        });

        // Create notification
        await createNotification({
          userId: ctx.user.id,
          title: "Account Updated",
          content: `Account "${input.name || account.name}" has been updated.`,
          type: "account_updated",
          relatedAccountId: input.id,
        });

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const account = await getAccountById(input.id, ctx.user.id);
        if (!account) throw new Error("Account not found");

        await deleteAccount(input.id);

        await createAuditLog({
          userId: ctx.user.id,
          accountId: input.id,
          action: "delete",
          description: `Deleted account: ${account.name}`,
        });

        await createNotification({
          userId: ctx.user.id,
          title: "Account Deleted",
          content: `Account "${account.name}" has been deleted.`,
          type: "account_deleted",
          relatedAccountId: input.id,
        });

        return { success: true };
      }),
  }),

  // ============= CUSTOM FIELDS ROUTER =============
  customFields: router({
    listTemplates: protectedProcedure.query(({ ctx }) =>
      getCustomFieldTemplates(ctx.user.id)
    ),

    createTemplate: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        fieldType: z.enum(["text", "number", "date", "select", "checkbox", "textarea"]),
        isRequired: z.boolean().optional(),
        options: z.any().optional(),
        placeholder: z.string().optional(),
        description: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createCustomFieldTemplate({
          userId: ctx.user.id,
          name: input.name,
          fieldType: input.fieldType,
          isRequired: input.isRequired,
          options: input.options,
          placeholder: input.placeholder,
          description: input.description,
          order: input.order || 0,
        });

        return result;
      }),

    updateTemplate: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        fieldType: z.enum(["text", "number", "date", "select", "checkbox", "textarea"]).optional(),
        isRequired: z.boolean().optional(),
        options: z.any().optional(),
        placeholder: z.string().optional(),
        description: z.string().optional(),
        order: z.number().optional(),
      }))
      .mutation(({ input }) =>
        updateCustomFieldTemplate(input.id, {
          name: input.name,
          fieldType: input.fieldType,
          isRequired: input.isRequired,
          options: input.options,
          placeholder: input.placeholder,
          description: input.description,
          order: input.order,
        })
      ),

    deleteTemplate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(() => deleteCustomFieldTemplate(1)),
  }),

  // ============= NOTIFICATIONS ROUTER =============
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().optional() }).optional())
      .query(({ ctx, input }) =>
        getNotifications(ctx.user.id, input?.unreadOnly)
      ),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) =>
        markNotificationAsRead(input.id)
      ),
  }),

  // ============= AUDIT LOGS ROUTER =============
  auditLogs: router({
    list: protectedProcedure
      .input(z.object({ accountId: z.number().optional() }).optional())
      .query(({ ctx, input }) =>
        getAuditLogs(ctx.user.id, input?.accountId)
      ),
  }),
});

export type AppRouter = typeof appRouter;

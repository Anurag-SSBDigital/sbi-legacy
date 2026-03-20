import type { z } from "zod";
import type { CreditAuditFormSchema } from "./creditAudit.schema";

export type CreditAuditFormValues = z.infer<typeof CreditAuditFormSchema>;

export type YesNoNA = "YES" | "NO" | "NA";

export type CreditAuditStoredRecord = {
  id: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
} & CreditAuditFormValues;
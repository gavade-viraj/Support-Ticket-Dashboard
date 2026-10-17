import { z } from "zod";

export const createTicketSchema = z.object({
    customerName: z
        .string()
        .min(2, "Customer name must be at least 2 characters"),

    customerEmail: z
        .string()
        .email("Invalid email address"),

    issueCategory: z.enum([
        "Technical",
        "Billing",
        "Account",
        "Other"
    ]),

    priority: z.enum([
        "Low",
        "Medium",
        "High"
    ]),

    description: z
        .string()
        .min(20, "Description must be at least 20 characters"),

    dueDate: z
        .string()
        .refine(
            (date) => !isNaN(Date.parse(date)),
            "Invalid due date"
        )
        .refine(
            (date) => new Date(date) >= new Date(),
            "Due date cannot be in the past"
        )
});


export const updateTicketSchema = z.object({
    customerName: z
        .string()
        .min(2, "Customer name must be at least 2 characters")
        .optional(),

    customerEmail: z
        .string()
        .email("Invalid email address")
        .optional(),

    issueCategory: z.enum([
        "Technical",
        "Billing",
        "Account",
        "Other"
    ]).optional(),

    priority: z.enum([
        "Low",
        "Medium",
        "High"
    ]).optional(),

    description: z
        .string()
        .min(20, "Description must be at least 20 characters")
        .optional(),

    dueDate: z
        .string()
        .refine(
            (date) => !isNaN(Date.parse(date)),
            "Invalid due date"
        )
        .refine(
            (date) => new Date(date) >= new Date(),
            "Due date cannot be in the past"
        )
        .optional(),

    status: z.enum([
        "Open",
        "In Progress",
        "Resolved"
    ]).optional()
});

export const updateTicketStatusSchema = z.object({
    status: z.enum([
        "Open",
        "In Progress",
        "Resolved"
    ])
});
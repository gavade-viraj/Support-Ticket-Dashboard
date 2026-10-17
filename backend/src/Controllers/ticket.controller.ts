import express, { type Request, type Response } from "express";
import asyncHandlers from "../Utils/utils.js";
import { supabaseClient } from "../DB/ConnectDB.js";
import {createTicketSchema , updateTicketSchema , updateTicketStatusSchema} from  '../validations/ticket.validations.js'
import { CustomApiError } from "../Utils/utils.js";


const createTicketActivity = async ({
    ticketId,
    userId,
    action,
    description,
    oldValue = null,
    newValue = null
}: {
    ticketId: string;
    userId: string;
    action: string;
    description: string;
    oldValue?: string | null;
    newValue?: string | null;
}) => {
    const { error } = await supabaseClient
        .from("ticket_activity")
        .insert({
            ticket_id: ticketId,
            user_id: userId,
            action,
            description,
            old_value: oldValue,
            new_value: newValue
        });

    if (error) {
        console.error("Activity log failed:", error);
    }
};



const createTicket = asyncHandlers(async (req: Request, res: Response) => {
    try{
        const result = createTicketSchema.safeParse(req.body)
        const userId = (req as any).user?.data?.id;
    
    if(!result.success){
        return res.status(400).json({ message: "Validation Failed" ,errors: result.error.flatten().fieldErrors});
    }
    const {customerName , customerEmail ,  issueCategory , priority ,description,dueDate } = result.data;

    const ticketId = crypto.randomUUID()
    const status = 'Open'
    const {data:createTicket , error} = await supabaseClient.from("tickets").insert([{customer_name:customerName , customer_email : customerEmail ,  issue_category : issueCategory , priority : priority ,description :description,due_date :dueDate , status :status , id :ticketId ,created_by:userId}]).select()
    if(error) throw new CustomApiError(500,error.message);
    if(!createTicket){
        console.log(error)
        throw new CustomApiError(400,"Failed to create ticket")
    }
    await createTicketActivity({
        ticketId: ticketId,
        userId: userId,
        action: "Ticket Created",
        description: "Ticket created successfully",
    });
    return res.status(201).json({ message: "Ticket created successfully", ticket: createTicket?.[0] });   
    } catch (error:any) {
        console.log(error)
        throw new CustomApiError(error.statusCode,error.message)
    }
});


const getAllTicket = asyncHandlers(async (req: Request, res: Response) => {
    try {

        const status    = req.query.status    as string | undefined;
        const priority  = req.query.priority  as string | undefined;
        const category  = req.query.category  as string | undefined;
        const search    = req.query.search    as string | undefined;
        const sortBy    = (req.query.sortBy   as string) || 'newest';
        const page      = Math.max(1, parseInt(req.query.page  as string) || 1);
        const limit     = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
        const from      = (page - 1) * limit;
        const to        = from + limit - 1;

        let query = supabaseClient
            .from("tickets")
            .select("*", { count: "exact" });

      
        if (status   && status   !== 'All') query = query.eq("status",         status);
        if (priority && priority !== 'All') query = query.eq("priority",       priority);
        if (category && category !== 'All') query = query.eq("issue_category", category);

     
        if (search && search.trim()) {
            const q = search.trim();
            query = query.or(
                `customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`
            );
        }

        switch (sortBy) {
            case 'oldest':
                query = query.order("created_at", { ascending: true });
                break;
            case 'due_soon':
                query = query.order("due_date", { ascending: true, nullsFirst: false });
                break;
            case 'priority': {
         
                query = query.order("created_at", { ascending: false });
                break;
            }
            default: // 'newest'
                query = query.order("created_at", { ascending: false });
        }

        query = query.range(from, to);

        const { data: tickets, error, count } = await query;

        if (error) throw new CustomApiError(500, error.message);

        const total      = count ?? 0;
        const totalPages = Math.max(1, Math.ceil(total / limit));

        return res.status(200).json({
            success: true,
            count:      tickets?.length ?? 0,
            total,
            page,
            totalPages,
            data: tickets ?? [],
        });
    } catch (error: any) {
        console.log(error);
        throw new CustomApiError(error.statusCode, error.message);
    }
});

const getSingleTicket = asyncHandlers(async (req: Request, res: Response) => {
    try{
    const {id} = req.params
    const {data:ticket , error} = await supabaseClient.from("tickets").select("*").eq("id",id).maybeSingle()
    if(error) throw error;
    if(!ticket){
        return res.status(404).json({ message: "Ticket not found" });
    }
    return res.status(200).json({ success: true, ticket });
}catch(error:any){
    console.log(error)
    throw new CustomApiError(error.statusCode,error.message);
}    
});

const updateTicket = asyncHandlers(async (req: Request, res: Response) => {
    try {
        const result = updateTicketSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: "Validation Failed",
                errors: result.error.flatten().fieldErrors
            });
        }

        const userId = (req as any).user?.data?.id;
        const { id: ticketId } = req.params;
        if (!ticketId || Array.isArray(ticketId)) {
    throw new CustomApiError(400, "Invalid ticket ID");
}

        if (!userId) {
            throw new CustomApiError(401, "Unauthorized");
        }

        const {
            customerName,
            customerEmail,
            issueCategory,
            priority,
            description,
            dueDate,
            status
        } = result.data;

        const { data: existingTicket, error: findError } =
    await supabaseClient
        .from("tickets")
        .select(`
            id,
            created_by,
            customer_name,
            customer_email,
            issue_category,
            priority,
            description,
            due_date,
            status
        `)
        .eq("id", ticketId)
        .maybeSingle();

        if (findError) {
            throw new CustomApiError(500, findError.message);
        }

        if (!existingTicket) {
            throw new CustomApiError(404, "Ticket not found");
        }

        if (existingTicket.created_by !== userId) {
            throw new CustomApiError(
                403,
                "You are not authorized to update this ticket"
            );
        }

        const updatePayload: Record<string, any> = {};
        if (customerName  !== undefined) updatePayload.customer_name  = customerName;
        if (customerEmail !== undefined) updatePayload.customer_email = customerEmail;
        if (issueCategory !== undefined) updatePayload.issue_category = issueCategory;
        if (priority      !== undefined) updatePayload.priority       = priority;
        if (description   !== undefined) updatePayload.description    = description;
        if (dueDate       !== undefined) updatePayload.due_date       = dueDate;
        if (status        !== undefined) updatePayload.status         = status;

        const { data: updatedTicket, error } =
            await supabaseClient
                .from("tickets")
                .update(updatePayload)
                .eq("id", ticketId)
                .eq("created_by", userId)
                .select()
                .maybeSingle();

        if (error) {
            throw new CustomApiError(500, error.message);
        }

        if (!updatedTicket) {
            throw new CustomApiError(
                404,
                "Ticket not found or you are not authorized to update it"
            );
        }
        if(existingTicket.customer_name!=updatePayload.customer_name){
            await createTicketActivity({
            ticketId: ticketId,
            userId: userId,
            action: "Customer Name Changed",
            description: `Customer Name Changed from ${existingTicket.customer_name} to ${updatePayload.customer_name}`,
            oldValue: existingTicket.customer_name,
            newValue: updatePayload.customer_name
        });
        }
        if(existingTicket.customer_email!=updatePayload.customer_email){
            await createTicketActivity({
            ticketId: ticketId,
            userId: userId,
            action: "Customer Email Changed",
            description: `Customer Email Changed from ${existingTicket.customer_email} to ${updatePayload.customer_email}`,
            oldValue: existingTicket.customer_email,
            newValue: updatePayload.customer_email
        });
        }
        if(existingTicket.issue_category!=updatePayload.issue_category){
            await createTicketActivity({
            ticketId: ticketId,
            userId: userId,
            action: "Issue Category Changed",
            description: `Issue Category Changed from ${existingTicket.issue_category} to ${updatePayload.issue_category}`,
            oldValue: existingTicket.issue_category,
            newValue: updatePayload.issue_category
        });
        }
        if(existingTicket.priority!=updatePayload.priority){
            await createTicketActivity({
            ticketId: ticketId,
            userId: userId,
            action: "Priority Changed",
            description: `Priority Changed from ${existingTicket.priority} to ${updatePayload.priority}`,
            oldValue: existingTicket.priority,
            newValue: updatePayload.priority
        });
        }
        if(existingTicket.description!=updatePayload.description){
            await createTicketActivity({
            ticketId: ticketId,
            userId: userId,
            action: "Description Changed",
            description: `Description Changed from ${existingTicket.description} to ${updatePayload.description}`,
            oldValue: existingTicket.description,
            newValue: updatePayload.description
        });
        }
        if(existingTicket.due_date!=updatePayload.due_date){
            await createTicketActivity({
            ticketId: ticketId,
            userId: userId,
            action: "Due Date Changed",
            description: `Due Date Changed from ${existingTicket.due_date} to ${updatePayload.due_date}`,
            oldValue: existingTicket.due_date,
            newValue: updatePayload.due_date
        });
        }
        if(existingTicket.status!=updatePayload.status){
            await createTicketActivity({
            ticketId: ticketId,
            userId: userId,
            action: "Status Changed",
            description: `Status Changed from ${existingTicket.status} to ${updatePayload.status}`,
            oldValue: existingTicket.status,
            newValue: updatePayload.status
        });
        }
        return res.status(200).json({
            message: "Ticket updated successfully",
            ticket: updatedTicket
        });

    } catch (error: any) {
        console.log(error);

        if (error instanceof CustomApiError) {
            throw error;
        }

        throw new CustomApiError(
            error.statusCode || 500,
            error.message || "Something went wrong"
        );
    }
});


const updateTicketStatus = asyncHandlers(async (req: Request, res: Response) => {
    try {
        const result = updateTicketStatusSchema.safeParse(req.body);

        if (!result.success) {
            throw new CustomApiError(400, "Validation Failed");
        }

        const userId = (req as any).user?.data?.id;
        const { id: ticketId } = req.params;
        if (!ticketId || Array.isArray(ticketId)) {
            throw new CustomApiError(400, "Invalid ticket ID");
        }
        const { status } = result.data;

        if (!userId) {
            throw new CustomApiError(401, "Unauthorized");
        }

        const { data: existingTicket, error: findError } =
        await supabaseClient
        .from("tickets")
        .select("id, created_by, status")
        .eq("id", ticketId)
        .maybeSingle();

        if (findError) {
            throw new CustomApiError(500, findError.message);
        }

        if (!existingTicket) {
            throw new CustomApiError(404, "Ticket not found");
        }

        if (existingTicket.created_by !== userId) {
            throw new CustomApiError(
                403,
                "You are not authorized to update this ticket"
            );
        }

        const { data: updatedTicket, error } =
            await supabaseClient
                .from("tickets")
                .update({
                    status: status
                })
                .eq("id", ticketId)
                .eq("created_by", userId)
                .select()
                .maybeSingle();

        if (error) {
            throw new CustomApiError(500, error.message);
        }

        if (!updatedTicket) {
            throw new CustomApiError(
                404,
                "Ticket not found or you are not authorized to update it"
            );
        }
        if(existingTicket.status!=updatedTicket.status){
            await createTicketActivity({
            ticketId: ticketId,
            userId: userId,
            action: "Ticket Status Updated",
            description: `Ticket status updated to ${status}`,
            oldValue: existingTicket.status,
            newValue: updatedTicket.status
        });
    }
        return res.status(200).json({
            success: true,
            message: "Ticket status updated successfully",
            ticket: updatedTicket
        });

    } catch (error: any) {
        console.log(error);

        if (error instanceof CustomApiError) {
            throw error;
        }

        throw new CustomApiError(
            error.statusCode || 500,
            error.message || "Something went wrong"
        );
    }
});

const deleteTicket = asyncHandlers(async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.data?.id;
        const { id: ticketId } = req.params;

        if (!ticketId || Array.isArray(ticketId)) {
            throw new CustomApiError(400, "Invalid ticket ID");
        }

        if (!userId) {
            throw new CustomApiError(401, "Unauthorized");
        }

        const { data: existingTicket, error: findError } =
            await supabaseClient
                .from("tickets")
                .select("id, created_by")
                .eq("id", ticketId)
                .maybeSingle();

        if (findError) {
            throw new CustomApiError(500, findError.message);
        }

        if (!existingTicket) {
            throw new CustomApiError(404, "Ticket not found");
        }

        if (existingTicket.created_by !== userId) {
            throw new CustomApiError(
                403,
                "You are not authorized to delete this ticket"
            );
        }

        
        await createTicketActivity({
            ticketId,
            userId,
            action: "Ticket Deleted",
            description: "Ticket deleted"
        });

        const { data: deletedTicket, error } =
            await supabaseClient
                .from("tickets")
                .delete()
                .eq("id", ticketId)
                .eq("created_by", userId)
                .select()
                .maybeSingle();

        if (error) {
            throw new CustomApiError(500, error.message);
        }

        if (!deletedTicket) {
            throw new CustomApiError(
                404,
                "Ticket not found or you are not authorized to delete it"
            );
        }

        return res.status(200).json({
            success: true,
            message: "Ticket deleted successfully",
            ticket: deletedTicket
        });

    } catch (error: any) {
        console.log(error);

        if (error instanceof CustomApiError) {
            throw error;
        }

        throw new CustomApiError(
            error.statusCode || 500,
            error.message || "Something went wrong"
        );
    }
});

const getDashboard = asyncHandlers(async (req: Request, res: Response) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIso = today.toISOString();

        
        const [
            { count: total,      error: e1 },
            { count: open,       error: e2 },
            { count: inProgress, error: e3 },
            { count: resolved,   error: e4 },
            { count: highPriority, error: e5 },
            { count: overdue,    error: e6 },
        ] = await Promise.all([
            supabaseClient.from("tickets").select("*", { count: "exact", head: true }),
            supabaseClient.from("tickets").select("*", { count: "exact", head: true }).eq("status", "Open"),
            supabaseClient.from("tickets").select("*", { count: "exact", head: true }).eq("status", "In Progress"),
            supabaseClient.from("tickets").select("*", { count: "exact", head: true }).eq("status", "Resolved"),
            supabaseClient.from("tickets").select("*", { count: "exact", head: true }).eq("priority", "High"),
            supabaseClient.from("tickets").select("*", { count: "exact", head: true })
                .lt("due_date", todayIso)
                .not("status", "in", `("Resolved","Closed")`),
        ]);

        const firstError = e1 || e2 || e3 || e4 || e5 || e6;
        if (firstError) throw new CustomApiError(500, firstError.message);

        return res.status(200).json({
            success: true,
            data: {
                total:       total       ?? 0,
                open:        open        ?? 0,
                inProgress:  inProgress  ?? 0,
                resolved:    resolved    ?? 0,
                highPriority: highPriority ?? 0,
                overdue:     overdue     ?? 0,
            },
        });
    } catch (error: any) {
        console.log(error);
        throw new CustomApiError(error.statusCode || 500, error.message);
    }
});

const getTicketActivity = asyncHandlers(async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.data?.id;
        const { id: ticketId } = req.params;

        if (!ticketId) {
            throw new CustomApiError(400, "Ticket ID is required");
        }

        if (Array.isArray(ticketId)) {
            throw new CustomApiError(400, "Invalid ticket ID");
        }

        if (!userId) {
            throw new CustomApiError(401, "Unauthorized");
        }

        const { data: activity, error: activityError } =
            await supabaseClient
                .from("ticket_activity")
                .select(`
                    *,
                    users (
                        id,
                        username
                    )
                `)
                .eq("ticket_id", ticketId)
                .order("created_at", { ascending: false });

        if (activityError) {
            throw new CustomApiError(500, activityError.message);
        }

        return res.status(200).json({
            success: true,
            message: "Ticket activity fetched successfully",
            data: activity || []
        });

    } catch (error: any) {
        console.log(error);

        if (error instanceof CustomApiError) {
            throw error;
        }

        throw new CustomApiError(
            error.statusCode || 500,
            error.message || "Something went wrong"
        );
    }
});



export { createTicket, getAllTicket, getSingleTicket, updateTicket, updateTicketStatus,deleteTicket ,getDashboard,getTicketActivity};
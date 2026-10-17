import express from "express";
import { createTicket, deleteTicket, getDashboard, getAllTicket, getSingleTicket, updateTicket, updateTicketStatus , getTicketActivity} from "../Controllers/ticket.controller.js";

const TicketRouter = express.Router();
TicketRouter.get('/dashboard', getDashboard);
TicketRouter.get('/', getAllTicket);
TicketRouter.get('/:id', getSingleTicket);
TicketRouter.post('/', createTicket);
TicketRouter.get('/:id/activity', getTicketActivity);
TicketRouter.patch('/:id', updateTicket);
TicketRouter.patch('/:id/status', updateTicketStatus);
TicketRouter.delete('/:id', deleteTicket);




export default TicketRouter;
import { authAPI } from '../api/auth';
import { ticketsAPI } from '../api/tickets';

export { authAPI, ticketsAPI };
export const ticketAPI = ticketsAPI; // alias for backwards compatibility
export default { authAPI, ticketAPI, ticketsAPI };
import { getServiceDeskAPI } from './generated/client';
import type { CreateTicketRequest as WireCreateTicketRequest, UpdateTicketRequest as WireUpdateTicketRequest, ChangeStatusRequest as WireChangeStatusRequest, RateTicketRequest as WireRateTicketRequest } from './generated/models';
import { requireData, ticketPage } from './ticketContractView';
import type { Ticket, PagedTicketList, CreateTicketRequest, UpdateTicketRequest, ChangeStatusRequest, TicketStatus, TicketStatusHistory, RateTicketRequest } from '@/types/ticket';
import type { CoExecutorResponse } from '@/types/assignment';

const generated = getServiceDeskAPI();
const pageable = (page: number, size: number) => ({ page, size });
const asTicket = (value: unknown): Ticket => value as Ticket;

export const ticketApi = {
  list: async (page = 0, size = 20): Promise<PagedTicketList> => ticketPage(requireData(await generated.listTickets({ pageable: pageable(page, size) }))),
  listFiltered: async (page = 0, size = 20, status?: TicketStatus, lineId?: number, ticketId?: number, assigneeId?: number, authorId?: number, statuses?: TicketStatus[]): Promise<PagedTicketList> =>
    ticketPage(requireData(await generated.listTickets({ pageable: pageable(page, size), status, lineId, ticketId, assigneeId, authorId, statuses: statuses?.length ? statuses : undefined }))),
  /** @deprecated Prefer a paginated query or a dedicated counts endpoint. */
  listAll: async (page = 0, size = 10000): Promise<PagedTicketList> => ticketPage(requireData(await generated.listTickets({ pageable: pageable(page, size) }))),
  listByStatus: async (status: TicketStatus, page = 0, size = 20): Promise<PagedTicketList> => ticketPage(requireData(await generated.getTicketsByStatus(status, { pageable: pageable(page, size) }))),
  listMy: async (page = 0, size = 20): Promise<PagedTicketList> => ticketPage(requireData(await generated.getMyTickets({ pageable: pageable(page, size) }))),
  listAssigned: async (page = 0, size = 20, status?: TicketStatus): Promise<PagedTicketList> => ticketPage(requireData(await generated.getAssignedTickets({ pageable: pageable(page, size), statuses: status ? [status] : undefined }))),
  listByLine: async (lineId: number, page = 0, size = 20): Promise<PagedTicketList> => ticketPage(requireData(await generated.getTicketsByLine(lineId, { pageable: pageable(page, size) }))),
  get: async (id: number): Promise<Ticket> => asTicket(requireData(await generated.getTicket(id))),
  create: async (data: CreateTicketRequest): Promise<Ticket> => asTicket(requireData(await generated.createTicket(data as WireCreateTicketRequest))),
  update: async (id: number, data: UpdateTicketRequest): Promise<Ticket> => asTicket(requireData(await generated.updateTicket(id, data as WireUpdateTicketRequest))),
  changeStatus: async (id: number, data: ChangeStatusRequest): Promise<Ticket> => asTicket(requireData(await generated.changeStatus1(id, data as WireChangeStatusRequest))),
  assignToSpecialist: async (id: number, specialistId: number): Promise<Ticket> => asTicket(requireData(await generated.assignToSpecialist(id, { specialistId }))),
  assignToLine: async (id: number, lineId: number): Promise<Ticket> => asTicket(requireData(await generated.assignToLine(id, { lineId }))),
  takeTicket: async (id: number): Promise<Ticket> => asTicket(requireData(await generated.takeTicket(id))),
  delete: async (id: number): Promise<void> => { await generated.deleteTicket(id); },
  confirmClosure: async (id: number): Promise<Ticket> => asTicket(requireData(await generated.confirmClosure(id))),
  rejectClosure: async (id: number, reason?: string): Promise<Ticket> => asTicket(requireData(await generated.rejectClosure(id, reason ? { reason } : undefined))),
  getStatusHistory: async (id: number): Promise<TicketStatusHistory[]> => requireData(await generated.getStatusHistory(id)) as TicketStatusHistory[],
  getClosureRejections: async (id: number): Promise<TicketStatusHistory[]> => requireData(await generated.getClosureRejections(id)) as TicketStatusHistory[],
  rateTicket: async (id: number, request: RateTicketRequest): Promise<Ticket> => asTicket(requireData(await generated.rateTicket(id, request as WireRateTicketRequest))),
  cancelTicket: async (id: number, reason?: string): Promise<Ticket> => asTicket(requireData(await generated.cancelTicket(id, reason ? { reason } : undefined))),
  setEstimatedDate: async (id: number, estimatedCompletionDate: string): Promise<Ticket> => asTicket(requireData(await generated.setEstimatedDate(id, { estimatedCompletionDate }))),
  getCoExecutors: async (ticketId: number): Promise<CoExecutorResponse[]> => requireData(await generated.getCoExecutors(ticketId)) as CoExecutorResponse[],
  addCoExecutor: async (ticketId: number, specialistId: number): Promise<CoExecutorResponse> => requireData(await generated.addCoExecutor(ticketId, { specialistId })) as CoExecutorResponse,
  removeCoExecutor: async (ticketId: number, userId: number): Promise<void> => { await generated.removeCoExecutor(ticketId, userId); },
  setSupportCategory: async (ticketId: number, categoryId: number): Promise<Ticket> => asTicket(requireData(await generated.setSupportCategory(ticketId, { categoryId }))),
};

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { inwendoErpApiRequest, inwendoErpApiRequestList } from './GenericFunctions';

/**
 * Resources that are no plain CRUD on one endpoint: inventory loans, shifts, volunteer hours,
 * helper shifts, membership pauses, general meetings, occupancy, usage counters and notifications.
 */
export const ACTION_RESOURCES = [
	'inventoryLoan',
	'shiftPlanEntry',
	'volunteerHourEntry',
	'helperShift',
	'membershipPause',
	'generalMeeting',
	'occupancy',
	'usageCounter',
	'notification',
];

const ISO_LOCAL = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(:\d{2})?/;

/** "2026-10-11T18:00:00.000+02:00" -> "2026-10-11 18:00:00" (form fields of the ERP, local time). */
export function toErpDateTime(value: unknown): string {
	const text = String(value ?? '').trim();
	const match = ISO_LOCAL.exec(text);
	if (!match) {
		return text;
	}
	return `${match[1]} ${match[2]}${match[3] ?? ':00'}`;
}

/** "2026-10-11T18:00:00" -> "2026-10-11" (date query parameters). */
export function toErpDate(value: unknown): string {
	const text = String(value ?? '').trim();
	const match = /^\d{4}-\d{2}-\d{2}/.exec(text);
	return match ? match[0] : text;
}

/** "7, 8,,9" -> ["7", "8", "9"] */
export function idList(value: unknown): string[] {
	return String(value ?? '')
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part !== '');
}

/** Filters of a collection without empty values. */
function compact(values: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [key, value] of Object.entries(values)) {
		if (value !== '' && value !== null && value !== undefined) {
			out[key] = value;
		}
	}
	return out;
}

/**
 * Puts the service-level state of a ticket (the read-only `sla` object, ERP setting
 * customer_panel_ticket_sla_enabled) at the top level: sla_first_response_status / _due / _done_at,
 * sla_resolution_status / _due / _done_at. Tickets without SLA stay unchanged.
 */
export function flattenTicketSla(ticket: IDataObject): IDataObject {
	const sla = ticket?.sla as IDataObject | null | undefined;
	if (!sla || typeof sla !== 'object') {
		return ticket;
	}
	const out: IDataObject = { ...ticket };
	for (const kind of ['first_response', 'resolution']) {
		const part = sla[kind] as IDataObject | undefined;
		if (part && typeof part === 'object') {
			out[`sla_${kind}_status`] = part.status ?? null;
			out[`sla_${kind}_due`] = part.due ?? null;
			out[`sla_${kind}_done_at`] = part.done_at ?? null;
		}
	}
	return out;
}

/** Tickets whose first response or resolution has one of the given SLA states (none given: all). */
export function filterTicketsBySla(tickets: IDataObject[], states: string[]): IDataObject[] {
	if (!states || states.length === 0) {
		return tickets;
	}
	return tickets.filter((ticket) => {
		const flat = flattenTicketSla(ticket);
		return (
			states.includes(flat.sla_first_response_status as string) ||
			states.includes(flat.sla_resolution_status as string)
		);
	});
}

/** One item per bookable of the occupancy answer, with its `generated_at`. */
export function splitOccupancy(response: IDataObject): IDataObject[] {
	const bookables = Array.isArray(response?.bookables) ? (response.bookables as IDataObject[]) : [];
	return bookables.map((bookable) => ({ ...bookable, generated_at: response.generated_at ?? null }));
}

/** Calls a list endpoint with the item's Return All / Limit. */
async function list(this: IExecuteFunctions, i: number, endpoint: string, qs: IDataObject): Promise<any[]> {
	const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
	const limit = returnAll ? 0 : (this.getNodeParameter('limit', i, 50) as number);
	return await inwendoErpApiRequestList.call(this, endpoint, qs, returnAll, limit);
}

function requiredId(this: IExecuteFunctions, name: string, label: string, i: number): string {
	const value = String(this.getNodeParameter(name, i, '') ?? '').trim();
	if (!value) {
		throw new NodeOperationError(this.getNode(), `${label} is required`, { itemIndex: i });
	}
	return encodeURIComponent(value);
}

function unknownOperation(this: IExecuteFunctions, resource: string, operation: string, i: number): never {
	throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}" for resource "${resource}"`, {
		itemIndex: i,
	});
}

export async function executeResourceAction(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	switch (resource) {
		case 'inventoryLoan':
			return await inventoryLoan.call(this, operation, i);
		case 'shiftPlanEntry':
			return await shiftPlanEntry.call(this, operation, i);
		case 'volunteerHourEntry':
			return await volunteerHourEntry.call(this, operation, i);
		case 'helperShift':
			return await helperShift.call(this, operation, i);
		case 'membershipPause':
			return await membershipPause.call(this, operation, i);
		case 'generalMeeting':
			return await generalMeeting.call(this, operation, i);
		case 'occupancy': {
			const qs: IDataObject = {};
			const bookables = idList(this.getNodeParameter('occupancyBookables', i, ''));
			if (bookables.length > 0) {
				qs.bookable = bookables.join(',');
			}
			const response = await inwendoErpApiRequest.call(this, 'GET', '/api/event/bookable_occupancy', undefined, qs);
			return splitOccupancy(response);
		}
		case 'usageCounter':
			return await usageCounter.call(this, operation, i);
		case 'notification':
			return await notification.call(this, operation, i);
	}
	return unknownOperation.call(this, resource, operation, i);
}

/** Inventory loans (ERP setting event_inventory_enabled, scope Event Booking). */
async function inventoryLoan(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	const base = '/api/event/inventory_loan';
	switch (operation) {
		case 'getAll': {
			const filters = compact(this.getNodeParameter('filters', i, {}) as IDataObject);
			return await list.call(this, i, base, filters);
		}
		case 'get':
			return await inwendoErpApiRequest.call(this, 'GET', `${base}/${requiredId.call(this, 'inventoryLoanId', 'Inventory Loan ID', i)}`);
		case 'create': {
			const additional = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
			const body: IDataObject = { booking: Number(requiredId.call(this, 'loanBookingId', 'Booking ID', i)), ...compact(additional) };
			return await inwendoErpApiRequest.call(this, 'POST', base, body);
		}
		case 'return': {
			const id = requiredId.call(this, 'inventoryLoanId', 'Inventory Loan ID', i);
			const fields = compact(this.getNodeParameter('returnFields', i, {}) as IDataObject);
			return await inwendoErpApiRequest.call(this, 'PUT', `${base}/${id}/return`, fields);
		}
		case 'extend': {
			const id = requiredId.call(this, 'inventoryLoanId', 'Inventory Loan ID', i);
			return await inwendoErpApiRequest.call(this, 'PUT', `${base}/${id}/extend`, {
				due_at: this.getNodeParameter('extendDueAt', i) as string,
				force: this.getNodeParameter('extendForce', i, false) as boolean,
			});
		}
		case 'getStock':
			return await inwendoErpApiRequest.call(this, 'GET', '/api/event/inventory_loan_stock');
		case 'getAvailability': {
			const bookableId = requiredId.call(this, 'availabilityBookableId', 'Inventory Item (Bookable) ID', i);
			const answer = await inwendoErpApiRequest.call(this, 'GET', `/api/event/inventory_loan_availability/${bookableId}`, undefined, {
				start: this.getNodeParameter('availabilityStart', i) as string,
				end: this.getNodeParameter('availabilityEnd', i) as string,
			});
			return { bookable_id: Number(bookableId), ...answer };
		}
	}
	return unknownOperation.call(this, 'inventoryLoan', operation, i);
}

/** Shift plan (ERP settings shift_planning_enabled, shift_clocking_enabled). */
async function shiftPlanEntry(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	const base = '/api/time/shift_plan_entry';
	switch (operation) {
		case 'getOwn': {
			const filters = this.getNodeParameter('ownFilters', i, {}) as IDataObject;
			const qs: IDataObject = {};
			if (filters.startFrom) {
				qs.startDateCMP = `gte,IW_DATE_TIME_${toErpDateTime(filters.startFrom)}`;
			}
			return await list.call(this, i, `${base}/own`, qs);
		}
		case 'getAll': {
			const filters = compact(this.getNodeParameter('filters', i, {}) as IDataObject);
			for (const key of ['start_date_from', 'start_date_until']) {
				if (filters[key]) {
					filters[key] = toErpDate(filters[key]);
				}
			}
			return await list.call(this, i, base, filters);
		}
		case 'get':
			return await inwendoErpApiRequest.call(this, 'GET', `${base}/${requiredId.call(this, 'shiftPlanEntryId', 'Shift ID', i)}`);
		case 'getCoverage': {
			const options = compact(this.getNodeParameter('coverageOptions', i, {}) as IDataObject);
			return await inwendoErpApiRequest.call(this, 'GET', `${base}/coverage`, undefined, {
				...options,
				from: toErpDate(this.getNodeParameter('coverageFrom', i)),
				until: toErpDate(this.getNodeParameter('coverageUntil', i)),
			});
		}
		case 'clockIn':
		case 'clockOut': {
			const id = requiredId.call(this, 'shiftPlanEntryId', 'Shift ID', i);
			const action = operation === 'clockIn' ? 'clock_in' : 'clock_out';
			return await inwendoErpApiRequest.call(this, 'POST', `${base}/${id}/${action}`, {});
		}
	}
	return unknownOperation.call(this, 'shiftPlanEntry', operation, i);
}

/** Volunteer hours (ERP setting volunteer_hours_enabled, scope CRM). */
async function volunteerHourEntry(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	const base = '/api/time/volunteer_hour_entry';
	switch (operation) {
		case 'getAll':
			return await list.call(this, i, base, compact(this.getNodeParameter('filters', i, {}) as IDataObject));
		case 'get':
			return await inwendoErpApiRequest.call(this, 'GET', `${base}/${requiredId.call(this, 'volunteerHourEntryId', 'Entry ID', i)}`);
		case 'create': {
			const data: IDataObject = {
				person: requiredId.call(this, 'volunteerPersonId', 'Person ID', i),
				workDate: toErpDateTime(this.getNodeParameter('workDate', i)),
				durationMinutes: this.getNodeParameter('durationMinutes', i) as number,
				...compact(this.getNodeParameter('additionalFields', i, {}) as IDataObject),
			};
			return await inwendoErpApiRequest.call(this, 'POST', base, { data });
		}
		case 'approve':
			return await inwendoErpApiRequest.call(this, 'POST', `${base}/${requiredId.call(this, 'volunteerHourEntryId', 'Entry ID', i)}/approve`, {});
		case 'reject': {
			const id = requiredId.call(this, 'volunteerHourEntryId', 'Entry ID', i);
			const reason = this.getNodeParameter('reason', i, '') as string;
			return await inwendoErpApiRequest.call(this, 'POST', `${base}/${id}/reject`, reason ? { data: { reason } } : {});
		}
	}
	return unknownOperation.call(this, 'volunteerHourEntry', operation, i);
}

/** Helper shifts of the volunteer hours (ERP setting volunteer_hours_enabled, scope CRM). */
async function helperShift(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	const base = '/api/time/volunteer_shift';
	const assignments = '/api/time/volunteer_shift_assignment';
	switch (operation) {
		case 'getAll':
			return await list.call(this, i, base, compact(this.getNodeParameter('filters', i, {}) as IDataObject));
		case 'get':
			return await inwendoErpApiRequest.call(this, 'GET', `${base}/${requiredId.call(this, 'helperShiftId', 'Helper Shift ID', i)}`);
		case 'create': {
			const additional = compact(this.getNodeParameter('additionalFields', i, {}) as IDataObject);
			if (additional.signupUntil) {
				additional.signupUntil = toErpDateTime(additional.signupUntil);
			}
			const data: IDataObject = {
				name: this.getNodeParameter('name', i) as string,
				start: toErpDateTime(this.getNodeParameter('start', i)),
				end: toErpDateTime(this.getNodeParameter('end', i)),
				...additional,
			};
			return await inwendoErpApiRequest.call(this, 'POST', base, { data });
		}
		case 'assign': {
			const data: IDataObject = {
				shift: requiredId.call(this, 'helperShiftId', 'Helper Shift ID', i),
				person: requiredId.call(this, 'helperPersonId', 'Person ID', i),
			};
			const note = this.getNodeParameter('note', i, '') as string;
			if (note) {
				data.note = note;
			}
			return await inwendoErpApiRequest.call(this, 'POST', assignments, { data });
		}
		case 'getAssignments':
			return await list.call(this, i, assignments, compact(this.getNodeParameter('assignmentFilters', i, {}) as IDataObject));
		case 'setAssignmentStatus': {
			const id = requiredId.call(this, 'assignmentId', 'Assignment ID', i);
			return await inwendoErpApiRequest.call(this, 'PATCH', `${assignments}/${id}`, {
				data: { status: this.getNodeParameter('assignmentStatus', i) as string },
			});
		}
	}
	return unknownOperation.call(this, 'helperShift', operation, i);
}

/** Membership pause requests (scope CRM). */
async function membershipPause(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	const base = '/api/crm/membership_pause_request';
	switch (operation) {
		case 'getAll':
			return await list.call(this, i, base, compact(this.getNodeParameter('filters', i, {}) as IDataObject));
		case 'get':
			return await inwendoErpApiRequest.call(this, 'GET', `${base}/${requiredId.call(this, 'membershipPauseId', 'Membership Pause ID', i)}`);
		case 'decide': {
			const id = requiredId.call(this, 'membershipPauseId', 'Membership Pause ID', i);
			const qs: IDataObject = { decision: this.getNodeParameter('decision', i) as string };
			const comment = this.getNodeParameter('comment', i, '') as string;
			if (comment) {
				qs.comment = comment;
			}
			return await inwendoErpApiRequest.call(this, 'PUT', `${base}/${id}/decide`, undefined, qs);
		}
	}
	return unknownOperation.call(this, 'membershipPause', operation, i);
}

/** General meetings (ERP setting inwendo_crm_general_meeting_enabled, scope CRM). */
async function generalMeeting(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	const base = '/api/crm/general_meeting';
	const participants = '/api/crm/general_meeting_participant';
	switch (operation) {
		case 'getAll': {
			const state = this.getNodeParameter('state', i, '') as string;
			return await list.call(this, i, base, state ? { state } : {});
		}
		case 'get':
			return await inwendoErpApiRequest.call(this, 'GET', `${base}/${requiredId.call(this, 'generalMeetingId', 'General Meeting ID', i)}`);
		case 'getParticipants': {
			const qs: IDataObject = { meeting: requiredId.call(this, 'generalMeetingId', 'General Meeting ID', i) };
			const attendance = this.getNodeParameter('attendanceFilter', i, '') as string;
			if (attendance) {
				qs.attendance = attendance;
			}
			return await list.call(this, i, participants, qs);
		}
		case 'checkIn': {
			const meeting = requiredId.call(this, 'generalMeetingId', 'General Meeting ID', i);
			const person = requiredId.call(this, 'meetingPersonId', 'Person ID', i);
			const found = await inwendoErpApiRequest.call(this, 'GET', participants, undefined, { meeting, person });
			const participant = Array.isArray(found) ? found[0] : undefined;
			if (!participant?.id) {
				throw new NodeOperationError(
					this.getNode(),
					`Person ${decodeURIComponent(person)} is no participant of general meeting ${decodeURIComponent(meeting)}`,
					{ itemIndex: i },
				);
			}
			return await inwendoErpApiRequest.call(this, 'PUT', `${participants}/${participant.id}`, {
				attendance: this.getNodeParameter('attendance', i, 'ONSITE') as string,
			});
		}
	}
	return unknownOperation.call(this, 'generalMeeting', operation, i);
}

/** Usage counters (meters) of bookables (scope Maintenance). */
async function usageCounter(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	const base = '/api/event/base_bookable_usage_counter';
	switch (operation) {
		case 'getAll': {
			const bookable = String(this.getNodeParameter('usageCounterBookable', i, '') ?? '').trim();
			return await list.call(this, i, base, bookable ? { baseBookable: bookable } : {});
		}
		case 'get':
			return await inwendoErpApiRequest.call(this, 'GET', `${base}/${requiredId.call(this, 'usageCounterId', 'Usage Counter ID', i)}`);
		case 'updateValue': {
			const id = requiredId.call(this, 'usageCounterId', 'Usage Counter ID', i);
			const value = Number(this.getNodeParameter('counterValue', i));
			if (!Number.isFinite(value)) {
				throw new NodeOperationError(this.getNode(), 'Value must be a number', { itemIndex: i });
			}
			return await inwendoErpApiRequest.call(this, 'PATCH', `${base}/${id}`, { data: { counterValue: value } });
		}
	}
	return unknownOperation.call(this, 'usageCounter', operation, i);
}

/** Notifications: mass notifications (scope Notification) and the token user's own notifications. */
async function notification(this: IExecuteFunctions, operation: string, i: number): Promise<any> {
	switch (operation) {
		case 'getAll':
			return await list.call(this, i, '/api/notification/mass_notification', {});
		case 'getOwn':
			return await list.call(this, i, '/api/notification/user_notification', {});
		case 'send': {
			const ids = idList(this.getNodeParameter('recipientIds', i, ''));
			if (ids.length === 0) {
				throw new NodeOperationError(this.getNode(), 'At least one recipient ID is required', { itemIndex: i });
			}
			const channels = this.getNodeParameter('channels', i, []) as string[];
			const additional = compact(this.getNodeParameter('additionalFields', i, {}) as IDataObject);
			const data: IDataObject = {
				referenceClassName: this.getNodeParameter('recipientType', i, 'person') as string,
				referenceIds: ids.map((id) => (/^\d+$/.test(id) ? Number(id) : id)),
				text: this.getNodeParameter('text', i) as string,
				longText: this.getNodeParameter('longText', i, '') as string,
				sendPush: channels.includes('sendPush'),
				sendMail: channels.includes('sendMail'),
				sendLetter: channels.includes('sendLetter'),
				sendSms: channels.includes('sendSms'),
				sendWhatsapp: channels.includes('sendWhatsapp'),
				...additional,
			};
			return await inwendoErpApiRequest.call(this, 'POST', '/api/notification/mass_notification', { data });
		}
	}
	return unknownOperation.call(this, 'notification', operation, i);
}

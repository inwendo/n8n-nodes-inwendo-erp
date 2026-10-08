import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Signed lock commands of the ERP (same protocol as the Node-RED lock bridge and Home Assistant):
 * header X-IW-Signature = hex HMAC-SHA256 of the raw JSON body with the instance secret; the body
 * carries type "iw_lock_command", instance_id, lock_id, smart_lock_id, command, ts and nonce.
 */
export const COMMAND_TYPE = 'iw_lock_command';
/** Age of a command (a door must not open long after the user tapped "open"), plus clock difference. */
export const MAX_AGE_SECONDS = 60;
export const CLOCK_SKEW_SECONDS = 30;
export const LOCK_ID_PATTERN = /^[A-Za-z0-9_.:-]{1,190}$/;

export interface LockCommand {
	type: string;
	instance_id: string;
	lock_id: string;
	smart_lock_id?: number;
	command: string;
	ts: number;
	nonce: string;
}

export function sign(body: string, secret: string): string {
	return createHmac('sha256', secret).update(body).digest('hex');
}

export function randomInstanceId(): string {
	return `n8n-${randomBytes(12).toString('hex')}`;
}

export function randomSecret(): string {
	return randomBytes(32).toString('hex');
}

/** Nonces of the last minutes, per process: a recorded command cannot be replayed. */
const seenNonces = new Map<string, number>();

export function useNonce(nonce: string, now = Date.now()): boolean {
	for (const [key, expires] of seenNonces) {
		if (expires <= now) {
			seenNonces.delete(key);
		}
	}
	if (seenNonces.has(nonce)) {
		return false;
	}
	seenNonces.set(nonce, now + (MAX_AGE_SECONDS + CLOCK_SKEW_SECONDS) * 2000);
	return true;
}

export type VerifyResult = { ok: true; command: LockCommand } | { ok: false; status: number; error: string };

export function verifyCommand(rawBody: string, signature: unknown, secret: string, instanceId: string, now = Date.now()): VerifyResult {
	if (typeof signature !== 'string' || !/^[0-9a-f]{64}$/i.test(signature) || !secret) {
		return { ok: false, status: 401, error: 'invalid signature' };
	}
	const expected = Buffer.from(sign(rawBody, secret), 'hex');
	if (!timingSafeEqual(expected, Buffer.from(signature.toLowerCase(), 'hex'))) {
		return { ok: false, status: 401, error: 'invalid signature' };
	}
	let command: LockCommand;
	try {
		command = JSON.parse(rawBody);
	} catch {
		return { ok: false, status: 400, error: 'invalid JSON body' };
	}
	if (!command || command.type !== COMMAND_TYPE || command.instance_id !== instanceId) {
		return { ok: false, status: 400, error: 'not a lock command of this trigger' };
	}
	const age = now / 1000 - command.ts;
	if (typeof command.ts !== 'number' || age > MAX_AGE_SECONDS + CLOCK_SKEW_SECONDS || age < -CLOCK_SKEW_SECONDS) {
		return { ok: false, status: 400, error: 'command expired' };
	}
	if (typeof command.nonce !== 'string' || command.nonce === '' || !useNonce(command.nonce, now)) {
		return { ok: false, status: 400, error: 'command replayed' };
	}
	return { ok: true, command };
}

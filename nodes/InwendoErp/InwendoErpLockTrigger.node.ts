import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { inwendoErpApiRequest } from './GenericFunctions';
import { LOCK_ID_PATTERN, randomInstanceId, randomSecret, verifyCommand } from './LockProtocol';

interface LockDefinition {
	id: string;
	name?: string;
	unlockMethod?: string;
}

/**
 * Locks of an n8n workflow as ERP smart locks. On activation the trigger registers its locks with its
 * webhook URL (/api/n8n/smart_lock/register); an administrator syncs them once in the ERP, then a user
 * with access who taps "open" in the app makes the ERP post a signed command here and the workflow
 * switches the door. Instance id and secret live in the workflow's static data.
 */
export class InwendoErpLockTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'vynst (inwendo ERP) Lock Trigger',
		name: 'inwendoErpLockTrigger',
		icon: { light: 'file:../../icons/vynst.svg', dark: 'file:../../icons/vynst.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{"locks: " + ($parameter["locks"]?.lock?.length ?? 0)}}',
		description: 'Starts the workflow when vynst (vynst (inwendo ERP)) opens or locks one of the locks this workflow offers',
		defaults: {
			name: 'vynst (inwendo ERP) Lock Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'inwendoErpApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: '={{$parameter["confirm"] === "lastNode" ? "lastNode" : "onReceived"}}',
				responseData: 'firstEntryJson',
				path: 'inwendo-erp-lock',
			},
		],
		properties: [
			{
				displayName:
					'The API token needs Scope <b>Event</b> with <b>Write</b> access. After the first activation open the smart ' +
					'lock connection (provider n8n) in the ERP and run <b>Sync devices</b>; then grant the access to the smart ' +
					'locks as usual. The ERP only calls the production webhook URL, which must be reachable via https.',
				name: 'lockNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Connection Name',
				name: 'connectionName',
				type: 'string',
				default: 'n8n',
				description: 'Name of the smart lock connection in the ERP',
			},
			{
				displayName: 'Locks',
				name: 'locks',
				type: 'fixedCollection',
				placeholder: 'Add Lock',
				typeOptions: { multipleValues: true },
				default: {},
				options: [
					{
						name: 'lock',
						displayName: 'Lock',
						values: [
							{
								displayName: 'Lock ID',
								name: 'id',
								type: 'string',
								default: '',
								placeholder: 'front_door',
								description: 'Unique within this trigger (letters, digits, _ . : -); links the lock to its ERP smart lock.',
							},
							{
								displayName: 'Name in ERP',
								name: 'name',
								type: 'string',
								default: '',
								placeholder: 'Haupteingang',
							},
							{
								displayName: 'In the App',
								name: 'unlockMethod',
								type: 'options',
								default: 'remote',
								options: [
									{ name: 'Open Button (ERP Sends "Open")', value: 'remote' },
									{ name: 'QR Code (a Scanner at the Door Checks It)', value: 'qr_code' },
								],
							},
						],
					},
				],
			},
			{
				displayName: 'Result',
				name: 'confirm',
				type: 'options',
				default: 'onReceived',
				options: [
					{
						name: 'Answer With the Last Node',
						value: 'lastNode',
						description: 'The first item of the last node must contain "success" (true / false), optionally "state"',
					},
					{
						name: 'Report Success When the Command Arrives',
						value: 'onReceived',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				// always register again: the registration is idempotent and updates locks and URL
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				if (this.getMode() === 'manual') {
					// the ERP keeps sending to the production URL; a test registration would only replace it
					return true;
				}
				const locks = lockDefinitions(this.getNodeParameter('locks', {}) as IDataObject);
				for (const lock of locks) {
					if (!LOCK_ID_PATTERN.test(lock.id)) {
						throw new NodeOperationError(this.getNode(), `Invalid lock ID "${lock.id}" (letters, digits, _ . : -)`);
					}
				}
				if (new Set(locks.map((lock) => lock.id)).size !== locks.length) {
					throw new NodeOperationError(this.getNode(), 'Every lock needs its own lock ID');
				}

				const staticData = this.getWorkflowStaticData('node');
				if (!staticData.instanceId || !staticData.secret) {
					staticData.instanceId = randomInstanceId();
					staticData.secret = randomSecret();
				}
				const response = await inwendoErpApiRequest.call(this, 'POST', '/api/n8n/smart_lock/register', {
					instance_id: staticData.instanceId as string,
					secret: staticData.secret as string,
					name: this.getNodeParameter('connectionName', 'n8n') as string,
					delivery: 'push',
					webhook_url: this.getNodeWebhookUrl('default') as string,
					locks: locks.map((lock) => ({
						id: lock.id,
						name: lock.name || lock.id,
						unlock_method: lock.unlockMethod === 'qr_code' ? 'qr_code' : 'remote',
					})),
				});
				staticData.connectionId = (response as IDataObject | undefined)?.connection_id;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node');
				if (!staticData.instanceId || !staticData.secret || this.getMode() === 'manual') {
					return true;
				}
				try {
					// instance id and secret stay: activating again restores the connection and its smart locks
					await inwendoErpApiRequest.call(this, 'DELETE', '/api/n8n/smart_lock/register', {
						instance_id: staticData.instanceId as string,
						secret: staticData.secret as string,
					});
				} catch (error) {
					// do not block the deactivation
					this.logger.warn(
						`vynst (inwendo ERP) Lock Trigger: unregistering the locks failed: ${(error as Error).message}`,
					);
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const res = this.getResponseObject();
		const staticData = this.getWorkflowStaticData('node');
		const rawBody = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : JSON.stringify(this.getBodyData());
		const checked = verifyCommand(
			rawBody,
			this.getHeaderData()['x-iw-signature'],
			(staticData.secret as string) || '',
			(staticData.instanceId as string) || '',
		);
		if (!checked.ok) {
			res.status(checked.status).json({ success: false, error: checked.error });
			return { noWebhookResponse: true };
		}

		const command = checked.command;
		const lock = lockDefinitions(this.getNodeParameter('locks', {}) as IDataObject).find((entry) => entry.id === command.lock_id);
		if (!lock) {
			res.status(200).json({ success: false, error: `unknown lock ${command.lock_id}` });
			return { noWebhookResponse: true };
		}

		return {
			webhookResponse: { success: true },
			workflowData: [
				this.helpers.returnJsonArray({
					command: command.command,
					lock_id: command.lock_id,
					lock_name: lock.name || lock.id,
					smart_lock_id: command.smart_lock_id,
					received: new Date().toISOString(),
				}),
			],
		};
	}
}

function lockDefinitions(parameter: IDataObject): LockDefinition[] {
	const locks = (parameter?.lock as LockDefinition[] | undefined) ?? [];
	return locks
		.map((lock) => ({ ...lock, id: String(lock.id ?? '').trim() }))
		.filter((lock) => lock.id !== '');
}

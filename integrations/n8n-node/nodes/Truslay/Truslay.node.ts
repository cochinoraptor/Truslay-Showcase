import {
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import { TruslayUniversalClient, type ActionVerdict } from '@truslay/sdk';

type Environment = 'sandbox' | 'live';
type OnBlockAction = 'stopWorkflow' | 'outputErrorItem' | 'continueWithWarning';

/**
 * Truslay node: asks the firewall for a verdict before the workflow performs
 * the action represented by each incoming item.
 *
 * The SDK is consumed as an external dependency (`@truslay/sdk@2.1.0`); the
 * constructor signature is the v2.1.0 one, with the operator type as the
 * SECOND POSITIONAL ARGUMENT. An `operatorType` key inside the config object is
 * silently ignored by the SDK, so the behavioural and scraping guards for
 * `agent` would never be applied.
 */
export class Truslay implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Truslay',
		name: 'truslay',
		icon: 'fa:shield-halved',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["intent"]}}',
		description:
			'Evaluate an action against the Truslay firewall and stop, error or flag the item when the verdict is BLOCK',
		defaults: {
			name: 'Truslay',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'truslayApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Evaluate Action',
						value: 'evaluateAction',
					},
				],
				default: 'evaluateAction',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['evaluateAction'],
					},
				},
				options: [
					{
						name: 'Check Security',
						value: 'checkSecurity',
						description: 'Ask the firewall whether this action may run',
						action: 'Check the security of an action',
					},
				],
				default: 'checkSecurity',
			},
			{
				displayName: 'Intent',
				name: 'intent',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['evaluateAction'],
						operation: ['checkSecurity'],
					},
				},
				options: [
					{
						name: 'Webhook Incoming',
						value: 'webhook_incoming',
						description: 'Inbound webhook or API event',
					},
					{
						name: 'Scraping Request',
						value: 'scraping_request',
						description: 'Automated read of an external site',
					},
					{
						name: 'Database Write',
						value: 'database_write',
						description: 'Insert, update or delete a record',
					},
					{
						name: 'Checkout',
						value: 'checkout',
						description: 'Place an order or take a payment',
					},
					{
						name: 'Agent Navigation',
						value: 'agent_navigation',
						description: 'An autonomous agent moving through a page or flow',
					},
				],
				default: 'webhook_incoming',
				description: 'What the workflow is about to do, as seen by the firewall',
			},
			{
				displayName: 'Shield',
				name: 'shield',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['evaluateAction'],
						operation: ['checkSecurity'],
					},
				},
				options: [
					{
						name: 'E-Commerce',
						value: 'e-commerce',
						description: 'Cart, pricing and checkout policies',
					},
					{
						name: 'Finance',
						value: 'finance',
						description: 'Payments, transfers and ledger policies',
					},
					{
						name: 'CRM',
						value: 'crm',
						description: 'Customer data and record policies',
					},
					{
						name: 'Automation',
						value: 'automation',
						description: 'Internal jobs and workflow policies',
					},
					{
						name: 'None',
						value: 'none',
						description: 'No shield: the firewall applies the account default',
					},
				],
				default: 'e-commerce',
				description: 'Shield that evaluates this action (sent as x-shield-id)',
			},
			{
				displayName: 'On Block Action',
				name: 'onBlock',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['evaluateAction'],
						operation: ['checkSecurity'],
					},
				},
				options: [
					{
						name: 'Stop Workflow',
						value: 'stopWorkflow',
						description: 'Fail the node: the workflow stops and nothing downstream runs',
					},
					{
						name: 'Output Error Item',
						value: 'outputErrorItem',
						description:
							'Emit the item with the BLOCK verdict and an `error` field so an IF node can route it',
					},
					{
						name: 'Continue with Warning',
						value: 'continueWithWarning',
						description:
							'Emit the item with the BLOCK verdict and a `truslay_warning` field, and keep the workflow running',
					},
				],
				default: 'stopWorkflow',
				description: 'What to do when the firewall returns BLOCK or any verdict other than ALLOW',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('truslayApi');
		const environment = ((credentials.environment as Environment | undefined) ?? 'sandbox');
		const apiKey = ((credentials.apiKey as string | undefined) ?? '').trim();
		const firewallUrl = ((credentials.firewallUrl as string | undefined) ?? '').trim();

		if (environment === 'live' && (apiKey === '' || firewallUrl === '')) {
			throw new NodeOperationError(
				this.getNode(),
				'Live mode requires both an API Key and a Firewall URL',
				{
					description:
						'Open the Truslay API credentials and fill in both fields, or switch the environment back to Sandbox.',
				},
			);
		}

		// v2.1.0 signature: config first, operatorType as the SECOND POSITIONAL ARGUMENT.
		const truslay = new TruslayUniversalClient(
			{
				mode: 'collaboration',
				firewallMode: environment,
				...(apiKey !== '' ? { apiKey } : {}),
				...(firewallUrl !== '' ? { firewallUrl } : {}),
			},
			'agent',
		);

		for (let i = 0; i < items.length; i++) {
			try {
				const intent = this.getNodeParameter('intent', i) as string;
				const shield = this.getNodeParameter('shield', i) as string;
				const onBlock = this.getNodeParameter('onBlock', i) as OnBlockAction;
				const shieldId = shield === 'none' ? undefined : shield;

				const verdict: ActionVerdict = await truslay.evaluateAction(
					{
						intent,
						payload: items[i].json,
					},
					shieldId === undefined ? undefined : { shieldId },
				);

				const audited: IDataObject = {
					...items[i].json,
					truslay_verdict: verdict.verdict,
					truslay_reason:
						verdict.reason ?? (verdict.verdict === 'ALLOW' ? 'allowed' : 'blocked'),
					truslay_environment: environment,
					truslay_shield: shield,
				};

				if (verdict.latencyMs !== undefined) {
					audited.truslay_latency_ms = verdict.latencyMs;
				}
				if (verdict.auditId !== undefined) {
					audited.truslay_audit_id = verdict.auditId;
				}

				// Anything other than ALLOW is treated as blocked: the SDK has no
				// approval channel, so REVIEW must not let the action through.
				if (verdict.verdict === 'ALLOW') {
					returnData.push({ json: audited, pairedItem: { item: i } });
					continue;
				}

				const message = `Truslay blocked '${intent}'${verdict.reason ? ` (${verdict.reason})` : ''}`;

				if (onBlock === 'stopWorkflow') {
					throw new NodeOperationError(this.getNode(), message, {
						itemIndex: i,
						description:
							'On Block Action is set to Stop Workflow. Switch to Output Error Item or Continue with Warning to keep the run alive.',
					});
				}

				if (onBlock === 'outputErrorItem') {
					returnData.push({
						json: { ...audited, error: message },
						pairedItem: { item: i },
					});
					continue;
				}

				const warning = `${message} — item forwarded because On Block Action is Continue with Warning`;
				this.logger.warn(warning);
				returnData.push({
					json: { ...audited, truslay_warning: warning },
					pairedItem: { item: i },
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							...items[i].json,
							error: error instanceof Error ? error.message : String(error),
						},
						pairedItem: { item: i },
					});
					continue;
				}

				if (error instanceof NodeOperationError) {
					throw error;
				}

				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

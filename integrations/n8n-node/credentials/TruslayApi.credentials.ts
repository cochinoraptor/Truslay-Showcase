import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class TruslayApi implements ICredentialType {
	name = 'truslayApi';

	displayName = 'Truslay API';

	documentationUrl =
		'https://github.com/cochinoraptor/Truslay-Showcase/tree/main/integrations/n8n-node#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Sandbox',
					value: 'sandbox',
					description:
						'Local audits only: no network call, every action is allowed and logged as sandbox_mode',
				},
				{
					name: 'Live',
					value: 'live',
					description:
						'Enforced by the firewall, fail-closed: if the endpoint cannot decide, the action is blocked',
				},
			],
			default: 'sandbox',
			description: 'Where Truslay evaluates your actions',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Truslay API key. Required in live mode, ignored in sandbox.',
		},
		{
			displayName: 'Firewall URL',
			name: 'firewallUrl',
			type: 'string',
			default: '',
			placeholder: 'https://firewall.example.com',
			displayOptions: {
				show: {
					environment: ['live'],
				},
			},
			description:
				'Base URL of your Truslay firewall. Required in live mode; the node calls POST {Firewall URL}/api/guardian/evaluate.',
		},
	];
}

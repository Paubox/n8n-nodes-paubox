import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PauboxApi implements ICredentialType {
	name = 'pauboxApi';
	displayName = 'Paubox API';
	// eslint-disable-next-line n8n-nodes-base/cred-class-field-documentation-url-miscased
	documentationUrl = 'https://www.paubox.com/solutions/email-api';
	properties: INodeProperties[] = [
		{
			displayName: 'API Username',
			name: 'apiUsername',
			type: 'string',
			default: '',
			required: true,
			description: 'Your Paubox Email API endpoint username',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Paubox Email API key',
		},
	];

	// Custom authentication to handle the "Token token=" prefix format
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Token token={{$credentials.apiKey}}',
			},
		},
	};

	// Note: Credential testing is optional. If the credentials are wrong,
	// users will get an error when they try to use the node.
	// Uncomment below to enable testing (requires valid test endpoint)
	/*
	test: ICredentialTestRequest = {
		request: {
			baseURL: '=https://api.paubox.net/v1/{{$credentials.apiUsername}}',
			url: '/message_receipt',
			method: 'GET',
			qs: {
				sourceTrackingId: 'test-credential-validation',
			},
			skipSslCertificateValidation: false,
		},
		rules: [
			{
				type: 'responseCode',
				properties: {
					value: 404,
					message: 'Credentials are valid (API responded with expected 404 for test ID)',
				},
			},
		],
	};
	*/
}


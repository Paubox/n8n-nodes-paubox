import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
} from 'n8n-workflow';

export class Paubox implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Paubox',
		name: 'paubox',
		icon: 'file:paubox-logo.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send HIPAA-compliant email via Paubox Email API',
		defaults: {
			name: 'Paubox',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'pauboxApi',
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
						name: 'Message',
						value: 'message',
					},
				],
				default: 'message',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Send an email message',
						action: 'Send a message',
					},
					{
						name: 'Get Disposition',
						value: 'getDisposition',
						description: 'Get email delivery status and tracking information',
						action: 'Get message disposition',
					},
				],
				default: 'send',
			},

			// Send Message Fields
			{
				displayName: 'From',
				name: 'from',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				default: '',
				placeholder: 'sender@yourdomain.com',
				description: 'Sender email address (must match your verified domain)',
			},
			{
				displayName: 'To',
				name: 'to',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				default: '',
				placeholder: 'recipient@example.com',
				description: 'Recipient email address(es). Separate multiple with commas.',
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				default: '',
				description: 'Email subject line',
			},
			{
				displayName: 'Content Type',
				name: 'contentType',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				options: [
					{
						name: 'Text',
						value: 'text',
					},
					{
						name: 'HTML',
						value: 'html',
					},
					{
						name: 'Both',
						value: 'both',
					},
				],
				default: 'html',
				description: 'Type of email content to send',
			},
			{
				displayName: 'Text Content',
				name: 'textContent',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
						contentType: ['text', 'both'],
					},
				},
				default: '',
				description: 'Plain text content of the email',
			},
			{
				displayName: 'HTML Content',
				name: 'htmlContent',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
						contentType: ['html', 'both'],
					},
				},
				default: '',
				description: 'HTML content of the email',
			},

			// Additional Options
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
				options: [
					{
						displayName: 'CC',
						name: 'cc',
						type: 'string',
						default: '',
						placeholder: 'cc@example.com',
						description: 'CC email address(es). Separate multiple with commas.',
					},
					{
						displayName: 'BCC',
						name: 'bcc',
						type: 'string',
						default: '',
						placeholder: 'bcc@example.com',
						description: 'BCC email address(es). Separate multiple with commas.',
					},
					{
						displayName: 'Reply To',
						name: 'replyTo',
						type: 'string',
						default: '',
						placeholder: 'reply@yourdomain.com',
						description: 'Reply-to email address',
					},
					{
						displayName: 'Allow Non-TLS',
						name: 'allowNonTLS',
						type: 'boolean',
						default: false,
						description: 'Whether to allow delivery over non-TLS connection (not HIPAA-compliant if message contains PHI)',
					},
					{
						displayName: 'Force Secure Notification',
						name: 'forceSecureNotification',
						type: 'boolean',
						default: false,
						description: 'Whether to force delivery as a Paubox Secure Message with pickup notification',
					},
					{
						displayName: 'Override Open Tracking',
						name: 'overrideOpenTracking',
						type: 'boolean',
						default: false,
						description: 'Whether to enable open tracking for this message',
					},
					{
						displayName: 'Override Link Tracking',
						name: 'overrideLinkTracking',
						type: 'boolean',
						default: false,
						description: 'Whether to enable click tracking for this message (up to 1000 links)',
					},
					{
						displayName: 'Unsubscribe URL',
						name: 'unsubscribeUrl',
						type: 'string',
						default: '',
						placeholder: 'https://yourdomain.com/unsubscribe',
						description: 'URL to redirect unsubscribe requests',
					},
					{
						displayName: 'List-Unsubscribe Header',
						name: 'listUnsubscribe',
						type: 'string',
						default: '',
						placeholder: '<mailto:unsubscribe@yourdomain.com?subject=unsubscribe>',
						description: 'List-Unsubscribe header value (mailto and/or http)',
					},
					{
						displayName: 'Attachments',
						name: 'attachments',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						description: 'Email attachments',
						options: [
							{
								name: 'attachment',
								displayName: 'Attachment',
								values: [
									{
										displayName: 'File Name',
										name: 'fileName',
										type: 'string',
										default: '',
										placeholder: 'document.pdf',
										description: 'Name of the attached file',
									},
									{
										displayName: 'Content Type',
										name: 'contentType',
										type: 'string',
										default: '',
										placeholder: 'application/pdf',
										description: 'MIME type of the attachment',
									},
									{
										displayName: 'Content (Base64)',
										name: 'content',
										type: 'string',
										typeOptions: {
											rows: 4,
										},
										default: '',
										description: 'Base64-encoded file content',
									},
								],
							},
						],
					},
					{
						displayName: 'Custom Headers',
						name: 'customHeaders',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						description: 'Custom email headers (must start with X-)',
						options: [
							{
								name: 'header',
								displayName: 'Header',
								values: [
									{
										displayName: 'Name',
										name: 'name',
										type: 'string',
										default: '',
										placeholder: 'X-Custom-Header',
										description: 'Header name (must start with X-)',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Header value',
									},
								],
							},
						],
					},
				],
			},

			// Get Disposition Fields
			{
				displayName: 'Source Tracking ID',
				name: 'sourceTrackingId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['getDisposition'],
					},
				},
				default: '',
				placeholder: '6e1cf9a4-7bde-4834-8200-ed424b50c8a7',
				description: 'The tracking ID returned when the message was sent',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		const credentials = await this.getCredentials('pauboxApi');
		const apiUsername = credentials.apiUsername as string;
		const apiKey = credentials.apiKey as string;

		const baseUrl = `https://api.paubox.net/v1/${apiUsername}`;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'message') {
					if (operation === 'send') {
						// Get required fields
						const from = this.getNodeParameter('from', i) as string;
						const to = this.getNodeParameter('to', i) as string;
						const subject = this.getNodeParameter('subject', i) as string;
						const contentType = this.getNodeParameter('contentType', i) as string;

						// Parse recipients
						const recipients = to.split(',').map((email) => email.trim());

						// Get content based on type
						const content: IDataObject = {};
						if (contentType === 'text' || contentType === 'both') {
							content['text/plain'] = this.getNodeParameter('textContent', i) as string;
						}
						if (contentType === 'html' || contentType === 'both') {
							content['text/html'] = this.getNodeParameter('htmlContent', i) as string;
						}

						// Validate content
						if (Object.keys(content).length === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'Either text or HTML content must be provided',
								{ itemIndex: i },
							);
						}

						// Build message headers
						const headers: IDataObject = {
							subject,
							from,
						};

						// Get additional fields
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						// Add optional headers
						if (additionalFields.replyTo) {
							headers['reply-to'] = additionalFields.replyTo;
						}
						if (additionalFields.listUnsubscribe) {
							headers['List-Unsubscribe'] = additionalFields.listUnsubscribe;
						}

						// Add custom headers
						if (additionalFields.customHeaders) {
							const customHeadersData = additionalFields.customHeaders as IDataObject;
							const headerArray = customHeadersData.header as IDataObject[];
							if (headerArray && headerArray.length > 0) {
								for (const header of headerArray) {
									if (header.name && header.value) {
										headers[header.name as string] = header.value;
									}
								}
							}
						}

						// Build message object
						const message: IDataObject = {
							recipients,
							headers,
							content,
						};

						// Add CC
						if (additionalFields.cc) {
							message.cc = (additionalFields.cc as string)
								.split(',')
								.map((email) => email.trim());
						}

						// Add BCC
						if (additionalFields.bcc) {
							message.bcc = (additionalFields.bcc as string)
								.split(',')
								.map((email) => email.trim());
						}

						// Add boolean flags
						if (additionalFields.allowNonTLS !== undefined) {
							message.allowNonTLS = additionalFields.allowNonTLS;
						}
						if (additionalFields.forceSecureNotification !== undefined) {
							message.forceSecureNotification = additionalFields.forceSecureNotification;
						}

						// Add attachments
						if (additionalFields.attachments) {
							const attachmentsData = additionalFields.attachments as IDataObject;
							const attachmentArray = attachmentsData.attachment as IDataObject[];
							if (attachmentArray && attachmentArray.length > 0) {
								message.attachments = attachmentArray.map((att) => ({
									fileName: att.fileName,
									contentType: att.contentType,
									content: att.content,
								}));
							}
						}

						// Build request body
						const body: IDataObject = {
							data: {
								message,
							},
						};

						// Add tracking overrides at data level
						if (additionalFields.overrideOpenTracking !== undefined) {
							(body.data as IDataObject).override_open_tracking = additionalFields.overrideOpenTracking;
						}
						if (additionalFields.overrideLinkTracking !== undefined) {
							(body.data as IDataObject).override_link_tracking = additionalFields.overrideLinkTracking;
						}
						if (additionalFields.unsubscribeUrl) {
							(body.data as IDataObject).unsubscribe_url = additionalFields.unsubscribeUrl;
						}

						// Make API request
						const response = await this.helpers.request({
							method: 'POST',
							url: `${baseUrl}/messages`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
								'Content-Type': 'application/json',
							},
							body,
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'getDisposition') {
						// Get tracking ID
						const sourceTrackingId = this.getNodeParameter('sourceTrackingId', i) as string;

						// Make API request
						const response = await this.helpers.request({
							method: 'GET',
							url: `${baseUrl}/message_receipt`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							qs: {
								sourceTrackingId,
							},
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					returnData.push({
						json: {
							error: errorMessage,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}


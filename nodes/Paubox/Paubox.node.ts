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
		icon: 'file:paubox.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send and receive HIPAA-compliant email via Paubox Email API',
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
						name: 'Mailbox',
						value: 'mailbox',
					},
					{
						name: 'Message',
						value: 'message',
					},
					{
						name: 'Received Email',
						value: 'receivedEmail',
					},
					{
						name: 'Receiving Domain',
						value: 'receivingDomain',
					},
					{
						name: 'Webhook Endpoint',
						value: 'webhookEndpoint',
					},
				],
				default: 'message',
			},

			// Message Operations
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
						name: 'Get Disposition',
						value: 'getDisposition',
						description: 'Get email delivery status and tracking information',
						action: 'Get message disposition',
					},
					{
						name: 'Send',
						value: 'send',
						description: 'Send an email message',
						action: 'Send a message',
					},
				],
				default: 'send',
			},

			// Mailbox Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['mailbox'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a mailbox on a receiving domain',
						action: 'Create a mailbox',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a mailbox',
						action: 'Delete a mailbox',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a mailbox',
						action: 'Get a mailbox',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List mailboxes on a receiving domain',
						action: 'List mailboxes',
					},
				],
				default: 'list',
			},

			// Received Email Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['receivedEmail'],
					},
				},
				options: [
					{
						name: 'Download Attachment',
						value: 'downloadAttachment',
						description: 'Download an email attachment',
						action: 'Download an attachment',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a received email',
						action: 'Get a received email',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List received emails',
						action: 'List received emails',
					},
				],
				default: 'list',
			},

			// Receiving Domain Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['receivingDomain'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a receiving domain',
						action: 'Create a receiving domain',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a receiving domain',
						action: 'Delete a receiving domain',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a receiving domain',
						action: 'Get a receiving domain',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List receiving domains',
						action: 'List receiving domains',
					},
				],
				default: 'list',
			},

			// Webhook Endpoint Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['webhookEndpoint'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a webhook endpoint',
						action: 'Create a webhook endpoint',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a webhook endpoint',
						action: 'Delete a webhook endpoint',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a webhook endpoint',
						action: 'Get a webhook endpoint',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List webhook endpoints',
						action: 'List webhook endpoints',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a webhook endpoint',
						action: 'Update a webhook endpoint',
					},
				],
				default: 'list',
			},

			// -----------------------------------------------
			// Message Fields
			// -----------------------------------------------
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
					displayName: 'Allow Non-TLS',
					name: 'allowNonTLS',
					type: 'boolean',
					default: false,
					description: 'Whether to allow delivery over non-TLS connection (not HIPAA-compliant if message contains PHI)',
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
					displayName: 'BCC',
					name: 'bcc',
					type: 'string',
					default: '',
					placeholder: 'bcc@example.com',
					description: 'BCC email address(es). Separate multiple with commas.',
				},
				{
					displayName: 'CC',
					name: 'cc',
					type: 'string',
					default: '',
					placeholder: 'cc@example.com',
					description: 'CC email address(es). Separate multiple with commas.',
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
				{
					displayName: 'Force Secure Notification',
					name: 'forceSecureNotification',
					type: 'boolean',
					default: false,
					description: 'Whether to force delivery as a Paubox Secure Message with pickup notification',
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
					displayName: 'Override Link Tracking',
					name: 'overrideLinkTracking',
					type: 'boolean',
					default: false,
					description: 'Whether to enable click tracking for this message (up to 1000 links)',
				},
				{
					displayName: 'Override Open Tracking',
					name: 'overrideOpenTracking',
					type: 'boolean',
					default: false,
					description: 'Whether to enable open tracking for this message',
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
					displayName: 'Unsubscribe URL',
					name: 'unsubscribeUrl',
					type: 'string',
					default: '',
					placeholder: 'https://yourdomain.com/unsubscribe',
					description: 'URL to redirect unsubscribe requests',
				},
			],
			},
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

			// -----------------------------------------------
			// Receiving Domain Fields
			// -----------------------------------------------
			{
				displayName: 'Domain ID',
				name: 'domainId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['receivingDomain'],
						operation: ['get', 'delete'],
					},
				},
				default: '',
				description: 'ID of the receiving domain',
			},
			{
				displayName: 'Slug',
				name: 'slug',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['receivingDomain'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'Domain slug',
			},

			// -----------------------------------------------
			// Mailbox Fields
			// -----------------------------------------------
			{
				displayName: 'Domain ID',
				name: 'domainId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['mailbox'],
					},
				},
				default: '',
				description: 'ID of the receiving domain that owns this mailbox',
			},
			{
				displayName: 'Mailbox ID',
				name: 'mailboxId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['mailbox'],
						operation: ['get', 'delete'],
					},
				},
				default: '',
				description: 'ID of the mailbox',
			},
			{
				displayName: 'Name',
				name: 'mailboxName',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['mailbox'],
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'user',
				description: 'Mailbox name (local part of the email address)',
			},
			{
				displayName: 'Password',
				name: 'mailboxPassword',
				type: 'string',
				typeOptions: {
					password: true,
				},
				required: true,
				displayOptions: {
					show: {
						resource: ['mailbox'],
						operation: ['create'],
					},
				},
				default: '',
				description: 'Mailbox password',
			},
			{
				displayName: 'Quota Bytes',
				name: 'quotaBytes',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['mailbox'],
						operation: ['create'],
					},
				},
				default: 0,
				description: 'Mailbox storage quota in bytes (0 for unlimited)',
			},

			// -----------------------------------------------
			// Received Email Fields
			// -----------------------------------------------
			{
				displayName: 'Email ID',
				name: 'emailId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['receivedEmail'],
						operation: ['get', 'downloadAttachment'],
					},
				},
				default: '',
				description: 'ID of the received email',
			},
			{
				displayName: 'Blob ID',
				name: 'blobId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['receivedEmail'],
						operation: ['downloadAttachment'],
					},
				},
				default: '',
				description: 'ID of the attachment blob to download',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['receivedEmail'],
						operation: ['list'],
					},
				},
				options: [
					{
						displayName: 'After',
						name: 'after',
						type: 'string',
						default: '',
						description: 'Cursor for pagination (fetch results after this point)',
					},
					{
						displayName: 'Before',
						name: 'before',
						type: 'string',
						default: '',
						description: 'Cursor for pagination (fetch results before this point)',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: 50,
						description: 'Max number of results to return',
					},
				],
			},

			// -----------------------------------------------
			// Webhook Endpoint Fields
			// -----------------------------------------------
			{
				displayName: 'Endpoint ID',
				name: 'webhookEndpointId',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhookEndpoint'],
						operation: ['get', 'update', 'delete'],
					},
				},
				default: 0,
				description: 'ID of the webhook endpoint',
			},
			{
				displayName: 'Target URL',
				name: 'targetUrl',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhookEndpoint'],
						operation: ['create'],
					},
				},
				default: '',
				placeholder: 'https://example.com/webhooks',
				description: 'URL that will receive webhook event payloads',
			},
			{
				displayName: 'Events',
				name: 'webhookEvents',
				type: 'multiOptions',
				required: true,
				displayOptions: {
					show: {
						resource: ['webhookEndpoint'],
						operation: ['create'],
					},
				},
				options: [
					{
						name: 'Delivered',
						value: 'api_mail_log_delivered',
					},
					{
						name: 'Inbound Mail Received',
						value: 'inbound_mail_received',
					},
					{
						name: 'Opened',
						value: 'api_mail_log_opened',
					},
					{
						name: 'Permanent Failure',
						value: 'api_mail_log_permanent_failure',
					},
					{
						name: 'Temporary Failure',
						value: 'api_mail_log_temporary_failure',
					},
				],
				default: [],
				description: 'Event types to subscribe to',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['webhookEndpoint'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Active',
						name: 'active',
						type: 'boolean',
						default: true,
						description: 'Whether the webhook endpoint is active',
					},
					{
						displayName: 'Signing Key',
						name: 'signingKey',
						type: 'string',
						typeOptions: {
							password: true,
						},
						default: '',
						description: 'Key used to sign webhook payloads for verification',
					},
				],
			},
			{
				displayName: 'Update Fields',
				name: 'updateFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['webhookEndpoint'],
						operation: ['update'],
					},
				},
				options: [
					{
						displayName: 'Active',
						name: 'active',
						type: 'boolean',
						default: true,
						description: 'Whether the webhook endpoint is active',
					},
					{
						displayName: 'Events',
						name: 'events',
						type: 'multiOptions',
						options: [
							{
								name: 'Delivered',
								value: 'api_mail_log_delivered',
							},
							{
								name: 'Inbound Mail Received',
								value: 'inbound_mail_received',
							},
							{
								name: 'Opened',
								value: 'api_mail_log_opened',
							},
							{
								name: 'Permanent Failure',
								value: 'api_mail_log_permanent_failure',
							},
							{
								name: 'Temporary Failure',
								value: 'api_mail_log_temporary_failure',
							},
						],
						default: [],
						description: 'New set of event types',
					},
					{
						displayName: 'Target URL',
						name: 'targetUrl',
						type: 'string',
						default: '',
						description: 'New target URL',
					},
				],
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
						const from = this.getNodeParameter('from', i) as string;
						const to = this.getNodeParameter('to', i) as string;
						const subject = this.getNodeParameter('subject', i) as string;
						const contentType = this.getNodeParameter('contentType', i) as string;

						const recipients = to.split(',').map((email) => email.trim());

						const content: IDataObject = {};
						if (contentType === 'text' || contentType === 'both') {
							content['text/plain'] = this.getNodeParameter('textContent', i) as string;
						}
						if (contentType === 'html' || contentType === 'both') {
							content['text/html'] = this.getNodeParameter('htmlContent', i) as string;
						}

						if (Object.keys(content).length === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'Either text or HTML content must be provided',
								{ itemIndex: i },
							);
						}

						const headers: IDataObject = {
							subject,
							from,
						};

						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						if (additionalFields.replyTo) {
							headers['reply-to'] = additionalFields.replyTo;
						}
						if (additionalFields.listUnsubscribe) {
							headers['List-Unsubscribe'] = additionalFields.listUnsubscribe;
						}

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

						const message: IDataObject = {
							recipients,
							headers,
							content,
						};

						if (additionalFields.cc) {
							message.cc = (additionalFields.cc as string)
								.split(',')
								.map((email) => email.trim());
						}

						if (additionalFields.bcc) {
							message.bcc = (additionalFields.bcc as string)
								.split(',')
								.map((email) => email.trim());
						}

						if (additionalFields.allowNonTLS !== undefined) {
							message.allowNonTLS = additionalFields.allowNonTLS;
						}
						if (additionalFields.forceSecureNotification !== undefined) {
							message.forceSecureNotification = additionalFields.forceSecureNotification;
						}

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

						const body: IDataObject = {
							data: {
								message,
							},
						};

						if (additionalFields.overrideOpenTracking !== undefined) {
							(body.data as IDataObject).override_open_tracking = additionalFields.overrideOpenTracking;
						}
						if (additionalFields.overrideLinkTracking !== undefined) {
							(body.data as IDataObject).override_link_tracking = additionalFields.overrideLinkTracking;
						}
						if (additionalFields.unsubscribeUrl) {
							(body.data as IDataObject).unsubscribe_url = additionalFields.unsubscribeUrl;
						}

						const response = await this.helpers.httpRequest({
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
						const sourceTrackingId = this.getNodeParameter('sourceTrackingId', i) as string;

						const response = await this.helpers.httpRequest({
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
				} else if (resource === 'receivingDomain') {
					if (operation === 'list') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/receiving/domains`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'create') {
						const slug = this.getNodeParameter('slug', i, '') as string;
						const body: IDataObject = {};
						if (slug) {
							body.slug = slug;
						}

						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/receiving/domains`,
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
					} else if (operation === 'get') {
						const domainId = this.getNodeParameter('domainId', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/receiving/domains/${domainId}`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'delete') {
						const domainId = this.getNodeParameter('domainId', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/receiving/domains/${domainId}`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'mailbox') {
					const domainId = this.getNodeParameter('domainId', i) as string;

					if (operation === 'list') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/receiving/domains/${domainId}/mailboxes`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'create') {
						const mailboxName = this.getNodeParameter('mailboxName', i) as string;
						const mailboxPassword = this.getNodeParameter('mailboxPassword', i) as string;
						const quotaBytes = this.getNodeParameter('quotaBytes', i, 0) as number;

						const body: IDataObject = {
							name: mailboxName,
							password: mailboxPassword,
						};
						if (quotaBytes > 0) {
							body.quota_bytes = quotaBytes;
						}

						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/receiving/domains/${domainId}/mailboxes`,
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
					} else if (operation === 'get') {
						const mailboxId = this.getNodeParameter('mailboxId', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/receiving/domains/${domainId}/mailboxes/${mailboxId}`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'delete') {
						const mailboxId = this.getNodeParameter('mailboxId', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/receiving/domains/${domainId}/mailboxes/${mailboxId}`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'receivedEmail') {
					if (operation === 'list') {
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
						const qs: IDataObject = {};
						if (additionalFields.limit) {
							qs.limit = additionalFields.limit;
						}
						if (additionalFields.after) {
							qs.after = additionalFields.after;
						}
						if (additionalFields.before) {
							qs.before = additionalFields.before;
						}

						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/receiving`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							qs,
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'get') {
						const emailId = this.getNodeParameter('emailId', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/receiving/${emailId}`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'downloadAttachment') {
						const emailId = this.getNodeParameter('emailId', i) as string;
						const blobId = this.getNodeParameter('blobId', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/receiving/${emailId}/attachments/${blobId}`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'webhookEndpoint') {
					if (operation === 'list') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/webhook_endpoints`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							json: true,
						});

						if (Array.isArray(response)) {
							for (const item of response) {
								returnData.push({
									json: item as IDataObject,
									pairedItem: { item: i },
								});
							}
						} else {
							returnData.push({
								json: response as IDataObject,
								pairedItem: { item: i },
							});
						}
					} else if (operation === 'create') {
						const targetUrl = this.getNodeParameter('targetUrl', i) as string;
						const events = this.getNodeParameter('webhookEvents', i) as string[];
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const body: IDataObject = {
							target_url: targetUrl,
							events,
						};
						if (additionalFields.signingKey) {
							body.signing_key = additionalFields.signingKey;
						}
						if (additionalFields.active !== undefined) {
							body.active = additionalFields.active;
						}

						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/webhook_endpoints`,
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
					} else if (operation === 'get') {
						const endpointId = this.getNodeParameter('webhookEndpointId', i) as number;

						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/webhook_endpoints/${endpointId}`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
							},
							json: true,
						});

						returnData.push({
							json: response as IDataObject,
							pairedItem: { item: i },
						});
					} else if (operation === 'update') {
						const endpointId = this.getNodeParameter('webhookEndpointId', i) as number;
						const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

						const body: IDataObject = {};
						if (updateFields.targetUrl) {
							body.target_url = updateFields.targetUrl;
						}
						if (updateFields.events) {
							body.events = updateFields.events;
						}
						if (updateFields.active !== undefined) {
							body.active = updateFields.active;
						}

						const response = await this.helpers.httpRequest({
							method: 'PATCH',
							url: `${baseUrl}/webhook_endpoints/${endpointId}`,
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
					} else if (operation === 'delete') {
						const endpointId = this.getNodeParameter('webhookEndpointId', i) as number;

						const response = await this.helpers.httpRequest({
							method: 'DELETE',
							url: `${baseUrl}/webhook_endpoints/${endpointId}`,
							headers: {
								'Authorization': `Token token=${apiKey}`,
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

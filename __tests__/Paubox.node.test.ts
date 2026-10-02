import { Paubox } from '../nodes/Paubox/Paubox.node';
import { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

const CREDENTIALS = { apiUsername: 'testuser', apiKey: 'test-api-key-123' };
const BASE_URL = `https://api.paubox.net/v1/${CREDENTIALS.apiUsername}`;
const EMAIL_BASE_URL = 'https://api.paubox.com/v1/email';
const EMAIL_ID = '0192f0c4-0000-7000-8000-000000000001';
const NEWER_EMAIL_ID = '0192f0c4-0000-7000-8000-000000000002';
const ATTACHMENT_ID = '0192f0c4-0000-7000-8000-0000000000a1';
const AUTH_HEADER = `Token token=${CREDENTIALS.apiKey}`;

function createMockContext(params: Record<string, unknown>): IExecuteFunctions {
	const httpRequest = jest.fn().mockResolvedValue({ success: true });
	const prepareBinaryData = jest.fn(async (data: Buffer, fileName?: string, mimeType?: string) => ({
		data: data.toString('base64'),
		fileName,
		mimeType: mimeType ?? 'application/octet-stream',
	}));

	return {
		getInputData: () => [{ json: {} }],
		getNodeParameter: (name: string, _index: number, fallback?: unknown) => {
			if (name in params) return params[name];
			if (fallback !== undefined) return fallback;
			throw new Error(`Parameter "${name}" not set`);
		},
		getCredentials: jest.fn().mockResolvedValue(CREDENTIALS),
		getNode: () => ({ name: 'Paubox', type: 'paubox', typeVersion: 1, position: [0, 0], parameters: {} }),
		continueOnFail: () => false,
		helpers: { httpRequest, prepareBinaryData },
	} as unknown as IExecuteFunctions;
}

function getHttpRequest(ctx: IExecuteFunctions) {
	return (ctx.helpers as unknown as { httpRequest: jest.Mock }).httpRequest;
}

async function runNode(
	params: Record<string, unknown>,
	response?: unknown,
): Promise<{ result: INodeExecutionData[][]; httpRequest: jest.Mock }> {
	const ctx = createMockContext(params);
	if (response !== undefined) getHttpRequest(ctx).mockResolvedValue(response);
	const node = new Paubox();
	const result = await node.execute.call(ctx);
	return { result, httpRequest: getHttpRequest(ctx) };
}

function findProperty(name: string, resource: string) {
	const node = new Paubox();
	return node.description.properties.find(
		(p) => p.name === name && p.displayOptions?.show?.resource?.includes(resource),
	);
}

describe('Paubox Node', () => {
	describe('description', () => {
		it('should have correct resource options', () => {
			const node = new Paubox();
			const resourceProp = node.description.properties.find((p) => p.name === 'resource');
			const values = (resourceProp!.options as Array<{ value: string }>).map((o) => o.value);
			expect(values).toEqual(['mailbox', 'message', 'receivedEmail', 'receivingDomain', 'webhookEndpoint']);
		});
	});

	describe('message / send', () => {
		it('should POST to /messages', async () => {
			const { httpRequest } = await runNode({
				resource: 'message',
				operation: 'send',
				from: 'a@b.com',
				to: 'c@d.com',
				subject: 'Hi',
				contentType: 'text',
				textContent: 'Hello',
				additionalFields: {},
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: `${BASE_URL}/messages`,
					headers: expect.objectContaining({ Authorization: AUTH_HEADER }),
				}),
			);
		});
	});

	describe('message / getDisposition', () => {
		it('should GET /message_receipt with sourceTrackingId', async () => {
			const { httpRequest } = await runNode({
				resource: 'message',
				operation: 'getDisposition',
				sourceTrackingId: 'track-123',
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: `${BASE_URL}/message_receipt`,
					qs: { sourceTrackingId: 'track-123' },
				}),
			);
		});
	});

	describe('receivingDomain / list', () => {
		it('should GET /receiving/domains', async () => {
			const { httpRequest } = await runNode({
				resource: 'receivingDomain',
				operation: 'list',
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: `${EMAIL_BASE_URL}/receiving/domains`,
					headers: expect.objectContaining({ Authorization: AUTH_HEADER }),
				}),
			);
		});
	});

	describe('receivingDomain / create', () => {
		it('should POST /receiving/domains with slug', async () => {
			const { httpRequest } = await runNode({
				resource: 'receivingDomain',
				operation: 'create',
				slug: 'my-domain',
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: `${EMAIL_BASE_URL}/receiving/domains`,
					body: { slug: 'my-domain' },
				}),
			);
		});

		it('should POST /receiving/domains with empty body when no slug', async () => {
			const { httpRequest } = await runNode({
				resource: 'receivingDomain',
				operation: 'create',
				slug: '',
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: `${EMAIL_BASE_URL}/receiving/domains`,
					body: {},
				}),
			);
		});
	});

	describe('receivingDomain / get', () => {
		it('should GET /receiving/domains/:id', async () => {
			const { httpRequest } = await runNode({
				resource: 'receivingDomain',
				operation: 'get',
				domainId: '42',
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: `${EMAIL_BASE_URL}/receiving/domains/42`,
				}),
			);
		});
	});

	describe('receivingDomain / delete', () => {
		it('should DELETE /receiving/domains/:id', async () => {
			const { httpRequest } = await runNode({
				resource: 'receivingDomain',
				operation: 'delete',
				domainId: '42',
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'DELETE',
					url: `${EMAIL_BASE_URL}/receiving/domains/42`,
				}),
			);
		});
	});

	describe('mailbox / list', () => {
		it('should GET /receiving/domains/:id/mailboxes', async () => {
			const { httpRequest } = await runNode({
				resource: 'mailbox',
				operation: 'list',
				domainId: '7',
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: `${EMAIL_BASE_URL}/receiving/domains/7/mailboxes`,
				}),
			);
		});
	});

	describe('mailbox / create', () => {
		it('should POST with name, password, and quota_bytes', async () => {
			const { httpRequest } = await runNode({
				resource: 'mailbox',
				operation: 'create',
				domainId: '7',
				mailboxName: 'alice',
				mailboxPassword: 's3cret',
				quotaBytes: 1048576,
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'POST',
					url: `${EMAIL_BASE_URL}/receiving/domains/7/mailboxes`,
					body: { name: 'alice', password: 's3cret', quota_bytes: 1048576 },
				}),
			);
		});

		it('should omit quota_bytes when zero', async () => {
			const { httpRequest } = await runNode({
				resource: 'mailbox',
				operation: 'create',
				domainId: '7',
				mailboxName: 'bob',
				mailboxPassword: 'pw',
				quotaBytes: 0,
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					body: { name: 'bob', password: 'pw' },
				}),
			);
		});
	});

	describe('mailbox / get', () => {
		it('should GET /receiving/domains/:domainId/mailboxes/:id', async () => {
			const { httpRequest } = await runNode({
				resource: 'mailbox',
				operation: 'get',
				domainId: '7',
				mailboxId: '99',
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: `${EMAIL_BASE_URL}/receiving/domains/7/mailboxes/99`,
				}),
			);
		});
	});

	describe('mailbox / delete', () => {
		it('should DELETE /receiving/domains/:domainId/mailboxes/:id', async () => {
			const { httpRequest } = await runNode({
				resource: 'mailbox',
				operation: 'delete',
				domainId: '7',
				mailboxId: '99',
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'DELETE',
					url: `${EMAIL_BASE_URL}/receiving/domains/7/mailboxes/99`,
				}),
			);
		});
	});

	describe('receivedEmail / list', () => {
		it('should GET /receiving with email_id cursors', async () => {
			const { httpRequest } = await runNode({
				resource: 'receivedEmail',
				operation: 'list',
				additionalFields: { limit: 10, after: EMAIL_ID, before: NEWER_EMAIL_ID },
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: `${EMAIL_BASE_URL}/receiving`,
					headers: expect.objectContaining({ Authorization: AUTH_HEADER }),
					qs: { limit: 10, after: EMAIL_ID, before: NEWER_EMAIL_ID },
				}),
			);
		});

		it('should GET /receiving with empty qs when no filters', async () => {
			const { httpRequest } = await runNode({
				resource: 'receivedEmail',
				operation: 'list',
				additionalFields: {},
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: `${EMAIL_BASE_URL}/receiving`,
					qs: {},
				}),
			);
		});

		it('should return the list envelope as-is', async () => {
			const page = {
				object: 'list',
				data: [
					{
						email_id: EMAIL_ID,
						from: [{ name: 'Alice', address: 'alice@example.com' }],
						to: [{ name: null, address: 'inbox@acme.paubox.email' }],
						subject: 'Lab results',
						received_at: '2026-10-01T12:00:00Z',
						has_attachment: true,
						spam: false,
						size: 2048,
						domain: 'acme.paubox.email',
					},
				],
				has_more: false,
			};

			const { result } = await runNode(
				{ resource: 'receivedEmail', operation: 'list', additionalFields: {} },
				page,
			);

			expect(result[0][0].json).toEqual(page);
		});
	});

	describe('receivedEmail / get', () => {
		it('should GET /receiving/:emailId', async () => {
			const detail = {
				data: {
					email_id: EMAIL_ID,
					from: [{ name: 'Alice', address: 'alice@example.com' }],
					to: [{ name: null, address: 'inbox@acme.paubox.email' }],
					cc: [],
					subject: 'Lab results',
					attachments: [
						{
							id: ATTACHMENT_ID,
							filename: 'results.pdf',
							content_type: 'application/pdf',
							size: 1024,
							content_id: null,
							download_url: `${EMAIL_BASE_URL}/receiving/downloads/token`,
						},
					],
					spam: false,
					domain: 'acme.paubox.email',
				},
			};

			const { result, httpRequest } = await runNode(
				{ resource: 'receivedEmail', operation: 'get', emailId: EMAIL_ID },
				detail,
			);

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: `${EMAIL_BASE_URL}/receiving/${EMAIL_ID}`,
					headers: expect.objectContaining({ Authorization: AUTH_HEADER }),
				}),
			);
			expect(result[0][0].json).toEqual(detail);
		});
	});

	describe('receivedEmail / downloadAttachment', () => {
		const pdf = Buffer.from('%PDF-1.4 test');

		it('should label the blobId parameter as Attachment ID', () => {
			const prop = findProperty('blobId', 'receivedEmail');
			expect(prop?.displayName).toBe('Attachment ID');
			expect(prop?.displayOptions?.show?.operation).toEqual(['downloadAttachment']);
		});

		it('should GET /receiving/:emailId/attachments/:attachmentId as raw bytes', async () => {
			const { httpRequest } = await runNode(
				{
					resource: 'receivedEmail',
					operation: 'downloadAttachment',
					emailId: EMAIL_ID,
					blobId: ATTACHMENT_ID,
				},
				{ body: pdf, headers: { 'content-type': 'application/pdf' }, statusCode: 200 },
			);

			expect(httpRequest).toHaveBeenCalledWith({
				method: 'GET',
				url: `${EMAIL_BASE_URL}/receiving/${EMAIL_ID}/attachments/${ATTACHMENT_ID}`,
				headers: { Authorization: AUTH_HEADER },
				encoding: 'arraybuffer',
				returnFullResponse: true,
			});
		});

		it('should return the file as binary data with filename and MIME type', async () => {
			const { result } = await runNode(
				{
					resource: 'receivedEmail',
					operation: 'downloadAttachment',
					emailId: EMAIL_ID,
					blobId: ATTACHMENT_ID,
				},
				{
					body: pdf,
					headers: {
						'content-type': 'application/pdf',
						'content-disposition': 'attachment; filename="results.pdf"',
					},
					statusCode: 200,
				},
			);

			const item = result[0][0];
			expect(item.binary?.data).toEqual({
				data: pdf.toString('base64'),
				fileName: 'results.pdf',
				mimeType: 'application/pdf',
			});
			expect(item.json).toEqual({
				email_id: EMAIL_ID,
				attachment_id: ATTACHMENT_ID,
				filename: 'results.pdf',
				content_type: 'application/pdf',
				size: pdf.length,
			});
			expect(item.pairedItem).toEqual({ item: 0 });
		});

		it('should accept an ArrayBuffer body and strip Content-Type parameters', async () => {
			const text = Buffer.from('hello');
			const arrayBuffer = text.buffer.slice(text.byteOffset, text.byteOffset + text.length);

			const { result } = await runNode(
				{
					resource: 'receivedEmail',
					operation: 'downloadAttachment',
					emailId: EMAIL_ID,
					blobId: ATTACHMENT_ID,
				},
				{
					body: arrayBuffer,
					headers: {
						'content-type': 'text/plain; charset=utf-8',
						'content-disposition': 'attachment; filename=notes.txt',
					},
					statusCode: 200,
				},
			);

			expect(result[0][0].binary?.data).toEqual({
				data: text.toString('base64'),
				fileName: 'notes.txt',
				mimeType: 'text/plain',
			});
		});

		it('should leave the filename unset when Content-Disposition has none', async () => {
			const { result } = await runNode(
				{
					resource: 'receivedEmail',
					operation: 'downloadAttachment',
					emailId: EMAIL_ID,
					blobId: ATTACHMENT_ID,
				},
				{
					body: pdf,
					headers: { 'content-type': 'application/octet-stream', 'content-disposition': 'attachment' },
					statusCode: 200,
				},
			);

			const item = result[0][0];
			expect(item.binary?.data.fileName).toBeUndefined();
			expect(item.binary?.data.mimeType).toBe('application/octet-stream');
			expect(item.json.filename).toBeNull();
		});
	});

	describe('webhookEndpoint events', () => {
		const VALID_EVENTS = [
			'api_mail_log_delivered',
			'api_mail_log_opened',
			'api_mail_log_permanent_failure',
			'api_mail_log_temporary_failure',
		];

		it('should only offer the events the API accepts on create', () => {
			const prop = findProperty('webhookEvents', 'webhookEndpoint');
			const values = (prop!.options as Array<{ value: string }>).map((o) => o.value);
			expect(values).toEqual(VALID_EVENTS);
			expect(prop!.hint).toMatch(/Paubox Dashboard/);
		});

		it('should only offer the events the API accepts on update', () => {
			const updateFields = findProperty('updateFields', 'webhookEndpoint');
			const events = (updateFields!.options as Array<{ name: string; options?: Array<{ value: string }>; hint?: string }>).find(
				(o) => o.name === 'events',
			);
			expect(events!.options!.map((o) => o.value)).toEqual(VALID_EVENTS);
			expect(events!.hint).toMatch(/Paubox Dashboard/);
		});
	});

	describe('error handling', () => {
		it('should throw on API error when continueOnFail is false', async () => {
			const ctx = createMockContext({
				resource: 'receivingDomain',
				operation: 'list',
			});
			(ctx.helpers as unknown as { httpRequest: jest.Mock }).httpRequest.mockRejectedValue(
				new Error('401 Unauthorized'),
			);

			const node = new Paubox();
			await expect(node.execute.call(ctx)).rejects.toThrow('401 Unauthorized');
		});

		it('should return error json when continueOnFail is true', async () => {
			const ctx = createMockContext({
				resource: 'receivingDomain',
				operation: 'list',
			});
			(ctx.helpers as unknown as { httpRequest: jest.Mock }).httpRequest.mockRejectedValue(
				new Error('500 Internal'),
			);
			(ctx as unknown as { continueOnFail: () => boolean }).continueOnFail = () => true;

			const node = new Paubox();
			const result = await node.execute.call(ctx);
			expect(result[0][0].json).toEqual({ error: '500 Internal' });
		});
	});
});

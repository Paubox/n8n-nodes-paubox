import { Paubox } from '../nodes/Paubox/Paubox.node';
import { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

const CREDENTIALS = { apiUsername: 'testuser', apiKey: 'test-api-key-123' };
const BASE_URL = `https://api.paubox.net/v1/${CREDENTIALS.apiUsername}`;
const AUTH_HEADER = `Token token=${CREDENTIALS.apiKey}`;

function createMockContext(params: Record<string, unknown>): IExecuteFunctions {
	const httpRequest = jest.fn().mockResolvedValue({ success: true });

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
		helpers: { httpRequest },
	} as unknown as IExecuteFunctions;
}

function getHttpRequest(ctx: IExecuteFunctions) {
	return (ctx.helpers as unknown as { httpRequest: jest.Mock }).httpRequest;
}

async function runNode(params: Record<string, unknown>): Promise<{ result: INodeExecutionData[][]; httpRequest: jest.Mock }> {
	const ctx = createMockContext(params);
	const node = new Paubox();
	const result = await node.execute.call(ctx);
	return { result, httpRequest: getHttpRequest(ctx) };
}

describe('Paubox Node', () => {
	describe('description', () => {
		it('should have correct resource options', () => {
			const node = new Paubox();
			const resourceProp = node.description.properties.find((p) => p.name === 'resource');
			const values = (resourceProp!.options as Array<{ value: string }>).map((o) => o.value);
			expect(values).toEqual(['mailbox', 'message', 'receivedEmail', 'receivingDomain']);
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
					url: `${BASE_URL}/receiving/domains`,
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
					url: `${BASE_URL}/receiving/domains`,
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
					url: `${BASE_URL}/receiving/domains`,
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
					url: `${BASE_URL}/receiving/domains/42`,
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
					url: `${BASE_URL}/receiving/domains/42`,
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
					url: `${BASE_URL}/receiving/domains/7/mailboxes`,
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
					url: `${BASE_URL}/receiving/domains/7/mailboxes`,
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
					url: `${BASE_URL}/receiving/domains/7/mailboxes/99`,
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
					url: `${BASE_URL}/receiving/domains/7/mailboxes/99`,
				}),
			);
		});
	});

	describe('receivedEmail / list', () => {
		it('should GET /receiving with query params', async () => {
			const { httpRequest } = await runNode({
				resource: 'receivedEmail',
				operation: 'list',
				additionalFields: { limit: 10, after: 'cursor-a', before: 'cursor-b' },
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: `${BASE_URL}/receiving`,
					qs: { limit: 10, after: 'cursor-a', before: 'cursor-b' },
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
					url: `${BASE_URL}/receiving`,
					qs: {},
				}),
			);
		});
	});

	describe('receivedEmail / get', () => {
		it('should GET /receiving/:emailId', async () => {
			const { httpRequest } = await runNode({
				resource: 'receivedEmail',
				operation: 'get',
				emailId: 'msg-555',
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: `${BASE_URL}/receiving/msg-555`,
				}),
			);
		});
	});

	describe('receivedEmail / downloadAttachment', () => {
		it('should GET /receiving/:emailId/attachments/:blobId', async () => {
			const { httpRequest } = await runNode({
				resource: 'receivedEmail',
				operation: 'downloadAttachment',
				emailId: 'msg-555',
				blobId: 'blob-42',
			});

			expect(httpRequest).toHaveBeenCalledWith(
				expect.objectContaining({
					method: 'GET',
					url: `${BASE_URL}/receiving/msg-555/attachments/blob-42`,
				}),
			);
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

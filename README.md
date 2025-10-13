# n8n-nodes-paubox

This is an n8n community node that lets you send HIPAA-compliant email using the [Paubox Email API](https://www.paubox.com/) in your n8n workflows.

Paubox enables healthcare organizations to send secure, encrypted email without requiring recipients to use portals or passwords.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Table of Contents

- [Installation](#installation)
- [Prerequisites](#prerequisites)
- [Operations](#operations)
- [Credentials](#credentials)
- [Compatibility](#compatibility)
- [Usage](#usage)
- [Resources](#resources)
- [License](#license)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### For n8n Cloud or Self-Hosted:

1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-paubox` in the **Enter npm package name** field
4. Click **Install**

### For Local Development:

```bash
# Navigate to your n8n installation's node_modules directory
cd ~/.n8n/nodes

# Clone or install the package
npm install n8n-nodes-paubox

# Restart n8n
```

### Manual Installation for Testing:

```bash
# Clone this repository
git clone https://github.com/yourusername/n8n-nodes-paubox.git
cd n8n-nodes-paubox

# Install dependencies
npm install

# Build the node
npm run build

# Link for local testing
npm link

# In your n8n installation directory
cd ~/.n8n
npm link n8n-nodes-paubox

# Restart n8n
```

## Prerequisites

To use this node, you need:

1. **A Paubox Account**: Sign up at [paubox.com](https://www.paubox.com/)
2. **API Credentials**:
   - API Username (your API endpoint username)
   - API Key (your authentication token)
3. **Verified Domain**: Your sending email domain must be verified with Paubox
4. **n8n Installation**: Version 0.187.0 or later

## Operations

The Paubox node supports the following operations:

### Message

#### Send

Send a HIPAA-compliant email message.

**Required Fields:**

- **From**: Sender email address (must match your verified domain)
- **To**: Recipient email address(es) - comma-separated for multiple recipients
- **Subject**: Email subject line
- **Content**: Either plain text, HTML, or both

**Optional Fields:**

- **CC**: Carbon copy recipients
- **BCC**: Blind carbon copy recipients
- **Reply To**: Reply-to email address
- **Attachments**: File attachments (base64-encoded)
- **Allow Non-TLS**: Allow delivery over non-TLS (not HIPAA-compliant for PHI)
- **Force Secure Notification**: Force Paubox Secure Message delivery
- **Override Open Tracking**: Enable open tracking for this message
- **Override Link Tracking**: Enable click tracking (up to 1000 links)
- **Unsubscribe URL**: URL for unsubscribe tracking
- **List-Unsubscribe Header**: Standard unsubscribe header
- **Custom Headers**: Additional email headers (must start with X-)

**Returns:**

- `sourceTrackingId`: Unique identifier for tracking the message
- `data`: Status message
- `customHeaders`: Any custom headers that were set

#### Get Disposition

Retrieve delivery status and tracking information for a sent message.

**Required Fields:**

- **Source Tracking ID**: The tracking ID returned when the message was sent

**Returns:**

- Delivery status (delivered, bounced, processing, etc.)
- Open tracking information (if enabled)
- Click tracking information (if enabled)
- Unsubscribe status
- Delivery timestamps

## Credentials

The Paubox node requires the following credentials:

### Paubox API Credentials

1. In n8n, go to **Credentials** > **New**
2. Search for **Paubox API**
3. Enter your credentials:
   - **API Username**: Your Paubox Email API endpoint username
   - **API Key**: Your Paubox authentication token

To obtain these credentials:

1. Log in to your [Paubox account](https://paubox.com/login)
2. Navigate to your API settings
3. Copy your API Username and API Key

**Note**: The Paubox API uses a custom authentication format with the prefix `Token token=`. This is handled automatically by the node.

## Compatibility

- **n8n Version**: 0.187.0 or later
- **Tested With**: n8n 1.0.0+
- **Node Version**: Requires Node.js 16.x or later

## Usage

### Example 1: Send a Simple Email

```
1. Add a Paubox node to your workflow
2. Select Operation: Send
3. Configure:
   - From: doctor@yourhospital.com
   - To: patient@email.com
   - Subject: Your Lab Results
   - Content Type: HTML
   - HTML Content: <h1>Your results are ready</h1><p>Please log in to view them.</p>
4. Execute the node
```

### Example 2: Send Email with Attachment

```
1. Use a "Read Binary File" node to read your file
2. Use a "Function" node to convert to base64:
   return items.map(item => ({
     json: {
       fileContent: item.binary.data.toString('base64'),
       fileName: 'results.pdf'
     }
   }));
3. Add Paubox node with:
   - Basic fields (From, To, Subject, Content)
   - In Additional Fields > Attachments:
     - File Name: {{ $json.fileName }}
     - Content Type: application/pdf
     - Content (Base64): {{ $json.fileContent }}
```

### Example 3: Check Message Status

```
1. After sending a message, save the sourceTrackingId
2. Add another Paubox node
3. Select Operation: Get Disposition
4. Source Tracking ID: {{ $json.sourceTrackingId }}
5. Execute to see delivery status
```

### Example 4: Send Secure Email to Multiple Recipients

```
1. Add Paubox node
2. Configure:
   - From: admin@clinic.com
   - To: patient1@email.com, patient2@email.com
   - Subject: Monthly Health Newsletter
   - CC: doctor@clinic.com
   - Force Secure Notification: true (recipients get secure pickup link)
   - Override Open Tracking: true
```

## API Notes and Limitations

- **Base URL**: The API endpoint includes your username: `https://api.paubox.net/v1/{api_username}`
- **Authentication**: Custom format `Authorization: Token token={api_key}`
- **Content Requirement**: At least one of `text/plain` or `text/html` must be provided
- **Attachments**: Must be base64-encoded
- **Batch Sending**: For bulk messages, use multiple executions or implement bulk endpoint
- **Tracking**: The `sourceTrackingId` from send operation is needed for disposition checks
- **Rate Limits**: Check Paubox documentation for current API rate limits
- **HIPAA Compliance**: Setting `allowNonTLS` to `true` is not HIPAA-compliant if the message contains PHI

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Paubox Email API Documentation](https://docs.paubox.com/)
- [Paubox Support](https://www.paubox.com/support/)

## Development

```bash
# Install dependencies
npm install

# Build the node
npm run build

# Watch mode for development
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

## Version History

- **1.0.0**: Initial release
  - Send Message operation
  - Get Message Disposition operation
  - Full support for attachments, custom headers, and tracking

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)

## Support

If you encounter any issues or have questions:

1. Check the [n8n community forum](https://community.n8n.io/)
2. Review [Paubox API documentation](https://docs.paubox.com/)
3. Open an issue in this repository

## Disclaimer

This is a community-created node and is not officially supported by Paubox or n8n. Use at your own discretion.

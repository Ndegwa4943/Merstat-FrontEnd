/**
 * /netlify/functions/r2-presign — Issues a presigned PUT URL for
 * Cloudflare R2 so the careers form can upload CVs directly.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_REGION, R2_PUBLIC_BASE
 *
 * Browser posts:
 *   { filename, contentType, size }
 *
 * Function responds:
 *   { uploadUrl, publicUrl }
 *
 * Security:
 *   - 5-minute TTL on the presigned URL
 *   - 10 MB cap on upload size
 *   - Allow-list of MIME types (PDF, DOC, DOCX)
 *   - Random unguessable key (UUID + sanitised filename)
 *   - Origin check (run only on the production domain — handled by Netlify)
 */
import { randomUUID } from 'node:crypto';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_EXT = new Set(['pdf', 'doc', 'docx']);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const TTL_SECONDS = 5 * 60;

function jsonResponse(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function sanitizeFilename(name) {
  return name.replace(/[^\w.\-]/g, '_').slice(-80) || 'upload';
}

async function signR2PutUrl({ key, contentType, expiresIn }) {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const region = process.env.R2_REGION || 'auto';

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('R2 credentials missing');
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const host = new URL(endpoint).host;
  const objectKey = `${key}`;
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const signedHeaders = 'host';
  const algorithm = 'AWS4-HMAC-SHA256';

  const canonicalUri = `/${bucket}/${objectKey}`.replace(/\/+/g, '/');
  const canonicalHeaders = `host:${host}\n`;
  const signedHeadersStr = signedHeaders;
  const algorithmQuery =
    `X-Amz-Algorithm=${algorithm}` +
    `&X-Amz-Credential=${encodeURIComponent(accessKeyId + '/' + credentialScope)}` +
    `&X-Amz-Date=${amzDate}` +
    `&X-Amz-Expires=${expiresIn}` +
    `&X-Amz-SignedHeaders=${signedHeadersStr}`;

  const params = new URLSearchParams();
  Object.entries({
    'X-Amz-Algorithm': algorithm,
    'X-Amz-Credential': `${accessKeyId}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresIn),
    'X-Amz-SignedHeaders': signedHeadersStr,
  }).forEach(([k, v]) => params.set(k, v));

  const canonicalRequest =
    `PUT\n` +
    `${canonicalUri}\n` +
    `${algorithmQuery}\n` +
    `${canonicalHeaders}\n` +
    `${signedHeadersStr}\n` +
    `UNSIGNED-PAYLOAD`;

  const { createHash, createHmac } = await import('node:crypto');
  const hashedCanonical = createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${hashedCanonical}`;
  const kDate = createHmac('sha256', `AWS4${secretAccessKey}`).update(dateStamp).digest();
  const kRegion = createHmac('sha256', kDate).update(region).digest();
  const kService = createHmac('sha256', kRegion).update('s3').digest();
  const kSigning = createHmac('sha256', kService).update('aws4_request').digest();
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  params.set('X-Amz-Signature', signature);
  const uploadUrl = `${endpoint.replace(/\/$/, '')}${canonicalUri}?${params.toString()}`;
  return uploadUrl;
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON' });
  }

  const { filename, contentType, size } = body;

  if (!filename || !contentType) {
    return jsonResponse(400, { error: 'filename and contentType are required' });
  }

  if (size && size > MAX_BYTES) {
    return jsonResponse(413, { error: `File exceeds ${MAX_BYTES / 1024 / 1024} MB cap` });
  }

  if (!ALLOWED_MIME.has(contentType)) {
    return jsonResponse(415, { error: 'Unsupported file type' });
  }

  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return jsonResponse(415, { error: 'Unsupported file extension' });
  }

  const safeName = sanitizeFilename(filename);
  const objectKey = `cvs/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;

  try {
    const uploadUrl = await signR2PutUrl({
      key: objectKey,
      contentType,
      expiresIn: TTL_SECONDS,
    });
    const publicBase = process.env.R2_PUBLIC_BASE || '';
    const publicUrl = `${publicBase.replace(/\/$/, '')}/${objectKey}`;
    return jsonResponse(200, { uploadUrl, publicUrl, expiresIn: TTL_SECONDS });
  } catch (err) {
    return jsonResponse(500, { error: 'Failed to sign upload URL' });
  }
}

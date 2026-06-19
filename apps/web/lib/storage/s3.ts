import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { readStorageConfig } from "./config";

let cachedClient: S3Client | null = null;

export function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;
  const cfg = readStorageConfig();
  cachedClient = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKey,
      secretAccessKey: cfg.secretKey,
    },
    forcePathStyle: true,
  });
  return cachedClient;
}

export function getBucket(): string {
  return readStorageConfig().bucket;
}

export async function createMultipartUpload(params: {
  key: string;
  contentType: string;
}): Promise<{ uploadId: string; key: string }> {
  const client = getS3Client();
  const res = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: getBucket(),
      Key: params.key,
      ContentType: params.contentType,
    }),
  );
  if (!res.UploadId) throw new Error("Не удалось начать multipart upload.");
  return { uploadId: res.UploadId, key: params.key };
}

export async function presignUploadPart(params: {
  key: string;
  uploadId: string;
  partNumber: number;
  expiresIn?: number;
}): Promise<string> {
  const client = getS3Client();
  const command = new UploadPartCommand({
    Bucket: getBucket(),
    Key: params.key,
    UploadId: params.uploadId,
    PartNumber: params.partNumber,
  });
  return getSignedUrl(client, command, { expiresIn: params.expiresIn ?? 3600 });
}

export async function completeMultipartUpload(params: {
  key: string;
  uploadId: string;
  parts: { ETag: string; PartNumber: number }[];
}): Promise<void> {
  const client = getS3Client();
  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: getBucket(),
      Key: params.key,
      UploadId: params.uploadId,
      MultipartUpload: { Parts: params.parts.sort((a, b) => a.PartNumber - b.PartNumber) },
    }),
  );
}

export async function presignGetObject(key: string, expiresIn = 3600): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key });
  return getSignedUrl(client, command, { expiresIn });
}

export async function putObjectBuffer(params: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
}): Promise<void> {
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
}

export async function getObjectBody(key: string): Promise<{ body: ReadableStream<Uint8Array> | null; contentType?: string }> {
  const client = getS3Client();
  const res = await client.send(new GetObjectCommand({ Bucket: getBucket(), Key: key }));
  return {
    body: res.Body?.transformToWebStream?.() ?? (res.Body as ReadableStream<Uint8Array> | undefined) ?? null,
    contentType: res.ContentType,
  };
}

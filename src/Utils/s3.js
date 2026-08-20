export const S3_BASE = "https://gamenight-assets.s3.us-east-2.amazonaws.com/truthordrink";

export const s3Url = (folder, filename) => `${S3_BASE}/${folder}/${encodeURIComponent(filename)}`;

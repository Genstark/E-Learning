const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const distPath = path.resolve(__dirname, 'dist');
const bucketName = process.env.BUCKET_NAME;
const region = 'ap-south-1';

if (!bucketName) {
    console.error('Missing S3 bucket name. Set BUCKET_NAME in .env or AWS_S3_BUCKET in environment.');
    process.exit(1);
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.html': return 'text/html; charset=utf-8';
        case '.js': return 'application/javascript; charset=utf-8';
        case '.css': return 'text/css; charset=utf-8';
        case '.json': return 'application/json; charset=utf-8';
        case '.svg': return 'image/svg+xml';
        case '.png': return 'image/png';
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.gif': return 'image/gif';
        case '.ico': return 'image/x-icon';
        case '.webmanifest': return 'application/manifest+json';
        case '.xml': return 'application/xml';
        case '.woff': return 'font/woff';
        case '.woff2': return 'font/woff2';
        case '.ttf': return 'font/ttf';
        case '.eot': return 'application/vnd.ms-fontobject';
        case '.otf': return 'font/otf';
        case '.map': return 'application/octet-stream';
        default: return 'application/octet-stream';
    }
}

function getCacheControl(key) {
    if (key.endsWith('.html')) {
        return 'no-cache, max-age=0, must-revalidate';
    }
    return 'public, max-age=31536000, immutable';
}

async function walkDirectory(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...await walkDirectory(fullPath));
        } else if (entry.isFile()) {
            files.push(fullPath);
        }
    }
    return files;
}

async function uploadDist() {
    console.log('Running frontend build...');
    execSync('npm run build', { stdio: 'inherit', cwd: __dirname });

    if (!fs.existsSync(distPath)) {
        throw new Error(`Build output not found at ${distPath}`);
    }

    const client = new S3Client({ region });
    const files = await walkDirectory(distPath);

    console.log(`Uploading ${files.length} file(s) to s3://${bucketName} ...`);
    for (const filePath of files) {
        const key = path.relative(distPath, filePath).split(path.sep).join('/');
        const body = await fs.promises.readFile(filePath);
        const contentType = getContentType(filePath);
        const cacheControl = getCacheControl(key);

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: body,
            ContentType: contentType,
            CacheControl: cacheControl,
        });

        await client.send(command);
        console.log(`Uploaded ${key}`);
    }

    console.log('Deployment complete.');
}

uploadDist().catch((error) => {
    console.error('Deployment failed:', error);
    process.exit(1);
});

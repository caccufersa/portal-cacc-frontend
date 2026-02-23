import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('file') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files supplied.' }, { status: 400 });
        }

        const file = files[0];

        // Validation - Max 2MB
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Max 2MB allowed.' }, { status: 400 });
        }

        // Convert the File object to a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary
        const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'cacc-portal/avatars',
                    // Crop to square 256x256, focusing on face
                    transformation: [
                        { width: 256, height: 256, gravity: 'face', crop: 'fill' },
                    ],
                    // Let Cloudinary choose optimal format automatically
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) {
                        console.error('[Cloudinary] Upload stream error:', JSON.stringify(error));
                        reject(error);
                    } else {
                        resolve(result as Record<string, unknown>);
                    }
                }
            );
            uploadStream.end(buffer);
        });

        const secureUrl = result.secure_url as string;
        console.log('[Cloudinary] Upload successful:', secureUrl);

        return NextResponse.json({ url: secureUrl }, { status: 200 });
    } catch (error) {
        console.error('[Cloudinary] Route error:', error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: `Failed to upload avatar: ${msg}` },
            { status: 500 }
        );
    }
}


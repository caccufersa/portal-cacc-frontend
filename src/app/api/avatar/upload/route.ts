import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('file') as File[]; // Pode ser 'file' ou 'avatar'

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files supplied.' }, { status: 400 });
        }

        const file = files[0]; // Só precisamos de um avatar

        // Validation - Max 2MB
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large. Max 2MB allowed.' }, { status: 400 });
        }

        // Convert the File object to a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Submetendo a imagem para a pasta dedicada 'cacc-portal/avatars'
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'cacc-portal/avatars', // Pasta dedicada
                    format: 'jpg',
                    // Faremos o cloud compress e transformará toda imagem em quadrado (1:1) com foco no rosto!
                    transformation: [
                        { width: 256, height: 256, gravity: "face", crop: "fill" },
                        { fetch_format: "auto", quality: "auto" }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            // Escrita do buffer
            uploadStream.end(buffer);
        });

        // The exact generated Cloudinary URL
        const secureUrl = (result as any).secure_url;

        return NextResponse.json({ url: secureUrl }, { status: 200 });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return NextResponse.json(
            { error: 'Failed to upload avatar to cloud storage.' },
            { status: 500 }
        );
    }
}

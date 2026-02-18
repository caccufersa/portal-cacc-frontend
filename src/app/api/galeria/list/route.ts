import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    const result = await cloudinary.search
      .expression('folder:cacc-galeria')
      .sort_by('created_at', 'desc')
      .max_results(100)
      .execute();

    const images = result.resources.map((resource: any) => ({
      id: resource.public_id,
      url: resource.secure_url,
      createdAt: resource.created_at,
      width: resource.width,
      height: resource.height,
    }));

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Erro ao buscar imagens:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar imagens' },
      { status: 500 }
    );
  }
}

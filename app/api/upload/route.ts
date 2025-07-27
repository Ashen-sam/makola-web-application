import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('photos') as File[];
    
    // Validate file count
    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }
    
    if (files.length > 4) {
      return NextResponse.json(
        { error: "Maximum 4 photos allowed" },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` },
          { status: 400 }
        );
      }
      
      // Validate file size (5MB max per file)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size is 5MB.` },
          { status: 400 }
        );
      }
    }

    const uploadedUrls: string[] = [];

    // Upload each file to Supabase Storage
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const timestamp = Date.now();
      const fileName = `issue_${timestamp}_${i + 1}.${file.type.split('/')[1]}`;
      
      // Convert File to ArrayBuffer then to Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      const { data, error } = await supabase.storage
        .from('issue-photos') 
        .upload(fileName, fileBuffer, {
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
          { error: `Failed to upload ${file.name}: ${error.message}` },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('issue-photos')
        .getPublicUrl(data.path);

      uploadedUrls.push(urlData.publicUrl);
    }

    return NextResponse.json({
      message: `Successfully uploaded ${files.length} photo(s)`,
      photos: uploadedUrls,
      count: uploadedUrls.length
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
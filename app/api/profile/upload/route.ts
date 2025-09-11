import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const user_id = formData.get("user_id") as string;

    if (!file || !user_id) {
      return NextResponse.json(
        { error: "File and user ID are required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and GIF files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Create unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `profile_${user_id}_${Date.now()}.${fileExtension}`;
    const filePath = `profile-pictures/${fileName}`;

    // Convert file to arrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("profile-images") // Make sure this bucket exists in Supabase
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("profile-images")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Update user profile with new image URL
    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_picture: publicUrl })
      .eq("user_id", parseInt(user_id));

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile picture" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profile picture uploaded successfully",
      profile_picture: publicUrl,
    });
  } catch (error) {
    console.error("Profile picture upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get current profile picture URL
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("profile_picture")
      .eq("user_id", user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If there's a profile picture, delete it from storage
    if (user.profile_picture) {
      try {
        // Extract file path from URL
        const url = new URL(user.profile_picture);
        const filePath = url.pathname.split("/").slice(-2).join("/"); // Get last two segments

        await supabase.storage.from("profile-images").remove([filePath]);
      } catch (storageError) {
        console.error("Storage deletion error:", storageError);
        // Continue even if storage deletion fails
      }
    }

    // Remove profile picture from database
    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_picture: null })
      .eq("user_id", user_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to remove profile picture" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profile picture removed successfully",
    });
  } catch (error) {
    console.error("Profile picture removal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET - Get platform settings (public, no authentication needed)
export async function GET(request: NextRequest) {
  try {
    const { data: settings, error } = await supabase
      .from("platform_settings")
      .select("platform_name, platform_description, contact_email, updated_at")
      .single();

    if (error) {
      console.error("Get platform settings error:", error);
      return NextResponse.json(
        { error: "Failed to fetch platform settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Get platform settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update platform settings (only urban councilor)
export async function PUT(request: NextRequest) {
  try {
    const {
      platform_name,
      platform_description,
      contact_email,
      user_id,
      role,
    } = await request.json();

    // Check authorization - only urban councilor can update
    if (role !== "urban_councilor") {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Only urban councilors can update platform settings.",
        },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!platform_name || !platform_description || !contact_email) {
      return NextResponse.json(
        { error: "Platform name, description, and contact email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact_email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Update platform settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from("platform_settings")
      .update({
        platform_name,
        platform_description,
        contact_email,
        updated_at: new Date().toISOString(),
        updated_by: user_id,
      })
      .eq("id", 1)
      .select("platform_name, platform_description, contact_email, updated_at")
      .single();

    if (updateError) {
      console.error("Update platform settings error:", updateError);
      return NextResponse.json(
        { error: "Failed to update platform settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Platform settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Update platform settings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

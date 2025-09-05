import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET - Get profile by user_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("user_id, username, role, profile_picture, status, created_at")
      .eq("user_id", parseInt(user_id))
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let profileData: any = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      profile_picture: user.profile_picture,
      status: user.status,
      created_at: user.created_at,
    };

    // Get additional data based on role
    if (user.role === 'resident') {
      // Get resident details with issue count and badge
      const { data: resident, error: residentError } = await supabase
        .from("residents")
        .select("resident_id, name, address, phone_number, nic")
        .eq("user_id", parseInt(user_id))
        .single();

      if (resident) {
        // Get issue count for badge calculation
        const { count: issueCount, error: issueCountError } = await supabase
          .from("issues")
          .select("*", { count: "exact", head: true })
          .eq("resident_id", resident.resident_id);

        // Calculate badge
        let badge = "New Member";
        const count = issueCount || 0;
        if (count >= 50) badge = "Community Champion";
        else if (count >= 25) badge = "Active Advocate";
        else if (count >= 15) badge = "Issue Reporter";
        else if (count >= 10) badge = "Community Helper";
        else if (count >= 5) badge = "Local Contributor";

        profileData = {
          ...profileData,
          resident_details: {
            ...resident,
            issue_count: count,
            badge: badge
          }
        };
      }
    } else if (user.role === 'department_officer') {
      // Get department officer details
      const { data: officer, error: officerError } = await supabase
        .from("department_officers")
        .select("officer_id, department_name, address, phone_number")
        .eq("user_id", parseInt(user_id))
        .single();

      if (officer) {
        profileData = {
          ...profileData,
          officer_details: officer
        };
      }
    }

    return NextResponse.json({ profile: profileData });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update profile
export async function PUT(request: NextRequest) {
  try {
    const {
      user_id,
      username,
      profile_picture,
      // Resident specific fields
      name,
      address,
      phone_number,
      nic,
      // Department officer specific fields
      department_name,
      officer_address,
      officer_phone
    } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get current user to determine role
    const { data: currentUser, error: userFetchError } = await supabase
      .from("users")
      .select("role")
      .eq("user_id", user_id)
      .single();

    if (userFetchError || !currentUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update user table
    const userUpdateData: any = {};
    if (username !== undefined) userUpdateData.username = username;
    if (profile_picture !== undefined) userUpdateData.profile_picture = profile_picture;

    const { error: userUpdateError } = await supabase
      .from("users")
      .update(userUpdateData)
      .eq("user_id", user_id);

    if (userUpdateError) {
      return NextResponse.json(
        { error: "Failed to update user profile" },
        { status: 500 }
      );
    }

    // Update role-specific tables
    if (currentUser.role === 'resident') {
      const residentUpdateData: any = {};
      if (name !== undefined) residentUpdateData.name = name;
      if (address !== undefined) residentUpdateData.address = address;
      if (phone_number !== undefined) residentUpdateData.phone_number = phone_number;
      if (nic !== undefined) residentUpdateData.nic = nic;

      if (Object.keys(residentUpdateData).length > 0) {
        const { error: residentUpdateError } = await supabase
          .from("residents")
          .update(residentUpdateData)
          .eq("user_id", user_id);

        if (residentUpdateError) {
          return NextResponse.json(
            { error: "Failed to update resident details" },
            { status: 500 }
          );
        }
      }
    } else if (currentUser.role === 'department_officer') {
      const officerUpdateData: any = {};
      if (department_name !== undefined) officerUpdateData.department_name = department_name;
      if (officer_address !== undefined) officerUpdateData.address = officer_address;
      if (officer_phone !== undefined) officerUpdateData.phone_number = officer_phone;

      if (Object.keys(officerUpdateData).length > 0) {
        const { error: officerUpdateError } = await supabase
          .from("department_officers")
          .update(officerUpdateData)
          .eq("user_id", user_id);

        if (officerUpdateError) {
          return NextResponse.json(
            { error: "Failed to update officer details" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Hard delete own profile (by user_id + role)

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id || !role) {
      return NextResponse.json(
        { error: "user_id and role are required" },
        { status: 400 }
      );
    }

    const targetUserId = parseInt(user_id);

    // 🗑️ Delete role-specific records first
    if (role.toLowerCase() === "resident") {
      await supabase.from("residents").delete().eq("user_id", targetUserId);
      await supabase.from("issues").delete().eq("resident_id", targetUserId); // optional
    } else if (role.toLowerCase() === "department_officer") {
      await supabase.from("department_officers").delete().eq("user_id", targetUserId);
    }

    // 🗑️ Finally delete user
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("user_id", targetUserId);

    if (deleteError) {
      console.error("Delete profile error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete profile", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profile and related data deleted successfully",
    });
  } catch (error) {
    console.error("Delete profile exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


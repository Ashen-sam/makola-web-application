import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";
import { getSocketIO } from "@/lib/socketService";

// Helper function to check admin permissions
async function checkAdminPermissions(userId: string, role: string) {
  if (role !== "urban_councilor") {
    return { isAdmin: false, error: "Only urban councilors can manage users" };
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("user_id, role, status")
    .eq("user_id", userId)
    .eq("role", "urban_councilor")
    .eq("status", "active")
    .single();

  if (error || !user) {
    return { isAdmin: false, error: "Admin user not found or inactive" };
  }

  return { isAdmin: true, error: null };
}

// GET - Get all users with their profiles
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const adminUserId = url.searchParams.get("admin_user_id");
    const adminRole = url.searchParams.get("admin_role");
    const userType = url.searchParams.get("type"); // 'all', 'resident', 'department_officer'
    const status = url.searchParams.get("status"); // 'active', 'suspended', 'all'

    if (!adminUserId || !adminRole) {
      return NextResponse.json(
        { error: "Admin user ID and role are required" },
        { status: 400 }
      );
    }

    // Check admin permissions
    const { isAdmin, error: permissionError } = await checkAdminPermissions(
      adminUserId,
      adminRole
    );
    if (!isAdmin) {
      return NextResponse.json({ error: permissionError }, { status: 403 });
    }

    // Build query based on filters
    let query = supabase.from("users").select(`
        user_id,
        username,
        role,
        status,
        created_at,
        residents (
          resident_id,
          name,
          address,
          phone_number,
          nic
        ),
        department_officers (
          officer_id,
          department_name,
          address,
          phone_number
        )
      `);

    // Filter by user type
    if (userType && userType !== "all") {
      query = query.eq("role", userType);
    }

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Exclude urban_councilors from the list
    query = query.neq("role", "urban_councilor");

    const { data: users, error: usersError } = await query;

    if (usersError) {
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Format the response
    const getFirst = <T>(val: T | T[]): T | undefined =>
      Array.isArray(val) ? val[0] : val;
    const formattedUsers =
      users?.map((user) => {
        const resident = getFirst(user.residents);
        const officer = getFirst(user.department_officers);
        return {
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          status: user.status,
          created_at: user.created_at,
          nic: resident?.nic ?? null,
          profile: user.role === "resident" ? resident : officer,
          phoneNumber: resident?.phone_number ?? officer?.phone_number ?? null,
          address: resident?.address ?? officer?.address ?? null,
        };
      }) || [];

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
      filters: { userType, status },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new user (resident or department officer)
export async function POST(request: NextRequest) {
  try {
    const {
      username,
      password,
      userType, // 'resident' or 'department_officer'
      admin_user_id,
      admin_role,
      // Resident fields
      name,
      address,
      phone_number,
      nic,
      // Department officer fields
      department_name,
    } = await request.json();

    // Check admin permissions
    const { isAdmin, error: permissionError } = await checkAdminPermissions(
      admin_user_id,
      admin_role
    );
    if (!isAdmin) {
      return NextResponse.json({ error: permissionError }, { status: 403 });
    }

    // Validate required fields
    if (!username || !password || !userType) {
      return NextResponse.json(
        { error: "Username, password, and user type are required" },
        { status: 400 }
      );
    }

    // Validate user type
    if (!["resident", "department_officer"].includes(userType)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    // Validate type-specific fields
    if (userType === "resident") {
      if (!name || !address || !phone_number || !nic) {
        return NextResponse.json(
          {
            error:
              "Name, address, phone number, and NIC are required for residents",
          },
          { status: 400 }
        );
      }
    } else if (userType === "department_officer") {
      if (!department_name || !address || !phone_number) {
        return NextResponse.json(
          {
            error:
              "Department name, address, and phone number are required for department officers",
          },
          { status: 400 }
        );
      }
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("user_id")
      .eq("username", username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        username,
        password: hashedPassword,
        role: userType,
        status: "active",
      })
      .select("user_id, username, role, status")
      .single();

    if (userError) {
      console.error("User creation error:", userError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    let profileData = null;

    try {
      if (userType === "resident") {
        // Check if NIC already exists
        const { data: existingResident } = await supabase
          .from("residents")
          .select("resident_id")
          .eq("nic", nic)
          .single();

        if (existingResident) {
          // Rollback user creation
          await supabase.from("users").delete().eq("user_id", user.user_id);
          return NextResponse.json(
            { error: "NIC already exists" },
            { status: 409 }
          );
        }

        // Create resident profile
        const { data: resident, error: residentError } = await supabase
          .from("residents")
          .insert({
            user_id: user.user_id,
            name,
            address,
            phone_number,
            nic,
          })
          .select("resident_id, name, address, phone_number, nic")
          .single();

        if (residentError) {
          // Rollback user creation
          await supabase.from("users").delete().eq("user_id", user.user_id);
          console.error("Resident creation error:", residentError);
          return NextResponse.json(
            { error: "Failed to create resident profile" },
            { status: 500 }
          );
        }

        profileData = resident;
      } else if (userType === "department_officer") {
        // Create department officer profile
        const { data: officer, error: officerError } = await supabase
          .from("department_officers")
          .insert({
            user_id: user.user_id,
            department_name,
            address,
            phone_number,
          })
          .select("officer_id, department_name, address, phone_number")
          .single();

        if (officerError) {
          // Rollback user creation
          await supabase.from("users").delete().eq("user_id", user.user_id);
          console.error("Department officer creation error:", officerError);
          return NextResponse.json(
            { error: "Failed to create department officer profile" },
            { status: 500 }
          );
        }

        profileData = officer;
      }

      // Initialize Socket.IO
      try {
        await fetch(
          `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4000"
          }/api/socket/io`
        );
      } catch (socketInitError) {
        console.log("Socket.IO initialization skipped");
      }

      // Emit socket event for real-time user creation
      const socketIO = getSocketIO();
      if (socketIO) {
        socketIO.emit("userCreated", {
          user: {
            ...user,
            profile: profileData,
          },
          createdBy: admin_user_id,
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json(
        {
          message: `${
            userType === "resident" ? "Resident" : "Department officer"
          } created successfully`,
          user: {
            ...user,
            profile: profileData,
          },
        },
        { status: 201 }
      );
    } catch (profileError) {
      // Rollback user creation if profile creation fails
      await supabase.from("users").delete().eq("user_id", user.user_id);
      console.error("Profile creation error:", profileError);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';
import { getSocketIO } from '@/lib/socketService';

// Helper function to check admin permissions
async function checkAdminPermissions(userId: string, role: string) {
  if (role !== 'urban_councilor') {
    return { isAdmin: false, error: 'Only urban councilors can manage users' };
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('user_id, role, status')
    .eq('user_id', userId)
    .eq('role', 'urban_councilor')
    .eq('status', 'active')
    .single();

  if (error || !user) {
    return { isAdmin: false, error: 'Admin user not found or inactive' };
  }

  return { isAdmin: true, error: null };
}

// GET - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const userId = parseInt(resolvedParams.id);
    
    const url = new URL(request.url);
    const adminUserId = url.searchParams.get('admin_user_id');
    const adminRole = url.searchParams.get('admin_role');

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (!adminUserId || !adminRole) {
      return NextResponse.json(
        { error: 'Admin user ID and role are required' },
        { status: 400 }
      );
    }

    // Check admin permissions
    const { isAdmin, error: permissionError } = await checkAdminPermissions(adminUserId, adminRole);
    if (!isAdmin) {
      return NextResponse.json({ error: permissionError }, { status: 403 });
    }

    // Get user with profile data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
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
      `)
      .eq('user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow viewing other urban councilors
    if (user.role === 'urban_councilor') {
      return NextResponse.json({ error: 'Cannot access urban councilor accounts' }, { status: 403 });
    }

    // Format response
    const formattedUser = {
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      profile: user.role === 'resident' ? user.residents?.[0] : user.department_officers?.[0]
    };

    return NextResponse.json({ user: formattedUser });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const userId = parseInt(resolvedParams.id);
    
    const {
      username,
      password,
      admin_user_id,
      admin_role,
      // Resident fields
      name,
      address,
      phone_number,
      nic,
      // Department officer fields
      department_name
    } = await request.json();

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check admin permissions
    const { isAdmin, error: permissionError } = await checkAdminPermissions(admin_user_id, admin_role);
    if (!isAdmin) {
      return NextResponse.json({ error: permissionError }, { status: 403 });
    }

    // Get current user data
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('user_id, username, role, status')
      .eq('user_id', userId)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow editing urban councilors
    if (currentUser.role === 'urban_councilor') {
      return NextResponse.json({ error: 'Cannot edit urban councilor accounts' }, { status: 403 });
    }

    // Prepare user update data
    const userUpdateData: any = {};
    if (username && username !== currentUser.username) {
      // Check if new username exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('username', username)
        .neq('user_id', userId)
        .single();

      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
      }
      userUpdateData.username = username;
    }

    if (password) {
      userUpdateData.password = await bcrypt.hash(password, 12);
    }

    // Update user table if there are changes
    if (Object.keys(userUpdateData).length > 0) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdateData)
        .eq('user_id', userId);

      if (userUpdateError) {
        console.error('User update error:', userUpdateError);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
      }
    }

    // Update profile based on role
    if (currentUser.role === 'resident') {
      const profileUpdateData: any = {};
      if (name) profileUpdateData.name = name;
      if (address) profileUpdateData.address = address;
      if (phone_number) profileUpdateData.phone_number = phone_number;
      if (nic) {
        // Check if NIC exists for other residents
        const { data: existingResident } = await supabase
          .from('residents')
          .select('resident_id')
          .eq('nic', nic)
          .neq('user_id', userId)
          .single();

        if (existingResident) {
          return NextResponse.json({ error: 'NIC already exists' }, { status: 409 });
        }
        profileUpdateData.nic = nic;
      }

      if (Object.keys(profileUpdateData).length > 0) {
        const { error: residentUpdateError } = await supabase
          .from('residents')
          .update(profileUpdateData)
          .eq('user_id', userId);

        if (residentUpdateError) {
          console.error('Resident update error:', residentUpdateError);
          return NextResponse.json({ error: 'Failed to update resident profile' }, { status: 500 });
        }
      }
    } else if (currentUser.role === 'department_officer') {
      const profileUpdateData: any = {};
      if (department_name) profileUpdateData.department_name = department_name;
      if (address) profileUpdateData.address = address;
      if (phone_number) profileUpdateData.phone_number = phone_number;

      if (Object.keys(profileUpdateData).length > 0) {
        const { error: officerUpdateError } = await supabase
          .from('department_officers')
          .update(profileUpdateData)
          .eq('user_id', userId);

        if (officerUpdateError) {
          console.error('Department officer update error:', officerUpdateError);
          return NextResponse.json({ error: 'Failed to update department officer profile' }, { status: 500 });
        }
      }
    }

    // Get updated user data
    const { data: updatedUser, error: fetchError } = await supabase
      .from('users')
      .select(`
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
      `)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch updated user data' }, { status: 500 });
    }

    // Format response
    const formattedUser = {
      user_id: updatedUser.user_id,
      username: updatedUser.username,
      role: updatedUser.role,
      status: updatedUser.status,
      created_at: updatedUser.created_at,
      profile: updatedUser.role === 'resident' ? updatedUser.residents?.[0] : updatedUser.department_officers?.[0]
    };

    // Emit socket event
    const socketIO = getSocketIO();
    if (socketIO) {
      socketIO.emit("userUpdated", {
        user: formattedUser,
        updatedBy: admin_user_id,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: formattedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const userId = parseInt(resolvedParams.id);
    
    const url = new URL(request.url);
    const adminUserId = url.searchParams.get('admin_user_id');
    const adminRole = url.searchParams.get('admin_role');

    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    if (!adminUserId || !adminRole) {
      return NextResponse.json(
        { error: 'Admin user ID and role are required' },
        { status: 400 }
      );
    }

    // Check admin permissions
    const { isAdmin, error: permissionError } = await checkAdminPermissions(adminUserId, adminRole);
    if (!isAdmin) {
      return NextResponse.json({ error: permissionError }, { status: 403 });
    }

    // Get user to be deleted
    const { data: userToDelete, error: userError } = await supabase
      .from('users')
      .select('user_id, username, role, status')
      .eq('user_id', userId)
      .single();

    if (userError || !userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Don't allow deleting urban councilors
    if (userToDelete.role === 'urban_councilor') {
      return NextResponse.json({ error: 'Cannot delete urban councilor accounts' }, { status: 403 });
    }

    // Delete user (CASCADE will handle profile deletion)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('User deletion error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    // Emit socket event
    const socketIO = getSocketIO();
    if (socketIO) {
      socketIO.emit("userDeleted", {
        deletedUser: userToDelete,
        deletedBy: adminUserId,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: 'User deleted successfully',
      deletedUser: {
        user_id: userToDelete.user_id,
        username: userToDelete.username,
        role: userToDelete.role
      }
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
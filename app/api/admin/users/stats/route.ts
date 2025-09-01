import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Helper function to check admin permissions
async function checkAdminPermissions(userId: string, role: string) {
  if (role !== 'urban_councilor') {
    return { isAdmin: false, error: 'Only urban councilors can view user statistics' };
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

// GET - Get user statistics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const adminUserId = url.searchParams.get('admin_user_id');
    const adminRole = url.searchParams.get('admin_role');

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

    // Get all users (excluding urban_councilors)
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('user_id, role, status, created_at')
      .neq('role', 'urban_councilor');

    if (allUsersError) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Total users
    const totalUsers = allUsers?.length || 0;

    // 2. Active users
    const activeUsers = allUsers?.filter(u => u.status === 'active').length || 0;

    // 3. Suspended users
    const suspendedUsers = allUsers?.filter(u => u.status === 'suspended').length || 0;

    // 4. How many departments (unique department count)
    const { data: departments, error: deptError } = await supabase
      .from('department_officers')
      .select('department_name')
      .order('department_name');

    let uniqueDepartments = 0;
    if (!deptError && departments) {
      const uniqueDeptNames = new Set(departments.map(d => d.department_name));
      uniqueDepartments = uniqueDeptNames.size;
    }

    // 5. Resident count increase this week
    const residentsThisWeek = allUsers?.filter(u => 
      u.role === 'resident' && 
      new Date(u.created_at) >= weekAgo
    ).length || 0;

    // 6. New residents today
    const residentsToday = allUsers?.filter(u => 
      u.role === 'resident' && 
      new Date(u.created_at) >= todayStart
    ).length || 0;

    // 7. Recent 5 users with their profile details
    const { data: recentUsers, error: recentError } = await supabase
      .from('users')
      .select(`
        user_id,
        username,
        role,
        status,
        created_at,
        residents (
          name,
          phone_number
        ),
        department_officers (
          department_name,
          phone_number
        )
      `)
      .neq('role', 'urban_councilor')
      .order('created_at', { ascending: false })
      .limit(5);

    let recentUserDetails: any = [];
    if (!recentError && recentUsers) {
      recentUserDetails = recentUsers.map(user => ({
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        name: user.role === 'resident' 
          ? user.residents?.[0]?.name 
          : user.department_officers?.[0]?.department_name,
        phone_number: user.role === 'resident'
          ? user.residents?.[0]?.phone_number
          : user.department_officers?.[0]?.phone_number
      }));
    }

    // Prepare final statistics
    const statistics = {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalDepartments: uniqueDepartments,
      residentsThisWeek,
      residentsToday,
      recentUsers: recentUserDetails
    };

    return NextResponse.json({
      statistics,
      timestamp: new Date().toISOString(),
      message: 'User statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Get user statistics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
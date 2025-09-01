import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { 
      username, 
      password, 
      department_name, 
      address, 
      phone_number
    } = await request.json();

    // Validate required fields
    if (!username || !password || !department_name || !address || !phone_number) {
      return NextResponse.json(
        { error: 'All fields are required: username, password, department_name, address, phone_number' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        username,
        password: hashedPassword,
        role: 'department_officer',
        status: 'active'
      })
      .select('user_id, username, role, status')
      .single();

    if (userError) {
      console.error('User creation error:', userError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create department officer profile
    const { data: officer, error: officerError } = await supabase
      .from('department_officers')
      .insert({
        user_id: user.user_id,
        department_name,
        address,
        phone_number
      })
      .select('officer_id, department_name, address, phone_number')
      .single();

    if (officerError) {
      // Rollback user creation
      await supabase.from('users').delete().eq('user_id', user.user_id);
      console.error('Department officer creation error:', officerError);
      return NextResponse.json({ error: 'Failed to create department officer profile' }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: 'Department officer registered successfully',
        user: {
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          status: user.status,
          profile: officer
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Department officer registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
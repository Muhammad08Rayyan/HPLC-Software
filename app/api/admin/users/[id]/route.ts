import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import { getUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const currentUser = await getUser(request);

    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;

    // Prevent admin from deleting themselves
    if (String(currentUser._id) === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Find the user to delete
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Log the user deletion
    await AuditLog.create({
      userId: String(currentUser._id),
      userName: currentUser.name,
      action: 'user_deleted',
      details: {
        deletedUserEmail: userToDelete.email,
        deletedUserName: userToDelete.name,
        deletedUserRole: userToDelete.role
      },
      ipAddress: request.ip
    });

    return NextResponse.json({
      success: true,
      message: `User ${userToDelete.name} deleted successfully`
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
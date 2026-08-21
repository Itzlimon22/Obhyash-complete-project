import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    await connection();

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Service role key not configured on server' },
        { status: 500 },
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // ── Security Check: Verify Caller Admin Role (Cookies & Bearer) ──
    let adminUserId: string | null = null;
    let adminEmail: string | null = null;

    // 1. Try Next.js Server Cookie Session
    try {
      const serverSupabase = await (await import('@/utils/supabase/server')).createClient();
      const { data: sessionUser } = await serverSupabase.auth.getUser();
      if (sessionUser?.user) {
        const { data: userRow } = await supabaseAdmin
          .from('users')
          .select('role, email')
          .eq('id', sessionUser.user.id)
          .single();

        const role = (userRow?.role || '').toLowerCase();
        const email = (userRow?.email || sessionUser.user.email || '').toLowerCase();
        if (
          role === 'admin' ||
          role === 'super admin' ||
          role === 'superadmin' ||
          role === 'moderator' ||
          email === 'admin@obhyash.com' ||
          sessionUser.user.user_metadata?.role === 'Admin' ||
          sessionUser.user.user_metadata?.role === 'admin'
        ) {
          adminUserId = sessionUser.user.id;
          adminEmail = userRow?.email || sessionUser.user.email || null;
        }
      }
    } catch (_) {}

    // 2. Fallback to Bearer Token (if API client / mobile app)
    if (!adminUserId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
          const { data: userRow } = await supabaseAdmin
            .from('users')
            .select('role, email')
            .eq('id', authData.user.id)
            .single();

          const role = (userRow?.role || '').toLowerCase();
          const email = (userRow?.email || authData.user.email || '').toLowerCase();
          if (
            role === 'admin' ||
            role === 'super admin' ||
            role === 'superadmin' ||
            role === 'moderator' ||
            email === 'admin@obhyash.com' ||
            authData.user.user_metadata?.role === 'Admin' ||
            authData.user.user_metadata?.role === 'admin'
          ) {
            adminUserId = authData.user.id;
            adminEmail = userRow?.email || authData.user.email || null;
          }
        }
      }
    }

    // 3. Dev Fallback
    if (!adminUserId && process.env.NODE_ENV === 'development') {
      adminUserId = 'dev-admin-id';
      adminEmail = 'admin@obhyash.com';
    }

    // Strict Enforcement: Reject any unauthenticated or non-admin requests
    if (!adminUserId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Admin privileges required to perform this action' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { action, userId, userEmail, newPassword } = body;

    if (!userId && !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Target userId or userEmail is required' },
        { status: 400 },
      );
    }

    // Resolve target user record
    let targetUserId = userId;
    let targetEmail = userEmail;

    if (!targetEmail && targetUserId) {
      const { data: uData } = await supabaseAdmin
        .from('users')
        .select('email, name')
        .eq('id', targetUserId)
        .single();
      if (uData?.email) targetEmail = uData.email;
    }

    if (!targetUserId && targetEmail) {
      const { data: uData } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', targetEmail.trim())
        .single();
      if (uData?.id) targetUserId = uData.id;
    }

    // Helper: Log security action
    const logSecurityAudit = async (activityType: string, description: string) => {
      if (!targetUserId) return;
      try {
        await supabaseAdmin.from('user_activity_log').insert({
          user_id: targetUserId,
          activity_type: activityType,
          description: description,
          metadata: {
            performed_by_admin: adminEmail || adminUserId || 'System',
            timestamp: new Date().toISOString(),
          },
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to log security audit (non-fatal):', err);
      }
    };

    // ─────────────────────────────────────────────────────────────
    // ACTION 1: SEND RESET EMAIL
    // ─────────────────────────────────────────────────────────────
    if (action === 'send_reset_email') {
      if (!targetEmail) {
        return NextResponse.json(
          { success: false, error: 'User does not have a valid email address' },
          { status: 400 },
        );
      }

      const redirectUrl = `${request.nextUrl.origin}/forgot-password?type=recovery`;

      const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(
        targetEmail.trim(),
        { redirectTo: redirectUrl },
      );

      if (resetErr) {
        console.error('Failed to send reset email:', resetErr);
        return NextResponse.json(
          { success: false, error: resetErr.message || 'Failed to send reset email' },
          { status: 400 },
        );
      }

      await logSecurityAudit(
        'SECURITY_PASSWORD_RESET_EMAIL',
        `Admin triggered password reset email to ${targetEmail}`,
      );

      return NextResponse.json({
        success: true,
        message: `Password reset email dispatched to ${targetEmail}`,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION 2: GENERATE DIRECT RECOVERY LINK (FOR WHATSAPP/MESSENGER SUPPORT)
    // ─────────────────────────────────────────────────────────────
    if (action === 'generate_recovery_link') {
      if (!targetEmail) {
        return NextResponse.json(
          { success: false, error: 'User does not have a valid email address' },
          { status: 400 },
        );
      }

      const redirectUrl = `${request.nextUrl.origin}/forgot-password?type=recovery`;

      const { data: linkData, error: linkErr } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: targetEmail.trim(),
          options: {
            redirectTo: redirectUrl,
          },
        });

      if (linkErr || !linkData?.properties?.action_link) {
        console.error('Failed to generate recovery link:', linkErr);
        return NextResponse.json(
          {
            success: false,
            error: linkErr?.message || 'Could not generate recovery link',
          },
          { status: 400 },
        );
      }

      await logSecurityAudit(
        'SECURITY_RECOVERY_LINK_GENERATED',
        `Admin generated a direct recovery link for ${targetEmail}`,
      );

      return NextResponse.json({
        success: true,
        recoveryLink: linkData.properties.action_link,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION 3: SET TEMPORARY PASSWORD DIRECTLY
    // ─────────────────────────────────────────────────────────────
    if (action === 'set_temporary_password') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 6 characters long' },
          { status: 400 },
        );
      }

      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: 'User ID is required to set direct password' },
          { status: 400 },
        );
      }

      const { error: updateAuthErr } =
        await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
          password: newPassword,
        });

      if (updateAuthErr) {
        console.error('Failed to set temporary password:', updateAuthErr);
        return NextResponse.json(
          {
            success: false,
            error: updateAuthErr.message || 'Failed to update user password',
          },
          { status: 400 },
        );
      }

      await logSecurityAudit(
        'SECURITY_PASSWORD_MANUALLY_SET',
        `Admin manually set a temporary password for user ${targetEmail || targetUserId}`,
      );

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION 4: FORCE LOGOUT / REVOKE SESSIONS
    // ─────────────────────────────────────────────────────────────
    if (action === 'revoke_sessions') {
      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: 'User ID is required to revoke sessions' },
          { status: 400 },
        );
      }

      // 1. Sign out all sessions from Supabase Auth
      try {
        await supabaseAdmin.auth.admin.signOut(targetUserId, 'global');
      } catch (soErr) {
        console.warn('Sign out global warning:', soErr);
      }

      // 2. Clear registered devices in user_devices table
      try {
        await supabaseAdmin
          .from('user_devices')
          .delete()
          .eq('user_id', targetUserId);
      } catch (_) {}

      await logSecurityAudit(
        'SECURITY_SESSIONS_REVOKED',
        `Admin revoked all active sessions and forced logout for user ${targetEmail || targetUserId}`,
      );

      return NextResponse.json({
        success: true,
        message: 'All active sessions revoked and devices logged out',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION 5: MANUAL PHONE VERIFICATION
    // ─────────────────────────────────────────────────────────────
    if (action === 'verify_phone_manually') {
      const { userPhone } = body;
      const targetPhone = userPhone || body.phone;

      if (!targetPhone) {
        return NextResponse.json(
          { success: false, error: 'Phone number is required' },
          { status: 400 },
        );
      }

      // 1. Insert/Update phone_verifications
      try {
        await supabaseAdmin.from('phone_verifications').insert({
          phone: targetPhone,
          otp_hash: 'admin_manual_verified',
          is_verified: true,
          verified_at: new Date().toISOString(),
        });
      } catch (pvErr) {
        console.warn('phone_verifications insert note:', pvErr);
      }

      // 2. Update users table phone_verified and reset requires_phone_verification
      if (targetUserId) {
        try {
          await supabaseAdmin
            .from('users')
            .update({
              phone: targetPhone,
              is_phone_verified: true,
              requires_phone_verification: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetUserId);
        } catch (_) {}
      }

      await logSecurityAudit(
        'MANUAL_PHONE_VERIFIED',
        `Admin manually verified phone number ${targetPhone} for user ${targetEmail || targetUserId}`,
      );

      return NextResponse.json({
        success: true,
        message: `Phone number ${targetPhone} verified successfully`,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION 5B: ASK USER TO RE-VERIFY / UPDATE PHONE
    // ─────────────────────────────────────────────────────────────
    if (action === 'ask_phone_reverification') {
      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 },
        );
      }

      try {
        await supabaseAdmin
          .from('users')
          .update({
            requires_phone_verification: true,
            is_phone_verified: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);
      } catch (err: any) {
        console.error('Failed to set requires_phone_verification:', err);
        return NextResponse.json(
          { success: false, error: err.message || 'Failed to update user' },
          { status: 500 },
        );
      }

      // Send in-app notification to the user
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: targetUserId,
          title: 'মোবাইল নম্বর রি-ভেরিফিকেশন অনুরোধ',
          message:
            'অ্যাডমিন আপনার মোবাইল নম্বরটি রি-ভেরিফাই বা আপডেট করার অনুরোধ জানিয়েছেন। অ্যাকাউন্ট লিঙ্কিং অপশন থেকে আপনার সঠিক নম্বরটি যুক্ত ও ভেরিফাই করুন।',
          type: 'system',
          is_read: false,
        });
      } catch (_) {}

      await logSecurityAudit(
        'ASK_PHONE_REVERIFICATION',
        `Admin requested phone reverification for user ${targetEmail || targetUserId}`,
      );

      return NextResponse.json({
        success: true,
        message: 'Phone re-verification request sent to user successfully',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION 5C: MANUAL EMAIL VERIFICATION BY ADMIN
    // ─────────────────────────────────────────────────────────────
    if (action === 'verify_email_manually') {
      const { userEmail } = body;
      const targetEmail = (userEmail || body.email || '').trim().toLowerCase();

      if (!targetEmail) {
        return NextResponse.json(
          { success: false, error: 'Email address is required' },
          { status: 400 },
        );
      }

      if (targetUserId) {
        try {
          await supabaseAdmin
            .from('users')
            .update({
              email: targetEmail,
              is_email_verified: true,
              requires_email_verification: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetUserId);
        } catch (err: any) {
          console.error('Failed to manually verify email:', err);
          return NextResponse.json(
            { success: false, error: err.message || 'Failed to update email' },
            { status: 500 },
          );
        }
      }

      await logSecurityAudit(
        'MANUAL_EMAIL_VERIFIED',
        `Admin manually verified email address ${targetEmail} for user ${targetEmail || targetUserId}`,
      );

      return NextResponse.json({
        success: true,
        message: `Email address ${targetEmail} verified successfully`,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION 5D: ASK USER TO RE-VERIFY / UPDATE EMAIL
    // ─────────────────────────────────────────────────────────────
    if (action === 'ask_email_reverification') {
      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 },
        );
      }

      try {
        await supabaseAdmin
          .from('users')
          .update({
            requires_email_verification: true,
            is_email_verified: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);
      } catch (err: any) {
        console.error('Failed to set requires_email_verification:', err);
        return NextResponse.json(
          { success: false, error: err.message || 'Failed to update user' },
          { status: 500 },
        );
      }

      // Send in-app notification to the user
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: targetUserId,
          title: 'ইমেইল রি-ভেরিফিকেশন অনুরোধ',
          message:
            'অ্যাডমিন আপনার ইমেইল অ্যাড্রেসটি রি-ভেরিফাই বা আপডেট করার অনুরোধ জানিয়েছেন। অ্যাকাউন্ট লিঙ্কিং অপশন থেকে ওটিপি দিয়ে আপনার সঠিক ইমেইলটি ভেরিফাই করুন।',
          type: 'system',
          is_read: false,
        });
      } catch (_) {}

      await logSecurityAudit(
        'ASK_EMAIL_REVERIFICATION',
        `Admin requested email reverification for user ${targetEmail || targetUserId}`,
      );

      return NextResponse.json({
        success: true,
        message: 'Email re-verification request sent to user successfully',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION 6: SEND / RESEND VERIFICATION OTP
    // ─────────────────────────────────────────────────────────────
    if (action === 'send_verification_otp') {
      const { userPhone } = body;
      const targetPhone = userPhone || body.phone;

      if (!targetPhone) {
        return NextResponse.json(
          { success: false, error: 'Phone number is required' },
          { status: 400 },
        );
      }

      const { data: otpRes, error: otpErr } = await supabaseAdmin.rpc(
        'send_registration_otp',
        {
          p_phone: targetPhone,
          p_is_dev_mock: false,
        },
      );

      if (otpErr) {
        console.error('Failed to dispatch OTP:', otpErr);
        return NextResponse.json(
          { success: false, error: otpErr.message || 'Failed to dispatch OTP' },
          { status: 400 },
        );
      }

      await logSecurityAudit(
        'ADMIN_OTP_DISPATCHED',
        `Admin triggered verification OTP to ${targetPhone}`,
      );

      return NextResponse.json({
        success: otpRes?.success ?? true,
        data: otpRes,
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION 7: SUSPEND USER WITH REASON & DURATION
    // ─────────────────────────────────────────────────────────────
    if (action === 'suspend_user') {
      const { reason, durationDays, adminNotes } = body;

      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 },
        );
      }

      const { error: suspendErr } = await supabaseAdmin
        .from('users')
        .update({
          status: 'Suspended',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      if (suspendErr) throw suspendErr;

      // Revoke active sessions
      try {
        await supabaseAdmin.auth.admin.signOut(targetUserId, 'global');
      } catch (_) {}

      await logSecurityAudit(
        'USER_SUSPENDED',
        `User suspended. Reason: ${reason || 'Terms violation'}. Duration: ${durationDays ? `${durationDays} days` : 'Permanent'}. Note: ${adminNotes || 'None'}`,
      );

      return NextResponse.json({
        success: true,
        message: 'User suspended and sessions terminated',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION 8: ADD INTERNAL SUPPORT NOTE
    // ─────────────────────────────────────────────────────────────
    if (action === 'add_admin_note') {
      const { note } = body;

      if (!note || !note.trim()) {
        return NextResponse.json(
          { success: false, error: 'Note text cannot be empty' },
          { status: 400 },
        );
      }

      if (!targetUserId) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 },
        );
      }

      await logSecurityAudit('ADMIN_NOTE', note.trim());

      return NextResponse.json({
        success: true,
        message: 'Internal support note added',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid security action specified' },
      { status: 400 },
    );
  } catch (err: any) {
    console.error('Error in /api/admin/users/security:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal security server error' },
      { status: 500 },
    );
  }
}

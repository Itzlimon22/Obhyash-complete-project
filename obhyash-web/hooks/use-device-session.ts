"use client";

import { useState, useEffect, useRef } from "react";
import {
  getDeviceToken,
  getDeviceName,
  getDeviceType,
  DeviceSession,
} from "@/services/device-session-service";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * useDeviceSession
 *
 * Simplified device session hook - device limits have been disabled.
 * Users can now log in on multiple devices simultaneously.
 */
export function useDeviceSession(userId: string | null | undefined): {
  blocked: false;
  limitData: null;
} {
  // Device limitations have been disabled as per user request.
  // Users can log in on multiple devices at the same time.
  return {
    blocked: false,
    limitData: null,
  };
}

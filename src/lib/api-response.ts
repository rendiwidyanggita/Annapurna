import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function successResponse<T>(data: T, message?: string, status: number = 200) {
  const body: ApiResponse<T> = {
    success: true,
    ...(message ? { message } : {}),
    data,
  };
  return NextResponse.json(body, { status });
}

export function errorResponse(
  message: string,
  code: string = "INTERNAL_ERROR",
  status: number = 400,
  details?: unknown
) {
  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

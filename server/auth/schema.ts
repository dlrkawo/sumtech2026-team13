import { z } from "zod";

// 회원가입·로그인 요청 (POST /api/auth/signup, POST /api/auth/login)
// FE는 타입만 가져다 쓴다: import type { AuthRequest } from "@/server/auth/schema"
// 필드가 없거나 타입이 틀릴 때도 zod 영어 기본 문구 대신 화면에 보여 줄 문장을 쓴다 ({ error })
export const authRequestSchema = z.object(
  {
    email: z.string({ error: "이메일을 적어 주세요." }).trim().toLowerCase().email("이메일 형식을 확인해 주세요."),
    password: z
      .string({ error: "비밀번호를 적어 주세요." })
      .min(8, "비밀번호는 8자 이상이어야 해요.")
      .max(72, "비밀번호는 72자 이하여야 해요."),
  },
  { error: "요청 형식이 올바르지 않아요." },
);
export type AuthRequest = z.infer<typeof authRequestSchema>;

// 로그인한 사용자 정보 (signup·login·me 응답의 data)
export interface AuthUserResponse {
  id: number;
  email: string;
}

// 비밀번호 해시 (Node 내장 scrypt, 추가 패키지 없음). 저장 형식: scrypt$<salt base64>$<hash base64>
// 서버 시작 시 시드 계정을 만들 때도 쓰므로 `server-only`를 넣지 않는다
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, saltB64, hashB64] = stored.split("$");
  if (algorithm !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

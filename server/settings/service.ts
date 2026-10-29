import "server-only";

import { query } from "../db/client";
import { DEFAULT_SETTINGS, type HighlightStyle, type SettingsResponse, type SettingsUpdateRequest } from "./schema";

interface SettingsRow {
  edge_display: boolean;
  voice_input: boolean;
  highlight_style: HighlightStyle;
  risk_warning: boolean;
  save_history: boolean;
}

const toResponse = (row: SettingsRow): SettingsResponse => ({
  edgeDisplay: row.edge_display,
  voiceInput: row.voice_input,
  highlightStyle: row.highlight_style,
  riskWarning: row.risk_warning,
  saveHistory: row.save_history,
});

const COLUMNS = "edge_display, voice_input, highlight_style, risk_warning, save_history";

// 사용자 설정. 행이 없으면 기본값으로 만들어서 돌려준다 (다른 도메인도 이 함수로 설정을 읽는다. 예: 위험 경고·기록 저장 여부)
export async function getSettings(userId: number): Promise<SettingsResponse> {
  await query("INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
  const rows = await query<SettingsRow>(`SELECT ${COLUMNS} FROM user_settings WHERE user_id = $1`, [userId]);
  return rows[0] ? toResponse(rows[0]) : DEFAULT_SETTINGS;
}

// 보낸 값만 바꾸고(나머지는 그대로), 바뀐 전체 설정을 돌려준다
export async function updateSettings(userId: number, patch: SettingsUpdateRequest): Promise<SettingsResponse> {
  await query("INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
  const rows = await query<SettingsRow>(
    `UPDATE user_settings SET
       edge_display    = COALESCE($2, edge_display),
       voice_input     = COALESCE($3, voice_input),
       highlight_style = COALESCE($4, highlight_style),
       risk_warning    = COALESCE($5, risk_warning),
       save_history    = COALESCE($6, save_history),
       updated_at      = now()
     WHERE user_id = $1
     RETURNING ${COLUMNS}`,
    [
      userId,
      patch.edgeDisplay ?? null,
      patch.voiceInput ?? null,
      patch.highlightStyle ?? null,
      patch.riskWarning ?? null,
      patch.saveHistory ?? null,
    ],
  );
  return toResponse(rows[0]!);
}

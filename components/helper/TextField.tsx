import { FOCUS_RING } from "./styles";

// 이름표(label)가 붙은 입력 칸. E2E는 getByLabel("이메일")처럼 이름표 글자로 찾는다
export function TextField({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  type: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-[6px] text-[20px] font-bold">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`min-h-[60px] rounded-[14px] border-2 border-[#6B7178] px-[14px] text-[21px] font-normal text-[#16191D] placeholder:text-[#6B7178] ${FOCUS_RING}`}
      />
    </label>
  );
}

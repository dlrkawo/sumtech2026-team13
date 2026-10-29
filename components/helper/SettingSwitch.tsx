import { FOCUS_RING } from "./styles";

// 켬/끔 스위치. E2E는 getByRole("switch", { name: "화면 가장자리 표시" })로 찾는다.
// 색만으로 상태를 알리지 않도록 옆에 '켬'/'끔' 글자를 같이 둔다
export function SettingSwitch({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex min-h-[72px] items-center gap-[14px] border-b border-[#EEECE6] py-[8px]">
      <div className="flex-1">
        <p className="text-[20px] font-bold">{label}</p>
        <p className="text-[20px] text-[#454B53]">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-[56px] w-[92px] shrink-0 rounded-[28px] disabled:opacity-50 ${checked ? "bg-[#1D4E89]" : "bg-[#C9C6BE]"} ${FOCUS_RING}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-[5px] h-[46px] w-[46px] rounded-full bg-white shadow transition-[left] ${checked ? "left-[41px]" : "left-[5px]"}`}
        />
      </button>
      <span aria-hidden="true" className="w-[36px] text-[20px] font-bold">
        {checked ? "켬" : "끔"}
      </span>
    </div>
  );
}

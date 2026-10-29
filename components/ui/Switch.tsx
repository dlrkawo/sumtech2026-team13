import { useId } from "react";

// 켜기/끄기 스위치. E2E는 getByRole("switch", { name: label })로 찾는다
// 색만으로 구분하지 않도록 "켜짐/꺼짐" 글자를 같이 보여 준다 (FE_CONVENTION.md 9번)
interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ label, checked, onChange, disabled = false }: SwitchProps) {
  const labelId = useId();

  return (
    <div className="flex items-center justify-between gap-6">
      <span id={labelId}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`h-14 min-w-28 rounded-full border-2 px-5 font-bold disabled:opacity-50 ${
          checked ? "border-blue-700 bg-blue-700 text-white" : "border-neutral-400 bg-white text-neutral-700"
        }`}
      >
        <span aria-hidden="true">{checked ? "켜짐" : "꺼짐"}</span>
      </button>
    </div>
  );
}

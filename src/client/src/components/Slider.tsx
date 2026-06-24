import { number } from "../format";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (value: number) => void;
}

/** Styled range input with a label and current value. */
export function Slider({ label, value, min, max, step, suffix, onChange }: SliderProps) {
  return (
    <label className="slider-row">
      <span className="slider-label">
        <span>{label}</span>
        <strong>
          {number(value, step < 1 ? 2 : 0)}
          {suffix ?? ""}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

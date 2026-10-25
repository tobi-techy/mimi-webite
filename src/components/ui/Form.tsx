import type { HTMLInputTypeAttribute, ReactNode } from "react";
import { Spaced } from "@/components/ui/Spaced";

/** A labelled text input: mono label above the field. */
export function Field({
  label,
  name,
  type,
  autoComplete,
  required = true,
}: {
  label: ReactNode;
  name: string;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="x-label">{label}</span>
      <input name={name} type={type} required={required} autoComplete={autoComplete} />
    </label>
  );
}

/** A labelled select with a disabled "Choose one" placeholder. */
export function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: readonly string[];
}) {
  return (
    <label className="x-cform__sel">
      <span className="x-label">{label}</span>
      <select name={name} required defaultValue="">
        <option value="" disabled>
          Choose one
        </option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

/** Pill-style radio group (`.x-radios`) in a fieldset with a mono legend. */
export function RadioPills({
  legend,
  name,
  options,
}: {
  legend: string;
  name: string;
  options: readonly string[];
}) {
  return (
    <fieldset>
      <legend className="x-label">{legend}</legend>
      <div className="x-radios">
        <Spaced>
          {options.map((o, i) => (
            <label key={o}>
              <input type="radio" name={name} value={o} defaultChecked={i === 0} />
              <span>{o}</span>
            </label>
          ))}
        </Spaced>
      </div>
    </fieldset>
  );
}

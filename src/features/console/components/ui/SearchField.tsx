import { Icon } from "@/features/console/components/ui/Icon";
import { Kbd } from "@/features/console/components/ui/Kbd";

type SearchFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  shortcut?: string;
  id?: string;
};

/** Search input with its icon (`.x-search`). */
export function SearchField({ label, value, onChange, shortcut, id }: SearchFieldProps) {
  return (
    <label className="x-search">
      <Icon name="search" />
      <input
        type="search"
        id={id}
        placeholder={label}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </label>
  );
}

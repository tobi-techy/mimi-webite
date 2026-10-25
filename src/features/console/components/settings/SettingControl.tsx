import { PauseAllButton } from "@/features/console/components/settings/PauseAllButton";
import { ButtonLink } from "@/features/console/components/ui/Button";
import { Kbds } from "@/features/console/components/ui/Kbd";
import { Select } from "@/features/console/components/ui/Select";
import { ToastButton } from "@/features/console/components/ui/ToastButton";
import { Toggle } from "@/features/console/components/ui/Toggle";
import { settingsHref, type SettingsControl } from "@/features/console/content/settings";

/** The control on the right of a settings row. Interactive parts are small client leaves. */
export function SettingControl({ control, label }: { control: SettingsControl; label: string }) {
  switch (control.kind) {
    case "switch":
      return <Toggle label={label} defaultOn={control.on} />;
    case "select":
      return <Select label={label} options={control.options} defaultValue={control.value} />;
    case "kbd":
      return (
        <>
          <Kbds keys={control.keys} />
          <Toggle label={`${label} shortcut`} defaultOn={control.on} />
        </>
      );
    case "button":
      return control.to ? (
        <ButtonLink variant="ghost" size="sm" href={settingsHref(control.to)}>
          {control.label}
        </ButtonLink>
      ) : (
        <ToastButton variant="ghost" size="sm" message={control.toast ?? control.label}>
          {control.label}
        </ToastButton>
      );
    case "pauseAll":
      return <PauseAllButton label={control.label} />;
    case "fixed":
      return (
        <span className="x-pk x-pk--static" title={control.hint}>
          {control.label}
        </span>
      );
    case "bar":
      return (
        <div className="x-bar">
          <span style={{ width: `${control.percent}%` }}></span>
        </div>
      );
  }
}

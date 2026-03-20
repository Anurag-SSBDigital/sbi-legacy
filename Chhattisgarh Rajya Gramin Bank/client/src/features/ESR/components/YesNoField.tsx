import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function YesNoField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value?: "YES" | "NO";
  onChange: (v: "YES" | "NO") => void;
  error?: string;
}) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup
        className="mt-2 flex gap-6"
        value={value}
        onValueChange={(v) => onChange(v as "YES" | "NO")}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="YES" id={`${label}-yes`} />
          <Label htmlFor={`${label}-yes`}>Yes</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="NO" id={`${label}-no`} />
          <Label htmlFor={`${label}-no`}>No</Label>
        </div>
      </RadioGroup>
      {error ? <div className="mt-1 text-xs text-destructive">{error}</div> : null}
    </div>
  );
}

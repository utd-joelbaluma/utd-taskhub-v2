import { useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import {
  startOfWeek,
  addDays,
  format,
  isSameWeek,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface WeekRange {
  start: Date;
  end: Date;
}

interface WeekPickerProps {
  value: WeekRange | null;
  onChange: (range: WeekRange) => void;
  placeholder?: string;
}

function getWeekRange(day: Date): WeekRange {
  const start = startOfWeek(day, { weekStartsOn: 1 });
  return {
    start,
    end: addDays(start, 4),
  };
}

function formatWeekLabel(range: WeekRange): string {
  const start = range.start;
  const end = range.end;
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

export function WeekPicker({ value, onChange, placeholder = "Pick a week" }: WeekPickerProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<Date | null>(null);

  const selectedRange: DateRange | undefined = value
    ? { from: value.start, to: value.end }
    : undefined;

  const hoveredRange: DateRange | undefined = hovered
    ? { from: getWeekRange(hovered).start, to: getWeekRange(hovered).end }
    : undefined;

  function handleSelect(_: DateRange | undefined, selectedDay: Date) {
    const range = getWeekRange(selectedDay);
    onChange(range);
    setOpen(false);
  }

  const displayRange = hovered && !value ? hoveredRange : selectedRange;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 font-normal text-left"
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted" />
          {value ? (
            <span>{formatWeekLabel(value)}</span>
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div
          style={{
            "--rdp-accent-color": "#0058be",
            "--rdp-accent-background-color": "#eff5ff",
            "--rdp-day-height": "36px",
            "--rdp-day-width": "36px",
            "--rdp-day_button-height": "34px",
            "--rdp-day_button-width": "34px",
          } as React.CSSProperties}
        >
          <DayPicker
            mode="range"
            selected={displayRange}
            onSelect={handleSelect}
            onDayMouseEnter={(day) => {
              const dow = day.getDay();
              if (dow === 0 || dow === 6) {
                setHovered(null);
                return;
              }
              setHovered(day);
            }}
            onDayMouseLeave={() => setHovered(null)}
            defaultMonth={value?.start ?? new Date()}
            weekStartsOn={0}
            showOutsideDays
            disabled={{ dayOfWeek: [0, 6] }}
            classNames={{
              month_caption: "rdp-month_caption pl-3",
            }}
            modifiersClassNames={{
              today: "font-bold",
            }}
            footer={
              value && isSameWeek(value.start, new Date(), { weekStartsOn: 1 }) ? (
                <p className="text-center text-xs text-muted px-4 pb-3">Current week</p>
              ) : null
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// apps/owner-web/src/types/react-date-range.d.ts
declare module "react-date-range" {
  import * as React from "react";

  export type RangeKeyDict = Record<string, Range>;

  export interface Range {
    startDate?: Date;
    endDate?: Date;
    key?: string;
    color?: string;
    autoFocus?: boolean;
    disabled?: boolean;
    showDateDisplay?: boolean;
  }

  export interface DateRangeProps {
    ranges: Range[];
    onChange?: (ranges: RangeKeyDict) => void;
    minDate?: Date;
    maxDate?: Date;
    editableDateInputs?: boolean;
    moveRangeOnFirstSelection?: boolean;
    rangeColors?: string[];
    direction?: "horizontal" | "vertical";
    months?: number;
    showMonthAndYearPickers?: boolean;
    showDateDisplay?: boolean;
    weekdayDisplayFormat?: string;
    monthDisplayFormat?: string;
    dateDisplayFormat?: string;
  }

  export const DateRange: React.ComponentType<DateRangeProps>;
}
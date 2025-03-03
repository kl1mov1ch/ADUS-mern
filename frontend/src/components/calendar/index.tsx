import {RangeCalendar} from "@nextui-org/react";
import {today, getLocalTimeZone} from '@internationalized/date';

export const CalendarContainer = () => {
    return (
        <div className="flex gap-x-4">
            <RangeCalendar
                aria-label="Date (Uncontrolled)"
                defaultValue={{
                    start: today(getLocalTimeZone()),
                    end: today(getLocalTimeZone()).add({weeks: 1}),
                }}
            />
        </div>
    );
}
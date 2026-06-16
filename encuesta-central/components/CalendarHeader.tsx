import {createClient} from "@/lib/supabase/server";

type Schedule = {
    is_open: boolean;
    opens_at: string | null;
    closes_at: string | null;
} | null;

export default async function CalendarHeader() {
    const supabase = await createClient()

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const {data: schedule } = await supabase
        .from("monthly_schedules")
        .select("is_open, closes_at, opens_at")
        .eq("month", month)
        .eq("year", year)
        .single();

    const monthName = now.toLocaleDateString('en-US', {month: 'long'});
    const status = getWindowStatus(schedule);

    return (
        <>
            <div className="page-head">
                <h1>Sign Up for {monthName}</h1>
                <p>
                    <span className="status-dot" style={{backgroundColor: status.color}}/>
                    {status.text}
                </p>
            </div>
        </>
    )
}

function getWindowStatus(schedule: Schedule): {text: string; color: string} {
    if (!schedule) {
        return {
            text: 'Signup window is not yet open',
            color: '#c5bdb3'
        }
    }
    if (schedule.is_open) {
        const closeText =
            schedule.closes_at ? `· closes at ${formatDate(schedule.closes_at)}` : '';
        return {
            text: `Signup window open ${closeText}`.trim(),
            color: '#7a9e7e',
        }
    }
    if (schedule.opens_at) {
        const opensDate = new Date(schedule.opens_at);
        if (opensDate > new Date()) {
            return {
                text: 'Signups open at ' + formatDate(schedule.opens_at),
                color: '#c5bdb3',
            }
        }
    }
    return {
        text: "Signups are closed",
        color: '#c5a87a',
    }
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(
        'en-US',
        {month: "long", day: "numeric"}
    )
}
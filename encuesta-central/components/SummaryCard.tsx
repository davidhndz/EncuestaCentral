import {createClient} from "@/lib/supabase/server";

type SignupRow = {
    id: string
    time_slots: {
        date: string,
        start_time: string,
        end_time: string,
    }
}

type Pill = {
    label: string
    count: number
}

export default async function SummaryCard () {
    const supabase = await createClient()

    const {data: {user}} = await supabase.auth.getUser()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const {data: signups} = await supabase
        .from('signups')
        .select('id, time_slots(date, start_time, end_time)')
        .eq('user_id', user!.id)
        .eq('status', 'confirmed')
        .gte('time_slots.date', startOfMonth.toISOString().split('T')[0])
        .lte('time_slots.date', endOfMonth.toISOString().split('T')[0])

    const pills = groupSingups((signups ?? []) as unknown as SignupRow[])

    return (
        <>
            <div className="summary-card">
                <div className="summary-label">Your signups this month</div>
                <div className="summary-pills">
                    {pills.length === 0 ? (
                        <div className="summary-pill">You have no signups this month</div>
                        ) : (
                            pills.map((pill, index) => (
                                <div className="summary" key={index}>
                                    {pill.label}
                                </div>
                            ))
                        )
                    }
                </div>
            </div>
        </>
    )
}

function groupSingups(signups: SignupRow[]): Pill[] {
    const groups = new Map<string, {dates: string[], start: string, end: string}>

    for (const signup of signups) {
        const {date, start_time, end_time} = signup.time_slots
        const dayOfWeek = new Date(date + "T00:00:00").getDay()
        const key = `${dayOfWeek}-${start_time}-${end_time}`

        if (!groups.has(key)) {
            groups.set(key, {dates: [date], start: start_time, end: end_time})
        }
        else {
            groups.get(key)!.dates.push(date)
        }
    }

    const pills: Pill[] = []

    for (const group of groups.values()) {
        const timeLabel = formatTimeRange(group.start, group.end);
        const dayCount = group.dates.length;

        if (dayCount > 1) {
            const dayName = formatDayName(group.dates[0])
            pills.push({
                label: `${dayName} ${timeLabel} · ×${dayCount}`,
                count: dayCount,
            })
        }
        else {
            const dateLabel = formatDayName(group.dates[0])
            pills.push({
                label: `${dateLabel} ${timeLabel}`,
                count: 1,
            })
        }
    }

    return pills

}

function formatTime(time: string): string {
    const [hourStr, minStr] = time.split(':')
    let hour = parseInt(hourStr, 10)
    const period = hour >= 12 ? 'PM' : 'AM'
    hour = hour % 12 || 12
    return minStr === '00' ? `${hour}${period}` : `${hour}:${minStr}${period}`
}

function formatDayName(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {weekday: 'short'})
}

function formatSpecificDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {weekday:'short', month: 'short', day: 'numeric'})
}

function formatTimeRange(start: string, end: string): string {
    return `${formatTime(start)} - ${formatTime(end)}`
}
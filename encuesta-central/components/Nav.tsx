
import {createClient} from "@/lib/supabase/server";

//Helper Function for formating name in a display name style

function formatDisplayName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return "";
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}


export default async function Nav () {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const {data: profile } = await supabase.from("users").select("name").eq("id", user?.id).single();

    const displayName = formatDisplayName(profile?.name ?? "")

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    return (
        <nav className="nav">
            <div className="nav-logo">Encuesta Central</div>
            <div>
                <div className="nav-meta">{displayName} &middot; {currentMonth}</div>
            </div>

        </nav>
    )
}
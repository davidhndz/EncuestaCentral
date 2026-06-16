"use client"
import {useState} from "react";
import {useRouter} from "next/navigation";
import {createBrowserClient} from "@supabase/ssr";

export default function Setup() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )

    const router = useRouter();
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!name.trim()) {
            setError("Please enter your name");
            return;
        }
        setLoading(true);

        const {data: {user}} = await supabase.auth.getUser();

        if(!user) {
            setError("Session expired. Please log in again.")
            setLoading(false);
            return;
        }

        const {error: insertError} = await supabase
            .from("users")
            .insert({
                id: user.id,
                name: name.trim(),
                email: user.email,
            });

        router.push("/");
    }
    return (
        <div className="login-page">
            <div className="login-logo">Encuesta Central</div>

            <div className="login-card">
                <h1>Welcome to Encuesta Central</h1>
                <p>Before we get you started, what is your name?</p>

                <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />

                {error && (
                    <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>
                )}

                <button
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Saving..." : "Get started"}
                </button>
            </div>
        </div>
    )
}
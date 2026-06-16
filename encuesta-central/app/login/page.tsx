"use client";
import {createBrowserClient} from "@supabase/ssr";
import {useState} from "react";
import "./login.css";

export default function Login() {
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )

    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    async function handleMagicLink () {
        await supabase.auth.signInWithOtp({email, options: {emailRedirectTo: "http://localhost:3000/auth/callback"}})
        setSent(true);
    }

    async function handleGoogleLogin () {
        await supabase.auth.signInWithOAuth({provider: "google", options: {redirectTo: "http://localhost:3000/auth/callback"}})
    }


    return (
        <>
            <div className="login-page">

                <div className="login-logo">
                    Encuesta Central
                </div>

                <div className="login-card">
                    <h1>Sign in</h1>
                    <p>Enter your email to receive a magic link, or continue with Google.</p>

                    {sent ? (
                        <div className="login-confirmation">
                            Check your email — a magic link is on its way.
                        </div>
                    ) : (
                        <>
                            <input
                                className="login-input"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <button className="btn-primary" onClick={handleMagicLink}>
                                Send magic link
                            </button>

                            <div className="login-divider">
                                <div className="login-divider-line" />
                                or
                                <div className="login-divider-line" />
                            </div>

                            <button className="btn-ghost" onClick={handleGoogleLogin}>
                                Continue with Google
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}
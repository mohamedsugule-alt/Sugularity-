import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 via-background to-background -z-10" />
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">Sugularity</h1>
                <p className="text-muted-foreground mt-2">Initialize your Cloud Second Brain.</p>
            </div>
            <SignUp />
        </div>
    );
}

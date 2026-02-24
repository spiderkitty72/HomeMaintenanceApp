import packageJson from "../../package.json";

export function VersionDisplay() {
    return (
        <div className="fixed bottom-2 right-2 text-[10px] text-muted-foreground/30 pointer-events-none select-none z-50">
            v{packageJson.version}
        </div>
    );
}

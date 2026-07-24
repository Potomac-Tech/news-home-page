export const hiddenLaunchModuleIds = new Set([
    "spacecraft",
    "contract-awards",
    "procurement",
    "regulatory",
    "companies",
    "marketplace",
    "events",
]);

export const hiddenLaunchPathPrefixes = [
    "/spacecraft",
    "/missions",
    "/companies",
    "/procurement",
    "/regulatory",
    "/tracker/contracts",
    "/member/marketplace",
    "/member/missions",
    "/member/procurement",
    "/events",
] as const;

export function isHiddenLaunchPath(pathname: string) {
    return hiddenLaunchPathPrefixes.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
}

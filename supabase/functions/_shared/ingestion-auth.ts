export async function ingestionSecretMatches(
    supplied: string | null,
    expected: string | undefined,
) {
    const normalizedSupplied = supplied?.trim();
    const normalizedExpected = expected?.trim();
    if (!normalizedSupplied || !normalizedExpected) return false;

    const encoder = new TextEncoder();
    const [suppliedDigest, expectedDigest] = await Promise.all([
        crypto.subtle.digest("SHA-256", encoder.encode(normalizedSupplied)),
        crypto.subtle.digest("SHA-256", encoder.encode(normalizedExpected)),
    ]);
    const left = new Uint8Array(suppliedDigest);
    const right = new Uint8Array(expectedDigest);
    let difference = 0;
    for (let index = 0; index < left.length; index += 1) {
        difference |= left[index] ^ right[index];
    }
    return difference === 0;
}

export function methodNotAllowed() {
    return Response.json(
        { error: "Method not allowed." },
        {
            status: 405,
            headers: { Allow: "POST", "Cache-Control": "no-store" },
        },
    );
}

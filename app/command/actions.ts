"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { hasPotomacSupabasePublicConfig } from "../../lib/supabase/config";

const personalEmailDomains = new Set([
    "aol.com",
    "gmail.com",
    "hotmail.com",
    "icloud.com",
    "live.com",
    "me.com",
    "msn.com",
    "outlook.com",
    "proton.me",
    "protonmail.com",
    "yahoo.com",
]);

function getEmailDomain(email: string) {
    const [, domain] = email.toLowerCase().split("@");
    return domain ?? "";
}

export async function submitMeridianInterest(formData: FormData) {
    const contactName = String(formData.get("contact_name") ?? "").trim();
    const contactEmail = String(formData.get("contact_email") ?? "").trim();
    const organizationName = String(formData.get("organization_name") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const useCase = String(formData.get("use_case") ?? "").trim();
    const estimatedSeats = Number(formData.get("estimated_seats") ?? 0);
    const emailDomain = getEmailDomain(contactEmail);

    if (!contactName || !contactEmail || !organizationName || !emailDomain) {
        redirect("/command?status=missing-required");
    }

    if (personalEmailDomains.has(emailDomain)) {
        redirect("/command?status=business-email-required");
    }

    if (!hasPotomacSupabasePublicConfig()) {
        redirect("/command?status=configuration-needed");
    }

    const supabase = await createClient();
    const { error } = await supabase.from("command_interest_requests").insert({
        contact_name: contactName,
        contact_email: contactEmail,
        organization_name: organizationName,
        title: title || null,
        estimated_seats: estimatedSeats > 0 ? estimatedSeats : null,
        use_case: useCase || null,
        status: "new",
    });

    if (error) {
        redirect("/command?status=submit-error");
    }

    redirect("/command?status=submitted");
}

import { redirect } from "next/navigation";

export default function LegacyLoginPage() {
    redirect("/request-access?tab=signin");
}

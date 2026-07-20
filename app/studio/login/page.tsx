import { redirect } from "next/navigation";

export default function EditorialStudioLoginPage() {
    redirect("/request-access?tab=signin&next=%2Fstudio&source=editorial-studio");
}

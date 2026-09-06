import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { PlatformApp } from "@/components/platform/platform-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireChatGPTUser("/");
  return <PlatformApp userName={user.fullName ?? user.email.split("@")[0]} signOutHref={chatGPTSignOutPath("/")} />;
}

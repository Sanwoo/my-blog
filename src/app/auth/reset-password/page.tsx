import Link from "next/link";
import { authDialogHref } from "@/lib/navigation";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1180px] flex-col justify-center gap-10 px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:gap-12 lg:pb-24 lg:pt-32">
      <section className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-[1.8rem] border border-border/70 bg-background/82 px-6 py-8 text-left shadow-sm backdrop-blur">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">暂不支持找回密码</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            当前站点没有开启密码找回邮件服务。如果你忘记了密码，请联系作者协助处理，或返回登录窗口继续使用 GitHub 登录。
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="rounded-full">
            <Link href={authDialogHref("/", { mode: "sign-in" })}>返回登录</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-full">
            <Link href="/">返回首页</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

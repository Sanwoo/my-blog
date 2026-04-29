import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:gap-12 lg:pb-24 lg:pt-32">
        <Card className="max-w-2xl">
          <CardContent className="space-y-4 p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">404</p>
            <h1 className="text-[clamp(1.55rem,1.2rem+1vw,2.2rem)] font-semibold leading-tight tracking-[-0.04em] text-foreground">这篇文章不存在，或者还没有公开发布。</h1>
            <p className="text-[15px] leading-7 text-muted-foreground sm:text-[15.5px]">它可能还在写作台里，或者已经换了新的地址。</p>
            <Button asChild>
              <Link href="/">回到首页</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

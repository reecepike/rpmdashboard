import { Suspense, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { UserMenu, UserMenuSkeleton } from "@/components/user-menu";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lg:flex">
      <Sidebar
        footer={
          <Suspense fallback={<UserMenuSkeleton />}>
            <UserMenu />
          </Suspense>
        }
      />
      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 lg:py-12">{children}</div>
      </main>
    </div>
  );
}

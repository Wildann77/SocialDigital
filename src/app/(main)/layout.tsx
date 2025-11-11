import SessionProvider from "./SessionProvider";
import { validateRequest } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "./Navbar";
import MenuBar from "./MenuBar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, session } = await validateRequest();

  // cek null
  if (!user || !session) redirect("/login");

  return (
    <SessionProvider value={{ user, session }}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="mx-auto flex w-full max-w-7xl grow gap-5 p-5">
          <MenuBar className="bg-card sticky top-[5.25rem] hidden h-fit flex-none space-y-3 rounded-2xl px-3 py-5 shadow-sm sm:block lg:px-5 xl:w-80" />
          {children}
        </div>
        <MenuBar className="bg-card sticky bottom-0 flex w-full justify-center gap-5 border-t p-3 sm:hidden" />
      </div>
    </SessionProvider>
  );
}

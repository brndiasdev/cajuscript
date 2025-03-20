import { ReactNode } from "react";
import Logo from "@/components/Logo";
interface Props {
  children: ReactNode;
}

export default function PublicLayout({ children }: Props ) {
  return (
    <div className="bg-secondary backdrop-blur-sm min-h-screen overflow-x-hidden flex min-w-screen w-full flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg p-4 w-full">
        <div className="flex items-center justify-center">
          <Logo
            width={300}
            height={100}
          />
        </div>

        <main className="grid mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

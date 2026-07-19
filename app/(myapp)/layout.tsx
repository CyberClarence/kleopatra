"use client";
import { ReactNode, useEffect } from "react";
import { MySideBar } from "./MySideBar";
import { useKeyStore } from "@/feature/keystore";

type MyAppLayoutProps = {
  children: ReactNode;
};

const Hydrate = () => {
  useEffect(() => {
    useKeyStore.persist.rehydrate();
  }, []);

  return null;
};

export default function MyAppLayout({ children }: MyAppLayoutProps) {
  return (
    <>
      <Hydrate />
      <div className="flex w-full h-full overflow-hidden">
        <MySideBar />
        <main
          className="flex-1 overflow-auto w-full pt-16 lg:pt-0"
          style={{ background: "var(--bg-page)" }}
        >
          {children}
        </main>
      </div>
    </>
  );
}

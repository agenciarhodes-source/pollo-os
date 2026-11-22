import { Pollo } from "@/components/pollo/pollo";

/** As telas de entrada: um cartão no centro, com o Pollo vivo em cima. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-panel px-4 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <Pollo shape="quadrado" color="laranja" face="olhos" mood="calmo" size={64} title="Pollo OS" />
          <span className="text-lg font-semibold tracking-tight">Pollo OS</span>
        </div>
        <div className="w-full rounded-3xl bg-card p-6 shadow-[0_10px_40px_-20px_rgba(60,40,20,0.35)] ring-1 ring-line sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}

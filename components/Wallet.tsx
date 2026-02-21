"use client";

import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet as WalletIcon, PlusCircle, ArrowDownToLine, History } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      order_id: string;
      handler: (res: { razorpay_payment_id: string; razorpay_order_id: string }) => void;
      prefill?: { email?: string };
      theme?: { color: string };
    }) => { open: () => void };
  }
}

async function fetchMe() {
  const res = await fetch("/api/me");
  if (!res.ok) throw new Error("Not authenticated");
  return res.json() as Promise<{ balance: number; email: string }>;
}

type TransactionRow = {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  createdAt: string;
};

async function fetchTransactions(): Promise<{ transactions: TransactionRow[] }> {
  const res = await fetch("/api/wallet/transactions");
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}

export default function Wallet() {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: status === "authenticated",
  });
  const { data: txData } = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: fetchTransactions,
    enabled: status === "authenticated",
  });

  const openRazorpayCheckout = useCallback(
    async (orderId: string, amountPaise: number, keyId: string) => {
      await loadRazorpayScript();
      if (!window.Razorpay) {
        setDepositError("Payment load failed. Please refresh.");
        return;
      }
      const rzp = new window.Razorpay({
        key: keyId,
        amount: amountPaise,
        order_id: orderId,
        handler: () => {
          setDepositOpen(false);
          setDepositAmount("");
          setDepositError("");
          queryClient.invalidateQueries({ queryKey: ["me"] });
          queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
        },
        prefill: { email: session?.user?.email ?? undefined },
        theme: { color: "#2563eb" },
      });
      rzp.open();
    },
    [queryClient, session?.user?.email]
  );

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    const rupees = parseFloat(depositAmount);
    if (!Number.isFinite(rupees) || rupees < 1) {
      setDepositError("Enter a valid amount (min ₹1).");
      return;
    }
    setDepositError("");
    setDepositLoading(true);
    try {
      const res = await fetch("/api/wallet/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: rupees }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail ? `${data.error}: ${data.detail}` : (data.error ?? "Failed to create order");
        setDepositError(msg);
        setDepositLoading(false);
        return;
      }
      await openRazorpayCheckout(data.orderId, data.amount, data.key);
    } catch {
      setDepositError("Something went wrong.");
    } finally {
      setDepositLoading(false);
    }
  }

  if (status !== "authenticated") {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Wallet</h1>
        <div className="bg-muted/50 border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">Sign in to view your wallet and deposit.</p>
        </div>
      </div>
    );
  }

  const transactions = txData?.transactions ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <WalletIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-black tracking-tight text-foreground">Wallet</h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Available balance</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            ₹{me != null ? (me.balance / 100).toFixed(2) : "0.00"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Use Deposit to add money via Razorpay</p>
        </div>
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => { setDepositOpen(true); setDepositError(""); }}
            className="w-full sm:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Deposit
          </Button>
          <Button variant="outline" disabled className="w-full sm:w-auto">
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Withdraw (coming soon)
          </Button>
        </div>
      </div>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Deposit</DialogTitle>
            <DialogDescription>
              Add money to your wallet via Razorpay. Enter amount in ₹ (INR).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label htmlFor="deposit-amount" className="text-foreground mb-1.5 block text-sm font-medium">
                Amount (₹)
              </label>
              <input
                id="deposit-amount"
                type="number"
                min="1"
                step="1"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 100"
                className={cn(
                  "border-input bg-background w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              />
            </div>
            {depositError && <p className="text-destructive text-sm">{depositError}</p>}
            <Button type="submit" disabled={depositLoading} className="w-full">
              {depositLoading ? "Creating…" : "Pay with Razorpay"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div>
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <History className="h-5 w-5" />
          Transaction history
        </h2>
        {transactions.length === 0 ? (
          <div className="bg-muted/30 border border-border rounded-2xl p-8 text-center text-muted-foreground">
            No transactions yet. Deposit or place a bet to see history.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Description</th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground uppercase text-right">Amount</th>
                  <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/20">
                    <td className="p-3">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          t.type === "DEPOSIT" && "bg-green-500/15 text-green-700 dark:text-green-400",
                          t.type === "CLAIM" && "bg-blue-500/15 text-blue-700 dark:text-blue-400",
                          t.type === "BET" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                          t.type === "WITHDRAWAL" && "bg-red-500/15 text-red-700 dark:text-red-400"
                        )}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-foreground max-w-[200px] truncate">
                      {t.description ?? "—"}
                    </td>
                    <td className="p-3 text-right font-medium text-foreground">
                      {t.amount >= 0 ? "+" : ""}₹{(t.amount / 100).toFixed(2)}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// GET /api/employer/transactions — List employer's transactions
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { transactions } from "@/lib/gcp/collections";
import type { Query, QueryDocumentSnapshot } from "@google-cloud/firestore";
import type { Transaction } from "@/types/transaction";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !user.employer_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 50);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Build query
    let query: Query = transactions().where("employer_id", "==", user.employer_id);

    if (type) {
      query = query.where("type", "==", type);
    }

    if (status) {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("created_at", "desc");

    const total = (await query.count().get()).data().count;
    const snapshot = await query.limit(limit).offset(offset).get();

    const txns: Transaction[] = snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];

    // Calculate balances
    const pendingTotal = (
      await transactions()
        .where("employer_id", "==", user.employer_id)
        .where("status", "==", "pending")
        .get()
    ).docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

    const completedTotal = (
      await transactions()
        .where("employer_id", "==", user.employer_id)
        .where("status", "==", "completed")
        .get()
    ).docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

    return NextResponse.json({
      transactions: txns,
      total,
      limit,
      offset,
      balance: {
        pending: pendingTotal,
        completed: completedTotal,
        total: pendingTotal + completedTotal,
      },
    });
  } catch (err) {
    console.error("[API] GET /employer/transactions error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

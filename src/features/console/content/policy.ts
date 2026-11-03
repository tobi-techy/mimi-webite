import type { ApiPolicyRule } from "@/features/console/api/types";

/**
 * The owner's rulebook as the demo shows it when the API can't be reached: the same steps, words
 * and defaults as MIMI-AGENT's `mimi/harness/policy.py` (ACTION_TYPES and BUILTIN_STOPS), read only.
 */
const r = (action_type: string, helper: string, label: string, behaviour: string, locked = false): ApiPolicyRule => ({
  action_type,
  helper,
  label,
  behaviour,
  default: behaviour,
  locked,
  allowed: [],
  changed_by: "",
  changed_at: "",
});

export const samplePolicy: ApiPolicyRule[] = [
  r("collector.send_reminder", "collector", "Send a payment reminder to a shop", "act"),
  r("collector.plan_reminders", "collector", "Plan the day's reminders", "act"),
  r("collector.send_receipt", "collector", "Send a shop a payment receipt", "act"),
  r("collector.create_payment_account", "collector", "Give a shop an exact-amount account to pay into", "act"),
  r("collector.notify_rep", "collector", "Tell a sales rep about a shop", "act"),
  r("shop.send_message", "all", "Send a shop a message", "act"),
  r("shop.ask_question", "all", "Ask a shop a question", "act"),
  r("rep.send_message", "all", "Send a sales rep a message", "act"),
  r("order.confirm_reorder", "order", "Confirm a shop's order", "act_if_preapproved"),
  r("order.ask_question", "order", "Ask a shop about its order", "act"),
  r("order.send_delivery_receipt", "order", "Send a shop a delivery receipt", "act"),
  r("order.record_delivery_consent", "order", "Record a shop's delivery answer", "act"),
  r("order.ask_receipt_again", "order", "Ask a shop to answer a receipt again", "act"),
  r("order.flag_delivery", "order", "Flag a delivery problem to you", "act"),
  r("stock.ask_count", "stock", "Ask a shop to count its stock", "act"),
  r("stock.record_count", "stock", "Record a shop's stock count", "act"),
  r("stock.record_supplier_lines", "stock", "Record stock a shop bought from another supplier", "act"),
  r("stock.draft_restock", "stock", "Draft a restock order", "act_if_preapproved"),
  r("credit.ask_shelf_photo", "credit", "Ask a shop for a shelf photo", "act"),
  r("credit.suggest_limit", "credit", "Suggest a credit limit for you to decide", "ask"),
  r("proof.record_payment", "proof", "Record a checked payment proof", "act"),
  r("proof.flag_payment", "proof", "Flag a payment proof that looks wrong", "ask"),
  r("brand.send_email", "brand", "Email a brand or bank", "ask"),
  r("plan.raise_allowance", "mimi", "Raise today's model allowance", "ask"),
  r("payment.move_money", "all", "Move money (pay, send, refund)", "never", true),
  r("bank.change_details", "all", "Change bank details", "never", true),
  r("credit.set_limit", "credit", "Set or change a credit limit", "never", true),
  r("debt.change_terms", "collector", "Write off debt, change an amount, extend a due date or give a discount", "never", true),
  r("account.ask_pin_or_otp", "all", "Ask anyone for a PIN or OTP", "never", true),
  r("account.change_password_or_key", "all", "Change a password or key", "never", true),
  r("shop.delete_data", "all", "Delete a shop's data", "never", true),
];

/** The groups the screen shows, in order, with plain headings. */
export const policyGroups: { key: string; title: string; sub: string }[] = [
  { key: "act", title: "Does on her own", sub: "Mimi just does these and you see them in the thread." },
  { key: "act_if_preapproved", title: "Does once you've said yes before", sub: "The first time, she asks. After that she goes ahead for the same shop." },
  { key: "ask", title: "Asks you first", sub: "Nothing happens until you approve." },
  { key: "hand_off", title: "Hands to you", sub: "She stops and passes it to you." },
  { key: "never", title: "Never does", sub: "Built in. No message, rule or setting can change these." },
];

import { supabase } from "@/integrations/supabase/client";

/** Find or create the conversation between the signed-in brand and a creator. */
export async function openConversation(businessId: string, creatorId: string): Promise<string> {
  const existing = await supabase
    .from("conversations")
    .select("id")
    .eq("business_id", businessId)
    .eq("creator_id", creatorId)
    .maybeSingle();
  if (existing.data) return existing.data.id;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ business_id: businessId, creator_id: creatorId, creator_user_id: businessId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

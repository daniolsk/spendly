import "server-only";
import { getTranslator, toLanguage } from "@/lib/i18n";
import { requireUser } from "./dal";
import { getSettings } from "./queries";

/** Translator in the signed-in user's language, for server components, metadata and actions. */
export async function getT() {
  const user = await requireUser();
  const settings = await getSettings(user.id);
  return getTranslator(toLanguage(settings.language));
}

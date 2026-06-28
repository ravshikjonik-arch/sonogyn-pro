import { useEffect, useState } from "react";

import {
  loadDiscussionChannels,
  type DiscussionChannel,
} from "../lib/chat/loadDiscussionChannels";
import { supabaseMobile } from "../lib/supabase/mobileClient";

export function useDiscussionChannels(): {
  channels: DiscussionChannel[];
  loading: boolean;
} {
  const [channels, setChannels] = useState<DiscussionChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseMobile) {
      setChannels([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void loadDiscussionChannels(supabaseMobile)
      .then((rows) => {
        if (!cancelled) setChannels(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { channels, loading };
}

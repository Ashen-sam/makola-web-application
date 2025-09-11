"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { supabase } from "@/lib/supabaseClient";
import { issuesApi } from "@/services/issues";

export function useIssueRealtime() {
  const dispatch = useDispatch();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-issues-and-comments")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "issues" },
        (payload) => {
          console.log("Issue updated:", payload.new);

          // Refetch issues so residents see new status
          dispatch(issuesApi.util.invalidateTags(["Issues"]));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          console.log("New comment added:", payload.new);

          // Invalidate comments for the specific issue
          const issueId = payload.new.issue_id;
          dispatch(
            issuesApi.util.invalidateTags([
              "Comments",
              { type: "Comments", id: `issue-${issueId}` },
              { type: "Issues", id: issueId },
            ])
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "comments" },
        (payload) => {
          console.log("Comment updated:", payload.new);

          // Invalidate comments for the specific issue
          const issueId = payload.new.issue_id;
          dispatch(
            issuesApi.util.invalidateTags([
              "Comments",
              { type: "Comments", id: `issue-${issueId}` },
              { type: "Issues", id: issueId },
            ])
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments" },
        (payload) => {
          console.log("Comment deleted:", payload.old);

          // Invalidate comments for the specific issue
          const issueId = payload.old.issue_id;
          dispatch(
            issuesApi.util.invalidateTags([
              "Comments",
              { type: "Comments", id: `issue-${issueId}` },
              { type: "Issues", id: issueId },
            ])
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch]);
}

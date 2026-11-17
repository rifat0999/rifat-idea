import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, MoreHorizontal, ShieldCheck, ShieldOff } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  adminKeys,
  errorText,
  FilterSelect,
  ListSkeleton,
  SearchBox,
  useAdminDirectory,
} from "@/components/admin/admin-shared";
import { CreatorAvatar, EmptyState, VerificationBadge } from "@/components/brand/bits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import type { AppRole } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Users | BrandLinks admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminUsers,
});

type RoleFilter = "all" | AppRole | "none";

function AdminUsers() {
  const { t, lang } = useI18n();
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [confirm, setConfirm] = useState<{ id: string; name: string; enable: boolean } | null>(null);

  const users = useQuery({
    queryKey: adminKeys.users,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return data ?? [];
    },
  });
  const directory = useAdminDirectory();

  const setAdmin = useMutation({
    mutationFn: async ({ id, enable }: { id: string; enable: boolean }) => {
      const { error } = await supabase.rpc("admin_set_admin", { _user_id: id, _enabled: enable });
      if (error) throw error;
      return enable;
    },
    onSuccess: (enable) => {
      toast.success(enable ? t("adm.adminGranted") : t("adm.adminRemoved"));
      qc.invalidateQueries({ queryKey: adminKeys.users });
    },
    onError: (e) => toast.error(errorText(e)),
    onSettled: () => setConfirm(null),
  });

  const updateCreator = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { is_published?: boolean; is_featured?: boolean } }) => {
      const { error } = await supabase.from("creator_profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("adm.updated"));
      qc.invalidateQueries({ queryKey: adminKeys.directory });
    },
    onError: (e) => toast.error(errorText(e)),
  });

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (users.data ?? [])
      .map((u) => {
        const creator = directory.data?.creatorsByUser.get(u.id);
        const business = directory.data?.businessesByUser.get(u.id);
        const name = business?.company_name ?? creator?.display_name ?? u.full_name ?? u.email;
        return { ...u, creator, business, name };
      })
      .filter((u) => {
        if (role === "none" && u.roles.length > 0) return false;
        if (role !== "all" && role !== "none" && !u.roles.includes(role)) return false;
        if (!term) return true;
        return [u.name, u.email, u.full_name].some((v) => v?.toLowerCase().includes(term));
      });
  }, [users.data, directory.data, q, role]);

  const roleLabel = (r: AppRole) => t(`adm.role.${r}` as const);

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">{t("adm.usersSub")}</p>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchBox value={q} onChange={setQ} placeholder={t("adm.searchUsers")} />
        <FilterSelect<RoleFilter>
          value={role}
          onChange={setRole}
          label={t("adm.type")}
          options={[
            { value: "all", label: t("adm.all") },
            { value: "business", label: roleLabel("business") },
            { value: "creator", label: roleLabel("creator") },
            { value: "admin", label: roleLabel("admin") },
            { value: "none", label: t("adm.noType") },
          ]}
        />
      </div>

      {users.error && <p className="mb-4 text-sm text-destructive">{errorText(users.error)}</p>}
      {users.isLoading ? (
        <ListSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title={t("common.none")} />
      ) : (
        <div className="surface-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("adm.user")}</TableHead>
                <TableHead>{t("adm.type")}</TableHead>
                <TableHead>{t("adm.verification")}</TableHead>
                <TableHead className="whitespace-nowrap">{t("adm.published")}</TableHead>
                <TableHead className="whitespace-nowrap">{t("adm.featured")}</TableHead>
                <TableHead className="whitespace-nowrap">{t("adm.joined")}</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">{t("common.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => {
                const isAdmin = u.roles.includes("admin");
                const verification = u.creator?.verification_status ?? u.business?.verification_status;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex min-w-52 items-center gap-3">
                        <CreatorAvatar
                          name={u.name}
                          src={u.creator?.avatar_url ?? u.business?.logo_url}
                          className="size-9"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <Badge variant="muted">{t("adm.noType")}</Badge>
                        ) : (
                          u.roles.map((r) => (
                            <Badge key={r} variant={r === "admin" ? "default" : "soft"}>
                              {roleLabel(r)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{verification ? <VerificationBadge status={verification} /> : "—"}</TableCell>
                    <TableCell>
                      {u.creator ? (
                        <Switch
                          checked={u.creator.is_published}
                          aria-label={`${t("adm.published")}: ${u.name}`}
                          onCheckedChange={(v) =>
                            updateCreator.mutate({ id: u.creator!.id, patch: { is_published: v } })
                          }
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.creator ? (
                        <Switch
                          checked={u.creator.is_featured}
                          aria-label={`${t("adm.featured")}: ${u.name}`}
                          onCheckedChange={(v) =>
                            updateCreator.mutate({ id: u.creator!.id, patch: { is_featured: v } })
                          }
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(u.created_at, lang)}
                      <p className="text-xs">
                        {t("adm.lastSeen")}: {formatDate(u.last_sign_in_at, lang)}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`${t("common.actions")}: ${u.name}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {u.creator && (
                            <DropdownMenuItem asChild>
                              <Link to="/influencers/$slug" params={{ slug: u.creator.slug }}>
                                <ExternalLink /> {t("adm.viewProfile")}
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {isAdmin ? (
                            <DropdownMenuItem
                              disabled={u.id === me?.id}
                              onSelect={() => setConfirm({ id: u.id, name: u.name, enable: false })}
                            >
                              <ShieldOff /> {t("adm.removeAdmin")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onSelect={() => setConfirm({ id: u.id, name: u.name, enable: true })}>
                              <ShieldCheck /> {t("adm.makeAdmin")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.enable ? t("adm.makeAdmin") : t("adm.removeAdmin")}: {confirm?.name}
            </AlertDialogTitle>
            {confirm?.enable && <AlertDialogDescription>{t("adm.adminConfirm")}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={setAdmin.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (confirm) setAdmin.mutate({ id: confirm.id, enable: confirm.enable });
              }}
            >
              {confirm?.enable ? t("adm.makeAdmin") : t("adm.removeAdmin")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-server";

async function getAuthorizedAdmin(request: Request) {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return { response: Response.json({ error: "Admin API is not configured." }, { status: 503 }) };
  }

  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.match(/^Bearer (.+)$/i)?.[1];

  if (!accessToken) {
    return { response: Response.json({ error: "Authentication required." }, { status: 401 }) };
  }

  const { data: { user }, error: authError } =
    await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return { response: Response.json({ error: "Authentication required." }, { status: 401 }) };
  }

  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError) {
    console.error("Failed to verify admin role:", roleError);
    return { response: Response.json({ error: "Unable to verify admin access." }, { status: 500 }) };
  }

  if (!role) {
    return { response: Response.json({ error: "Admin access required." }, { status: 403 }) };
  }

  return { supabase, user };
}

function isDisabled(user: User) {
  return Boolean(
    user.banned_until &&
      new Date(user.banned_until).getTime() > Date.now()
  );
}

export async function GET(request: Request) {
  const authorization = await getAuthorizedAdmin(request);
  if ("response" in authorization) return authorization.response;

  const users: User[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await authorization.supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      console.error("Failed to list users:", error);
      return Response.json({ error: "Unable to load users." }, { status: 500 });
    }

    users.push(...data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }

  return Response.json({
    users: users.map((user) => ({
      id: user.id,
      email: user.email ?? "(no email)",
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      disabled: isDisabled(user),
    })),
  });
}

export async function PATCH(request: Request) {
  const authorization = await getAuthorizedAdmin(request);
  if ("response" in authorization) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("userId" in body) ||
    typeof body.userId !== "string" ||
    !("enabled" in body) ||
    typeof body.enabled !== "boolean"
  ) {
    return Response.json({ error: "A userId and enabled value are required." }, { status: 400 });
  }

  if (body.userId === authorization.user.id) {
    return Response.json({ error: "You cannot disable your own account." }, { status: 409 });
  }

  const { data: targetRole, error: targetRoleError } =
    await authorization.supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", body.userId)
      .eq("role", "admin")
      .maybeSingle();

  if (targetRoleError) {
    console.error("Failed to verify target account role:", targetRoleError);
    return Response.json({ error: "Unable to verify target account." }, { status: 500 });
  }

  if (targetRole) {
    return Response.json({ error: "Admin accounts cannot be disabled here." }, { status: 409 });
  }

  const { error } = await authorization.supabase.auth.admin.updateUserById(
    body.userId,
    { ban_duration: body.enabled ? "none" : "876000h" }
  );

  if (error) {
    console.error("Failed to update user status:", error);
    return Response.json({ error: "Unable to update account status." }, { status: 500 });
  }

  return Response.json({ success: true });
}

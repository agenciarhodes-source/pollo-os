"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

/** O login visto do navegador: entrar, criar conta, sair e trocar de empresa. */
export const authClient = createAuthClient({ plugins: [organizationClient()] });

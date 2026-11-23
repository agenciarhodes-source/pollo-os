import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

// O jsdom não tem estas APIs do navegador, que a interface usa.
if (typeof Element !== "undefined") Element.prototype.scrollIntoView = vi.fn();

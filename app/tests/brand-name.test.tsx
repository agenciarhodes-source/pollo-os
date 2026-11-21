import { afterAll, afterEach, beforeAll, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { cleanup, render } from "@testing-library/react";
import { BrandName } from "@/components/edition/brand-name";

/**
 * Pollo OS's brand marks carry the trademark sign the way open.bot sets it: a small superscript the
 * screen reader skips, so the name is read once and plainly. Any other name stays as it is.
 */

beforeAll(() => GlobalRegistrator.register({ url: "http://localhost/" }));
afterEach(cleanup);
afterAll(async () => {
  await GlobalRegistrator.unregister();
});

function drawLink(name: string) {
  return render(
    <a href="/">
      <BrandName>{name}</BrandName>
    </a>,
  );
}

test.each(["Pollo OS", "Pollo OS for Business"])(
  "%s is drawn with a superscript trademark sign that is not read aloud",
  (name) => {
    const view = drawLink(name);
    const link = view.getByRole("link", { name });
    expect(link.textContent).toBe(`${name}™`);
    const sign = link.querySelector("sup");
    expect(sign?.textContent).toBe("™");
    expect(sign?.getAttribute("aria-hidden")).toBe("true");
  },
);

test.each(["Acme Assistant", "Pollo OS is ready", "Bots"])(
  "%s is drawn as it is, with no trademark sign",
  (name) => {
    const view = drawLink(name);
    const link = view.getByRole("link", { name });
    expect(link.textContent).toBe(name);
    expect(link.querySelector("sup")).toBeNull();
  },
);

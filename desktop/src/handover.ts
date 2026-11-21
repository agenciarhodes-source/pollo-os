/**
 * The window becoming Pollo OS after a Start.
 *
 * `show_openbot` sends the window to Pollo OS's own page, and the setup page stays on screen until
 * that page replaces it: a second or two, more after an update, when Pollo OS's page loads for the
 * first time on its new release. Starting stays on screen meanwhile, as it was. On Windows I the
 * window said "Pollo OS is running", with Show Pollo OS and Stop Pollo OS, for about five seconds
 * between Starting and Pollo OS's home.
 *
 * `holdMs`: how long Starting stays once the window was sent to Pollo OS. A page that is still here
 * after that was never replaced, and the running screen says so, with Show Pollo OS to try again.
 * Tests that are about the running screen itself shorten it.
 */
export const handover = { holdMs: 20_000 };

import {
  IconDeviceLaptop,
  IconLogout,
  IconPlugConnected,
} from "@tabler/icons-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageRows, PageSection } from "@/components/layout/page-shell";
import { RowMark } from "@/components/layout/row-mark";
import {
  LogsRow,
  VersionRow,
} from "@/components/settings/this-computer-sections";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import {
  changeConnectionMutationOptions,
  signOutOfConnectedOpenBotMutationOptions,
} from "@/lib/desktop/mutations";
import { desktopStatusQueryOptions } from "@/lib/desktop/queries";
import { COMPUTER_SECTION } from "@/lib/settings/computer-sections";

/** The address's host, which is how a person names the Pollo OS they connect to. */
function hostOf(address: string): string {
  try {
    return new URL(address).host;
  } catch {
    return address;
  }
}

/**
 * Settings → Computer inside an Pollo OS Desktop that is connected to an Pollo OS running somewhere
 * else: where it is connected, the two ways out, and the app's own details.
 *
 * It takes the place of `ThisComputerSections`. Nothing of Pollo OS runs on this computer then, so
 * there are no services to restart or stop, no memory to report and no install folder. The app's
 * version, its updates and its log folder are about the app, and stay.
 *
 * Both ways out end with the window back at setup, so this page goes with them, as it does on Stop.
 */
export function ConnectionSections({ address }: { address: string }) {
  const status = useQuery(desktopStatusQueryOptions({ memory: false }));
  return (
    <>
      <PageSection id={COMPUTER_SECTION.thisComputer} title="Connection">
        <PageRows>
          <Item size="sm">
            <RowMark>
              <IconPlugConnected className="size-4" />
            </RowMark>
            <ItemContent>
              <ItemTitle>Connected to</ItemTitle>
              <ItemDescription className="line-clamp-none break-all">
                {address}
              </ItemDescription>
            </ItemContent>
          </Item>
          <Separator />
          <SignOutRow host={hostOf(address)} />
          <Separator />
          <UseThisComputerRow host={hostOf(address)} />
        </PageRows>
      </PageSection>
      {status.data && (
        <PageSection title="Details">
          <PageRows>
            {status.data.logFolder && (
              <>
                <LogsRow folder={status.data.logFolder} />
                <Separator />
              </>
            )}
            <VersionRow status={status.data} />
          </PageRows>
        </PageSection>
      )}
    </>
  );
}

function SignOutRow({ host }: { host: string }) {
  const [open, setOpen] = useState(false);
  const signOut = useMutation(signOutOfConnectedOpenBotMutationOptions());
  // On success the desktop app is showing setup, and this page goes with it.
  const leaving = signOut.isPending || signOut.isSuccess;
  return (
    <>
      <Item size="sm">
        <RowMark>
          <IconLogout className="size-4" />
        </RowMark>
        <ItemContent>
          <ItemTitle>Sign out</ItemTitle>
          <ItemDescription className="line-clamp-none">
            Sign out of this Pollo OS on this computer.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button onClick={() => setOpen(true)} size="sm" variant="outline">
            Sign out
          </Button>
        </ItemActions>
      </Item>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out of {host}?</DialogTitle>
            <DialogDescription>
              You'll sign in again in your browser the next time you use Pollo OS
              here. Your Bots and conversations stay as they are.
            </DialogDescription>
          </DialogHeader>
          {signOut.error ? (
            <DialogBody className="mt-4 text-sm">
              <p className="text-destructive" role="alert">
                Couldn't sign out. Try again.
              </p>
            </DialogBody>
          ) : null}
          <DialogFooter className="mt-4">
            <Button onClick={() => setOpen(false)} size="sm" variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={leaving}
              onClick={() => signOut.mutate()}
              size="sm"
            >
              {leaving ? "Signing out…" : "Sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Settings → Computer inside an Pollo OS Desktop that runs Pollo OS on this computer: the way to
 * connect to an Pollo OS that runs somewhere else instead. Drawn under `ThisComputerSections`, and
 * only by a desktop app that can connect.
 *
 * It stops Pollo OS here, as Stop does, and the window shows setup at the choice of where Pollo OS
 * runs. This page goes with it.
 */
export function ConnectInsteadSection() {
  const [open, setOpen] = useState(false);
  const change = useMutation(changeConnectionMutationOptions());
  const leaving = change.isPending || change.isSuccess;
  return (
    <PageSection title="Connection">
      <PageRows>
        <Item size="sm">
          <RowMark>
            <IconDeviceLaptop className="size-4" />
          </RowMark>
          <ItemContent>
            <ItemTitle>Pollo OS runs on this computer</ItemTitle>
            <ItemDescription className="line-clamp-none">
              You can connect to an Pollo OS your company runs instead.
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button onClick={() => setOpen(true)} size="sm" variant="outline">
              Connect to an Pollo OS
            </Button>
          </ItemActions>
        </Item>
      </PageRows>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to an Pollo OS instead?</DialogTitle>
            <DialogDescription>
              Pollo OS stops on this computer and setup opens, where you type the
              address of the Pollo OS to connect to. Nothing on this computer is
              lost, and you can come back to it later.
            </DialogDescription>
          </DialogHeader>
          {change.error ? (
            <DialogBody className="mt-4 text-sm">
              <p className="text-destructive" role="alert">
                Couldn't open setup. Try again.
              </p>
            </DialogBody>
          ) : null}
          <DialogFooter className="mt-4">
            <Button onClick={() => setOpen(false)} size="sm" variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={leaving}
              onClick={() => change.mutate()}
              size="sm"
            >
              {leaving ? "Stopping Pollo OS…" : "Stop and open setup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageSection>
  );
}

function UseThisComputerRow({ host }: { host: string }) {
  const [open, setOpen] = useState(false);
  const change = useMutation(changeConnectionMutationOptions());
  // On success the desktop app is showing setup, and this page goes with it.
  const leaving = change.isPending || change.isSuccess;
  return (
    <>
      <Item size="sm">
        <RowMark>
          <IconDeviceLaptop className="size-4" />
        </RowMark>
        <ItemContent>
          <ItemTitle>Use Pollo OS on this computer instead</ItemTitle>
          <ItemDescription className="line-clamp-none">
            Run every part of Pollo OS on this computer.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button onClick={() => setOpen(true)} size="sm" variant="outline">
            Use this computer
          </Button>
        </ItemActions>
      </Item>
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Pollo OS on this computer instead?</DialogTitle>
            <DialogDescription>
              This signs you out of {host} and opens setup, where you choose
              where Pollo OS runs. Nothing on this computer is lost, and you can
              connect to {host} again later.
            </DialogDescription>
          </DialogHeader>
          {change.error ? (
            <DialogBody className="mt-4 text-sm">
              <p className="text-destructive" role="alert">
                Couldn't open setup. Try again.
              </p>
            </DialogBody>
          ) : null}
          <DialogFooter className="mt-4">
            <Button onClick={() => setOpen(false)} size="sm" variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={leaving}
              onClick={() => change.mutate()}
              size="sm"
            >
              {leaving ? "Opening setup…" : "Switch to this computer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

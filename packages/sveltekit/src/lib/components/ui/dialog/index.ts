import { Dialog as DialogPrimitive } from "bits-ui";
import DialogContent from "./dialog-content.svelte";
import DialogDescription from "./dialog-description.svelte";
import DialogFooter from "./dialog-footer.svelte";
import DialogHeader from "./dialog-header.svelte";
import DialogTitle from "./dialog-title.svelte";
import DialogOverlay from "./dialog-overlay.svelte";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;
const DialogPortal = DialogPrimitive.Portal;

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};

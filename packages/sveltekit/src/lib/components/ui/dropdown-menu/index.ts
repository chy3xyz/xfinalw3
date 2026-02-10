import DropdownMenuRoot from "./dropdown-menu.svelte";
import DropdownMenuTrigger from "./dropdown-menu-trigger.svelte";
import DropdownMenuContent from "./dropdown-menu-content.svelte";
import DropdownMenuItem from "./dropdown-menu-item.svelte";
import DropdownMenuSeparator from "./dropdown-menu-separator.svelte";

export {
	DropdownMenuRoot as Root,
	DropdownMenuTrigger as Trigger,
	DropdownMenuContent as Content,
	DropdownMenuItem as Item,
	DropdownMenuSeparator as Separator,
};

export const DropdownMenu = {
	Root: DropdownMenuRoot,
	Trigger: DropdownMenuTrigger,
	Content: DropdownMenuContent,
	Item: DropdownMenuItem,
	Separator: DropdownMenuSeparator,
};


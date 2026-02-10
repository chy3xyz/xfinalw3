import { tv, type VariantProps } from "tailwind-variants";

export const alertVariants = tv({
	base: "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
	variants: {
		variant: {
			default: "bg-background text-foreground",
			destructive:
				"border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
			success:
				"border-green-500/50 text-green-600 dark:border-green-500 [&>svg]:text-green-600",
			warning:
				"border-yellow-500/50 text-yellow-600 dark:border-yellow-500 [&>svg]:text-yellow-600",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

export type AlertVariant = VariantProps<typeof alertVariants>["variant"];

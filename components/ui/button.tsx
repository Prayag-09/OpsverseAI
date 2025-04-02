import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
				destructive:
					'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
				outline:
					'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
				secondary:
					'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
				ghost:
					'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-9 px-4 py-2 has-[>svg]:px-3',
				sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-sm',
				xs: 'h-7 rounded-sm px-2 has-[>svg]:px-1.5 text-xs',
				lg: 'h-10 rounded-md px-6 has-[>svg]:px-4 text-base',
				xl: 'h-12 rounded-lg px-8 has-[>svg]:px-6 text-lg',
				'2xl': 'h-14 rounded-xl px-10 has-[>svg]:px-8 text-xl',
				'3xl': 'h-16 rounded-2xl px-12 has-[>svg]:px-10 text-2xl',
				'4xl': 'h-20 rounded-3xl px-16 has-[>svg]:px-12 text-3xl',
				icon: 'size-9',
				iconSm: 'size-7',
				iconLg: 'size-11',
				iconXl: 'size-14',
				icon2xl: 'size-16',
				block: 'w-full h-10 px-6 py-3 rounded-md text-center',
				blockLg: 'w-full h-12 px-8 py-4 rounded-lg text-lg',
				blockXl: 'w-full h-14 px-10 py-5 rounded-xl text-xl',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : 'button';

	return (
		<Comp
			data-slot='button'
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };

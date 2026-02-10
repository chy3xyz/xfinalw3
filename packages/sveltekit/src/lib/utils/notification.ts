import { writable } from 'svelte/store';

export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type ToastStatus = 'success' | 'info' | 'loading' | 'error' | 'warning';

export type Toast = {
	id: string;
	content: string | { message: string; blockExplorerLink?: string };
	status: ToastStatus;
	duration?: number;
	icon?: string;
	position?: ToastPosition;
	visible: boolean;
};

type NotificationOptions = {
	duration?: number;
	icon?: string;
	position?: ToastPosition;
};

const DEFAULT_DURATION = 3000;
const DEFAULT_POSITION: ToastPosition = 'top-center';

// Toast store
const toasts = writable<Toast[]>([]);

// Generate unique ID
let toastIdCounter = 0;
const generateId = () => `toast-${++toastIdCounter}`;

// Helper to create toast
const createToast = (
	content: string | { message: string; blockExplorerLink?: string },
	status: ToastStatus,
	options?: NotificationOptions,
): string => {
	const id = generateId();
	const toast: Toast = {
		id,
		content,
		status,
		duration: status === 'loading' ? Infinity : options?.duration ?? DEFAULT_DURATION,
		icon: options?.icon,
		position: options?.position ?? DEFAULT_POSITION,
		visible: true,
	};

	toasts.update((current) => [...current, toast]);

	// Auto remove if not loading
	if (status !== 'loading' && toast.duration !== Infinity) {
		setTimeout(() => {
			removeToast(id);
		}, toast.duration);
	}

	return id;
};

// Remove toast
const removeToast = (id: string) => {
	toasts.update((current) => current.filter((t) => t.id !== id));
};

// Notification API
export const notification = {
	success: (content: string | { message: string; blockExplorerLink?: string }, options?: NotificationOptions) => {
		return createToast(content, 'success', options);
	},
	info: (content: string | { message: string; blockExplorerLink?: string }, options?: NotificationOptions) => {
		return createToast(content, 'info', options);
	},
	warning: (content: string | { message: string; blockExplorerLink?: string }, options?: NotificationOptions) => {
		return createToast(content, 'warning', options);
	},
	error: (content: string | { message: string; blockExplorerLink?: string }, options?: NotificationOptions) => {
		return createToast(content, 'error', options);
	},
	loading: (content: string | { message: string; blockExplorerLink?: string }, options?: NotificationOptions) => {
		return createToast(content, 'loading', options);
	},
	remove: (toastId: string) => {
		removeToast(toastId);
	},
};

// Export toast store for components
export { toasts };

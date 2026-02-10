// To be used in JSON.stringify when a field might be bigint

// https://wagmi.sh/react/faq#bigint-serialization
export const replacer = (_key: string, value: unknown) => (typeof value === "bigint" ? value.toString() : value);

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const isZeroAddress = (address: string) => address === ZERO_ADDRESS;

// Treat any dot-separated string as a potential ENS name
const ensRegex = /.+\..+/;
export const isENS = (address = "") => ensRegex.test(address);

/**
 * Copy text to clipboard
 * @param text - text to copy
 * @returns Promise that resolves when copy is complete
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy text:", err);
    return false;
  }
}

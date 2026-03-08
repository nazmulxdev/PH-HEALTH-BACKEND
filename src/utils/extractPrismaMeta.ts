/* eslint-disable @typescript-eslint/no-explicit-any */
const extractPrismaMeta = (meta: any): string => {
  if (meta?.target) {
    return Array.isArray(meta.target) ? meta.target.join(", ") : meta.target;
  }

  const cause = meta?.driverAdapterError?.cause;
  if (cause) {
    if (Array.isArray(cause?.constraint?.fields)) {
      return cause.constraint.fields
        .map((f: string) => f.replace(/"/g, ""))
        .join(", ");
    }

    const originalMessage = cause?.originalMessage as string | undefined;
    if (originalMessage) {
      const keyMatch = originalMessage.match(/"[^"]*_([^_"]+)_key"/);
      if (keyMatch?.[1]) return keyMatch[1];

      const quoteMatch = originalMessage.match(/"([^"]+)"[^"]*$/);
      if (quoteMatch?.[1]) return quoteMatch[1].replace(/_key$/, "");
    }
  }

  return "unknown field";
};

export default extractPrismaMeta;

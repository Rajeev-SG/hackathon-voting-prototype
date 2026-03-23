import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const Breadcrumb = ({ ...props }: React.ComponentProps<"nav">) => <nav aria-label="breadcrumb" {...props} />;

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentProps<"ol">>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn("flex flex-wrap items-center gap-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn("inline-flex items-center gap-2", className)} {...props} />
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a">>(
  ({ className, ...props }, ref) => <a ref={ref} className={cn("transition-colors hover:text-primary", className)} {...props} />
);
BreadcrumbLink.displayName = "BreadcrumbLink";

function BreadcrumbSeparator({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span aria-hidden="true" className={cn("text-muted-foreground", className)} {...props}>
      <ChevronRight className="h-4 w-4" />
    </span>
  );
}

export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator };

"use client";

import * as React from "react";

export const Table = React.forwardRef<
  HTMLTableElement,
  React.TableHTMLAttributes<HTMLTableElement> & { children: React.ReactNode }
>(({ className, ...props }, ref) => (
  <div className={`rounded-md border ${className || ""}`}>
    <table ref={ref} className="w-full caption-bottom text-sm" {...props} />
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & { children: React.ReactNode }
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={`bg-muted text-muted-foreground ${className || ""}`} {...props} />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & { children: React.ReactNode }
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={className} {...props} />
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { children: React.ReactNode }
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={`border-b last:border-0 hover:bg-muted/50 ${className || ""}`}
    {...props}
  />
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={`h-12 px-4 text-left align-middle font-medium ${className || ""}`}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={`px-4 py-2 align-middle ${className || ""}`}
    {...props}
  />
));
TableCell.displayName = "TableCell";

---
name: public-blog-pagination
description: Shared URL and page-size rules for public blog pagination
type: decision
---

**Why**

Public blog lists use the `animal-island-ui` Pagination component as a controlled component. Page and page-size state must remain consistent across server rendering, client fetching, refreshes, and browser history.

**How to apply**

- Store the current page in the `page` query parameter and non-default page size in `pageSize`.
- Use `src/lib/pagination.ts` to parse values and build pagination URLs; do not pass arbitrary query values directly to list APIs.
- The home feed uses page sizes `9/18/36`; search, category, and tag lists use `10/20/50`.
- Render the shared wrapper in `src/components/blog/pagination.tsx`, which enables the teal variant, total count, size changer, and quick jumper.

**Related**

[[frontend-node26-tailwind-warning]]

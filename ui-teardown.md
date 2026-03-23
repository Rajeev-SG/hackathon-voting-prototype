# UI Teardown: Hackathon Voting App

| Screen Name | Feature / Section | Specific UI Element | Shadcn UI Component(s) | Composition Notes / Tailwind Fallback |
| :--- | :--- | :--- | :--- | :--- |
| **@project-screen** | Top Navigation Bar | Nav Links | `NavigationMenu` | Can also use standard anchor tags with hover transition. |
| **@project-screen** | Top Navigation Bar | Profile Button | `Button` | Standard solid button styling. |
| **@project-screen** | Top Navigation Bar | User Avatar | `Avatar`, `AvatarImage`, `AvatarFallback` | Wrapped in a rounded-full div with border. |
| **@project-screen** | Breadcrumbs | Breadcrumb Trail | `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbSeparator` | Use standard Shadcn primitive with chevron icons. |
| **@project-screen** | Hero Section | "Back to Directory" Button | `Button` | `variant="outline"`, backdrop-blur and border applied via Tailwind. |
| **@project-screen** | Details Section | Tech Stack Tags | `Badge` | `variant="secondary"`, custom background/text color classes. |
| **@project-screen** | Details Section | GitHub & Demo Links | `Button` | Standard button with Material Symbols icon flex row. |
| **@project-screen** | Metadata Card | Card Container | `Card`, `CardHeader`, `CardTitle`, `CardContent` | Wraps the entire right-side metadata sticky section. |
| **@project-screen** | Metadata Card | Submission Status | `Badge` | Can be composed of flex row or a native Badge. |
| **@project-screen** | Metadata Card | Team Member Avatars | `Avatar`, `AvatarImage`, `AvatarFallback` | Grouped in a flex column layout. |
| **@project-screen** | Metadata Card | Map Overlay Badge | `Badge` | Absolutely positioned over the map image. |
| **@scoring-screen** | Top Navigation Bar | Back Button | `Button` | `variant="ghost"`, `size="icon"`. |
| **@scoring-screen** | Top Navigation Bar | Sync Status | `Badge` | `variant="outline"` with a standard Tailwind green dot indicator div. |
| **@scoring-screen** | Project Snapshot | Track/Tech Tags | `Badge` | Custom rounded full borders and bg opacities. |
| **@scoring-screen** | Rubric Card | Card Container | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` | Standard card setup with border utilities. |
| **@scoring-screen** | Rubric Card | Score Selector (1-5) | `ToggleGroup`, `ToggleGroupItem` | Use toggle group for single selection state, styled as large square elements. |
| **@scoring-screen** | Rubric Card | "What Good Looks Like" | `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` | Replaces the native `<details>` HTML tag for accessible expandable content. |
| **@scoring-screen** | Notes Section | Note Input | `Input` | `variant="ghost"`, remove borders except bottom via Tailwind `border-b`. |
| **@scoring-screen** | Notes Section | Quick Note Chips | `Button` | `variant="outline"`, `size="sm"`, custom rounded-full shape. |
| **@scoring-screen** | Bottom Bar | Progress Indicator | `Progress` | Wrapped in a custom narrow div to represent judging progress. |
| **@scoring-screen** | Bottom Bar | Action Buttons | `Button` | Park (`variant="ghost"`), Submit Score (`variant="default"`). |
| **@all-projects-screen** | Header | Nav Links | `NavigationMenu` | Standard inline navigation menu. |
| **@all-projects-screen** | Header | Theme/Profile Buttons | `Button` | `variant="ghost"`, `size="icon"`. |
| **@all-projects-screen** | Title Section | Export CSV Button | `Button` | `variant="secondary"`. |
| **@all-projects-screen** | Title Section | Finish Judging Button | `Button` | `variant="default"` with primary shadow. |
| **@all-projects-screen** | Filter Bar | Search Input | `Input` | Placed inside a relative wrapper with absolute positioned search icon. |
| **@all-projects-screen** | Filter Bar | Filter Dropdowns | `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` | Used for selecting tracks and tech stack options. |
| **@all-projects-screen** | Tabs & View | Status Tabs | `Tabs`, `TabsList`, `TabsTrigger` | Standard Shadcn Tabs structure. |
| **@all-projects-screen** | Tabs & View | View Toggle | `ToggleGroup`, `ToggleGroupItem` | Switch between Grid/List view options. |
| **@all-projects-screen** | Project Card | Card Container | `Card`, `CardContent` | Standard hover scale, inner gradient, and shadow utilities. |
| **@all-projects-screen** | Project Card | Booth & Track Badges | `Badge` | Small customized text sizing and border-radius. |
| **@all-projects-screen** | Project Card | Progress/Score Bar | `Progress` | Custom thin height progress bar implementation. |
| **@all-projects-screen** | Project Card | Action Button | `Button` | Dynamic variants based on project status (View/Start/Continue). |
| **@all-projects-screen** | Pagination | Page Controls | `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext` | Standard pagination composition. |
| **@asset-upload-screen** | Header | Save Progress Button | `Button` | `variant="default"`. |
| **@asset-upload-screen** | Header | Profile Icon | `Avatar`, `AvatarFallback` | Used without image for fallback icon rendering. |
| **@asset-upload-screen** | Hero Image | Required Label | `Badge` | `variant="secondary"`, colored. |
| **@asset-upload-screen** | Hero Image | File Drop Zone | None | Wrap `react-dropzone` in standard Tailwind dashed border div. No native dropzone in Shadcn. |
| **@asset-upload-screen** | Video Demo | Link Input | `Input` | Standard input wrapped in a div with an absolute left icon. |
| **@asset-upload-screen** | Screenshot Gallery | Add Image Box | `Button` or None | Large square div with dashed borders, hover states to mimic a button. |
| **@asset-upload-screen** | Screenshot Gallery | Image Overlays | `Button` | `variant="secondary"`, `size="icon"` over a relative positioned standard `img` tag. |
| **@asset-upload-screen** | Judge's View | Mockup Skeletons | `Skeleton` | Used to simulate missing image blocks and text lines. |
| **@asset-upload-screen** | Judge's View | Visual Readiness Bar | `Progress` | Displaying form completion percentage for Hero Presence/Demo Depth. |
| **@asset-upload-screen** | Judge's View | Judge's Tip | `Alert`, `AlertTitle`, `AlertDescription` | Styled with primary color border/background. |
| **@asset-upload-screen** | Judge's View | Live Preview Link | `Button` | `variant="outline"`, full width. |
| **@dashboard-results-screen** | Header | Search Input | `Input` | Standard input without outline, inside a rounded-xl container. |
| **@dashboard-results-screen** | Header | Theme/Avatar | `Button`, `Avatar` | Icon button and standard avatar. |
| **@dashboard-results-screen** | Sidebar | Nav Links | `Button` | `variant="ghost"`, stacked vertically with active state backgrounds. |
| **@dashboard-results-screen** | Sidebar | Judging Status Box | `Card`, `CardHeader`, `CardContent` | Contains metrics and the progress visual. |
| **@dashboard-results-screen** | Sidebar | Overall Progress Bar | `Progress` | 100% completion state implementation. |
| **@dashboard-results-screen** | Main Content | Export / Finalize | `Button` | Top right primary layout actions. |
| **@dashboard-results-screen** | Tie-Break Alert | Alert Cards | `Card`, `CardContent` | Composed as amber warning cards side-by-side. |
| **@dashboard-results-screen** | Tie-Break Alert | Resolve Button | `Button` | Custom amber background utility classes. |
| **@dashboard-results-screen** | Scoreboard | Results Table | `DataTable` (TanStack), `Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell` | Sorting/Filtering buttons present; implies dynamic data table implementation rather than static `Table`. |
| **@dashboard-results-screen** | Scoreboard | Table Images | `Avatar` or `img` | Small thumbnail images for each project row. |
| **@dashboard-results-screen** | Scoreboard | Rank & Status Badges | `Badge` | "Finalist", "Tied", "Qualified" labels inside rounded-full variants. Circular custom div for rank number. |
| **@dashboard-results-screen** | Scoreboard | Row Actions Menu | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` | Triggered by the vertical ellipsis button. |
| **@dashboard-results-screen** | Pagination | Pagination Controls | `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationPrevious`, `PaginationNext` | Replaces the static manual flex-row buttons. |

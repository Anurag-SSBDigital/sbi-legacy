
# Styling, Font, and Spacing Inconsistency Report

Here is a comprehensive report of the styling, font, and spacing inconsistencies found in your project, along with recommendations on how to fix them.

### 1. Hardcoded Colors

Many components use hardcoded color values instead of Tailwind's theme colors. This makes it difficult to maintain a consistent color scheme and to implement features like dark mode.

**Inconsistent Files:**

- `src/components/charts/pie-chart.tsx`
- `src/components/table/action/DeleteButton.tsx`
- `src/components/table/action/EditButton.tsx`
- `src/features/admin/layout.tsx`
- `src/features/alerts/branch/_ews-branch-view.tsx`
- `src/features/audit/status-pill.tsx`

**Recommendation:**

To fix this, you should first create a `tailwind.config.js` file in the root of your project. Then, you can extend the default color palette with your custom colors.

**`tailwind.config.js`:**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        'custom-blue': '#1E88E5',
        'custom-orange': '#F4511E',
        'custom-green': '#43A047',
        'custom-purple': '#8E24AA',
        'custom-pink': '#D81B60',
        'custom-cyan': '#00ACC1',
        'custom-red': '#BF665E',
        'custom-teal': '#0fc2c0',
      },
    },
  },
  plugins: [],
}
```

Once you've defined your custom colors, you can replace the hardcoded values in your components with the corresponding Tailwind utility classes.

**`src/components/charts/pie-chart.tsx`:**

```tsx
// Before
const colors = [
  '#1E88E5', // Blue
  '#F4511E', // Deep Orange
  '#43A047', // Green
  '#FB8C00', // Orange
  '#8E24AA', // Purple
  '#D81B60', // Pink
  '#00ACC1', // Cyan
]

// After
const colors = [
  'custom-blue',
  'custom-orange',
  'custom-green',
  'orange-500', // Tailwind's default orange
  'custom-purple',
  'custom-pink',
  'custom-cyan',
]
```

**`src/components/table/action/DeleteButton.tsx`:**

```tsx
// Before
<Button
  className='bg-[#BF665E]'
  ...
>

// After
<Button
  className='bg-custom-red'
  ...
>
```

**`src/components/table/action/EditButton.tsx`:**

```tsx
// Before
<Button
  className='hover:bg-[#0fc2c0] hover:text-white'
  ...
>

// After
<Button
  className='hover:bg-custom-teal hover:text-white'
  ...
>
```

### 2. Inconsistent Font Sizes

There are inconsistencies in how font sizes are applied. Some components use Tailwind's `text-*` utility classes, while others use hardcoded `fontSize` values.

**Inconsistent Files:**

- `src/components/charts/pie-chart.tsx`
- `src/components/coming-soon.tsx`
- `src/features/admin/layout.tsx`
- `src/features/alerts/components/reject-history-dialog.tsx`

**Recommendation:**

Use Tailwind's `text-*` utility classes for all font sizes to ensure consistency.

**`src/components/charts/pie-chart.tsx`:**

```tsx
// Before
<text
  ...
  fontSize='12px'
  fontWeight='bold'
>

// After
<text
  ...
  className="text-xs font-bold"
>
```

**`src/components/coming-soon.tsx`:**

```tsx
// Before
<h1 className='text-4xl leading-tight font-bold'>Coming Soon 👀</h1>

// After
<h1 className='text-4xl font-bold leading-tight'>Coming Soon 👀</h1>
```

### 3. Inconsistent Spacing

Spacing is also inconsistent. Some components use Tailwind's `p-*`, `m-*`, and `gap-*` utility classes, while others use hardcoded padding and margin values.

**Inconsistent Files:**

- `src/components/paginated-table.tsx`
- `src/components/ui/calendar.tsx`
- `src/features/alerts/branch/_ews-branch-view.tsx`
- `src/features/alerts/components/reject-history-dialog.tsx`

**Recommendation:**

Use Tailwind's spacing scale for all padding, margin, and gap values.

**`src/components/paginated-table.tsx`:**

```tsx
// Before
<section
  className={
    frameless
      ? ''
      : 'bg-card space-y-6 rounded-xl border px-4 pt-5 pb-6 shadow-lg sm:px-6'
  }
>

// After
<section
  className={
    frameless
      ? ''
      : 'bg-card space-y-6 rounded-xl border p-4 sm:p-6 shadow-lg'
  }
>
```

**`src/components/ui/calendar.tsx`:**

```tsx
// Before
<DayPicker
  showOutsideDays={showOutsideDays}
  className={cn('p-3', className)}
  ...
>

// After
<DayPicker
  showOutsideDays={showOutsideDays}
  className={cn('p-4', className)}
  ...
>
```

### 4. Inconsistent Font Families and Weights

There are also inconsistencies in font families and weights. Some components use Tailwind's `font-*` utility classes, while others use hardcoded `fontWeight` values.

**Inconsistent Files:**

- `src/components/charts/pie-chart.tsx`
- `src/components/coming-soon.tsx`
- `src/features/admin/layout.tsx`
- `src/features/alerts/components/reject-history-dialog.tsx`

**Recommendation:**

Use Tailwind's `font-*` utility classes for all font families and weights.

**`src/components/charts/pie-chart.tsx`:**

```tsx
// Before
<text
  ...
  fontWeight='bold'
>

// After
<text
  ...
  className="font-bold"
>
```

**`src/components/coming-soon.tsx`:**

```tsx
// Before
<h1 className='text-4xl leading-tight font-bold'>Coming Soon 👀</h1>

// After
<h1 className='text-4xl font-bold leading-tight'>Coming Soon 👀</h1>
```

By following these recommendations, you can significantly improve the consistency of your project's styling, making it easier to maintain and scale in the future.

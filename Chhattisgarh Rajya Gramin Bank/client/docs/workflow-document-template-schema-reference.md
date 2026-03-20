# Workflow Document Template Schema Reference

This document explains the schema and runtime behavior for the workflow document template designer page.

## Scope

Relevant files:

- Route wrapper: `client/src/routes/_authenticated/admin/workflow-document-templates.tsx`
- Main designer: `client/src/features/form-designer/workflow-document-template-designer.tsx`
- Frontend API client: `client/src/features/form-designer/workflow-document-template-api.ts`
- Backend template APIs: `Backend/src/main/java/com/loan/radis/Workflow/Controller/WorkflowDocumentTemplateController.java`
- Backend renderer: `Backend/src/main/java/com/loan/radis/Workflow/Service/WorkflowGeneratedDocumentService.java`

Route behavior:

- `/_authenticated/admin/workflow-document-templates` only renders `WorkflowDocumentTemplateDesigner`.

## End-to-End Flow

1. User builds template in designer UI.
2. UI converts form state to `payloadObject` (template JSON).
3. User can:
   - Download preview PDF via `POST /api/wf/document-templates/preview`
   - Save as immutable version via `POST /api/wf/document-templates`
4. At runtime, backend renders PDF from:
   - template JSON
   - task/workflow context
   - optional data providers (`dataSources`)
   - locale translations

## Canonical Template JSON Shape

```json
{
  "defaultLocale": "en-IN",
  "title": "Loan Sanction Letter",
  "titleKey": "loan_sanction_letter",
  "fileNamePattern": "sanction-{{instance.businessKey}}-{{task.id}}",
  "layout": {
    "useBankTheme": true,
    "showHeaderFooter": true,
    "margins": { "top": 24, "right": 24, "bottom": 24, "left": 24 },
    "bannerHeight": 56
  },
  "translations": {
    "en-IN": {
      "loan_sanction_letter": "Loan Sanction Letter"
    }
  },
  "dataSources": [
    {
      "alias": "customer",
      "provider": "customerProfile",
      "params": { "customerId": "{{bindings.primary.customerId}}" }
    }
  ],
  "blocks": []
}
```

### Top-level keys

| Key | Type | Required | Notes |
|---|---|---|---|
| `defaultLocale` | `string` | No | Default fallback locale. UI default: `en-IN`. |
| `title` | `string` | No | Header title text. |
| `titleKey` | `string` | No | Translation key for title (preferred when localized). |
| `fileNamePattern` | `string` | No | Supports `{{...}}` interpolation. `.pdf` is auto-appended if missing. |
| `layout` | `object` | No | PDF layout and theming options. |
| `translations` | `object` | No | Locale map: `locale -> { key: value }`. |
| `dataSources` | `array` | No | Optional provider fetch definitions. |
| `blocks` | `array` | Yes | Ordered render blocks. |

Backend also supports `subtitle`, `subtitleKey`, and `layout.showSummaryPanel` even though current UI does not explicitly edit them.

## `layout` Object

```json
{
  "useBankTheme": true,
  "showHeaderFooter": true,
  "margins": {
    "top": 24,
    "right": 24,
    "bottom": 24,
    "left": 24
  },
  "bannerHeight": 56
}
```

Rules:

- If `useBankTheme=true`, backend starts with themed defaults (`ReportLayout`/`ThemeRegistry`) and then applies overrides.
- `margins` and `bannerHeight` are optional numeric overrides.
- `showHeaderFooter` toggles themed header/footer.

## Blocks

Supported block types in designer:

- `section`
- `group`
- `heading`
- `paragraph`
- `kv`
- `table`
- `divider`
- `spacer`
- `pageBreak`

The payload includes normalized backend types plus `designerType`.

### Text blocks (`section`, `group`, `heading`, `paragraph`)

```json
{
  "type": "h2",
  "designerType": "section",
  "text": "Applicant Summary",
  "textKey": "applicant_summary",
  "style": {},
  "visibleWhen": {}
}
```

Rules:

- Rendered text uses `textKey` first (via translations), else `text`.
- `section/group` get styled heading treatment in backend.

### KV block

```json
{
  "type": "kv",
  "designerType": "kv",
  "label": "Applicant Name",
  "labelKey": "applicant_name",
  "valuePath": "forms.current.applicantName",
  "style": {},
  "visibleWhen": {}
}
```

`kv` value supports 3 modes:

1. Path mode

```json
{ "valuePath": "forms.current.amount" }
```

2. Template mode

```json
{ "value": "{{forms.current.amount}} / {{instance.businessKey}}" }
```

3. Computed mode

```json
{ "computed": { "type": "concat", "pathA": "providers.customer.firstName", "pathB": "providers.customer.lastName", "separator": " " } }
```

### Table block

```json
{
  "type": "table",
  "designerType": "table",
  "title": "Documents",
  "titleKey": "documents_title",
  "rowsPath": "documents.current",
  "columns": [
    { "header": "Type", "valuePath": "item.docType", "format": "text", "align": "left", "width": 1 },
    { "header": "Uploaded At", "valuePath": "item.addedAt", "format": "datetime", "align": "left", "width": 1.5 }
  ],
  "visibleWhen": {}
}
```

Rules:

- `rowsPath` should resolve to an array.
- For each row, backend injects `item`, `row`, and `index` in local context.
- If `columns` is empty but rows exist, backend infers columns from first row keys.

### Divider block

```json
{ "type": "divider", "designerType": "divider" }
```

### Spacer block

```json
{ "type": "spacer", "designerType": "spacer", "height": 8 }
```

### Page break block

```json
{ "type": "pageBreak", "designerType": "pageBreak" }
```

## `style` Object (Per Block)

```json
{
  "fontSize": 10.5,
  "align": "left",
  "fontWeight": "semibold",
  "bold": true,
  "spacingTop": 4,
  "spacingBottom": 6,
  "lineHeight": 1.2
}
```

Supported keys:

- `fontSize` (number, >0 recommended)
- `align` (`left | center | right`)
- `fontWeight` (`normal | medium | semibold | bold`)
- `bold` (`boolean`)
- `spacingTop`, `spacingBottom` (numbers)
- `lineHeight` (number; <0.8 warned in preflight)

`marginTop`/`marginBottom` are also accepted by backend as compatibility aliases.

## Conditional Visibility (`visibleWhen`)

```json
{
  "enabled": true,
  "path": "forms.current.status",
  "operator": "equals",
  "compareType": "literal",
  "value": "APPROVED"
}
```

Path-to-path compare:

```json
{
  "enabled": true,
  "path": "forms.current.branchId",
  "operator": "equals",
  "compareType": "path",
  "valuePath": "bindings.primary.branchId"
}
```

Operators:

- `equals`
- `notEquals`
- `contains`
- `exists`
- `notExists`

## Table Column Object

```json
{
  "header": "Net Balance",
  "headerKey": "net_balance",
  "valuePath": "item.netBalance",
  "align": "right",
  "width": 1.2,
  "format": "currency"
}
```

Supported `format` values:

- `text`
- `currency` -> `Rs. 1,23,456.00`
- `number`
- `date` -> `dd MMM yyyy`
- `datetime` -> `dd MMM yyyy HH:mm`
- `boolean` -> `Yes/No`

Columns can also use `value` or `computed` (same rules as `kv`), though UI primarily binds `valuePath`.

## Computed Value Syntax

### `concat`

```json
{ "type": "concat", "pathA": "providers.customer.firstName", "pathB": "providers.customer.lastName", "separator": " " }
```

### `dateFormat`

```json
{ "type": "dateFormat", "path": "task.createdAt", "pattern": "dd MMM yyyy" }
```

### `currencyFormat`

```json
{ "type": "currencyFormat", "path": "forms.current.amount", "symbol": "Rs. " }
```

Notes:

- Backend also accepts `date-format`, `date_format`, `currency-format`, `currency_format`.
- For date/currency, backend can also read inline `value` instead of `path`.

## Expression and Path Syntax

### Path resolution

- Dot path: `forms.current.customer_name`
- Array index: `documents.current[0].url`
- Optional root prefix: `$.forms.current.amount`

### Template interpolation

- Context binding: `{{instance.businessKey}}`
- Translation binding: `{{t.report_title}}`

Any string fields in template expressions are interpolated using this syntax (including `fileNamePattern` and `dataSources.params` values).

## Data Sources (`dataSources`)

```json
[
  {
    "alias": "customer",
    "provider": "customerProfile",
    "params": { "customerId": "{{bindings.primary.customerId}}" }
  },
  {
    "alias": "account",
    "provider": "accountProfile",
    "params": { "accountNo": "{{variables.accountNo}}" }
  },
  {
    "alias": "user",
    "provider": "userProfile",
    "params": { "username": "{{task.assigneeUserId}}" }
  }
]
```

Provider keys and expected params:

- `customerProfile`:
  - uses `params.customerId`, else falls back to `bindings.primary.customerId`
- `accountProfile`:
  - uses `params.accountNo`, else falls back to `bindings.primary.accountNo`
- `userProfile`:
  - uses `params.username`, else falls back to `task.assigneeUserId`

Loaded provider result is added to context under `providers.<alias>`.

## Render Context Available in Templates

Runtime context object includes:

- `instance`: id, businessKey, status, definitionId, definitionKey
- `task`: id, status, assigneeUserId, assigneeRoleId, assigneeDeptId, assigneeBranchId, createdAt, actedAt
- `stage`: id, key, name, order, type
- `forms`:
  - `current`
  - `byStageKey`
  - `byStageOrder`
- `variables`: workflow variables map
- `bindings`:
  - `primary`
  - `all`
- `documents`:
  - `current`
  - `byStageKey`
- `providers`: injected from `dataSources`

## Translations

Schema shape:

```json
{
  "translations": {
    "en-IN": {
      "report_title": "Report Title"
    },
    "hi-IN": {
      "report_title": "Report Title (HI)"
    }
  }
}
```

Designer behavior:

- Maintains union of keys across locales.
- Empty values are allowed in editor.
- Preflight warns about missing keys per locale.
- On payload build, only non-empty key/value pairs are included.
- If selected locale missing at runtime, backend falls back:
  - requested locale -> template default locale -> first available locale -> no translation map.

## Preflight Checks in Designer

Blocking errors:

- `templateKey` missing
- no blocks
- table `columnsJson` invalid JSON
- conditional visibility enabled but `visibleWhen.path` empty
- conditional compare mode `path` but `visibleWhen.valuePath` empty

Warnings:

- title/titleKey both empty
- duplicate translation keys in locale
- locale missing keys from union set
- text/label/value path gaps by block type
- table column issues (missing header/valuePath, invalid width/format)
- style quality warnings (`fontSize <= 0`, very low `lineHeight`)

## Import/Export Behavior

- JSON preview pane shows current payload exactly as it will be sent.
- Import JSON can load:
  - metadata (`defaultLocale`, title, layout, file pattern)
  - blocks
  - translations
  - data sources
- Block type normalization on import supports aliases:
  - `keyValue`, `key_value` -> `kv`
  - `line` -> `divider`
  - `page-break`, `page_break` -> `pageBreak`
  - heading variants (`h*`) mapped appropriately

## Versioning Semantics

- Save action always creates a new version per `templateKey`.
- No in-place update of prior versions.
- Backend increments version: latest + 1.
- Existing workflow instances use pinned stage-template snapshots for generated documents, so in-progress workflows are not broken by later template changes.

## API Contracts Used by Page

- `GET /api/wf/document-templates`
- `GET /api/wf/document-templates/{id}`
- `GET /api/wf/document-templates/key/{templateKey}/latest`
- `POST /api/wf/document-templates` (save new version)
- `POST /api/wf/document-templates/preview` (download PDF preview)
- `GET/POST/DELETE /api/wf/document-templates/presets...` (reusable block presets)

## Practical Minimal Example

```json
{
  "defaultLocale": "en-IN",
  "title": "Task Summary",
  "fileNamePattern": "task-{{task.id}}",
  "layout": { "useBankTheme": true, "showHeaderFooter": true },
  "translations": {
    "en-IN": {
      "customer_name": "Customer Name"
    }
  },
  "dataSources": [
    {
      "alias": "customer",
      "provider": "customerProfile",
      "params": { "customerId": "{{bindings.primary.customerId}}" }
    }
  ],
  "blocks": [
    { "type": "h2", "designerType": "heading", "text": "Task Summary" },
    {
      "type": "kv",
      "designerType": "kv",
      "labelKey": "customer_name",
      "valuePath": "providers.customer.firstName"
    },
    {
      "type": "table",
      "designerType": "table",
      "rowsPath": "documents.current",
      "columns": [
        { "header": "Type", "valuePath": "item.docType" },
        { "header": "URL", "valuePath": "item.url" }
      ]
    }
  ]
}
```

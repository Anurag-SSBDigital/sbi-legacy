`# Form Schema Reference (Ultra Form Designer)

This document explains the JSON schema format used by the Form Designer page (`/admin/form-designer`), including:

- every top-level key
- every field/component type
- validation and conditional syntax
- `tableInput` format
- JSON import syntax
- how to build a valid schema

## 1) Schema Shape

A valid exported schema from the designer has this structure:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "My Form",
  "description": "Form description",
  "type": "object",
  "properties": {
    "field_key": {}
  },
  "required": ["field_key"],
  "x-layout": {
    "columns": 1,
    "submitLabel": "Submit"
  },
  "x-fields": []
}
```

## 2) Top-Level Keys

| Key | Type | Required | Description |
|---|---|---|---|
| `$schema` | `string` | Yes | Always `https://json-schema.org/draft/2020-12/schema` |
| `title` | `string` | Yes | Form title shown in UI |
| `description` | `string` | Yes | Form description |
| `type` | `"object"` | Yes | Root schema type |
| `properties` | `object` | Yes | JSON Schema property map, keyed by field key |
| `required` | `string[]` | Yes | List of required root field keys |
| `x-layout.columns` | `number` | Yes | `1` or `2` |
| `x-layout.submitLabel` | `string` | Yes | Submit button text |
| `x-fields` | `array` | Yes (recommended for full fidelity) | Full designer metadata used by renderer and importer |

## 3) Field Keys and Naming Rules

Field keys are slugified by designer logic:

- lowercased
- non-alphanumeric becomes `_`
- trimmed underscores
- max length 64

Use stable keys because values are stored by key in payload.

## 4) Supported Components (`x-component` / `type`)

Use one of these component values in each field:

- `text`
- `textarea`
- `email`
- `password`
- `number`
- `date`
- `datetime-local`
- `time`
- `checkbox`
- `switch`
- `file`
- `select`
- `radio`
- `multiselect`
- `branchSelector`
- `departmentSelector`
- `roleDropdown`
- `userSelector`
- `tableInput`

### Type Mapping Summary

| Component | JSON Schema base type |
|---|---|
| `text`, `textarea`, `email`, `password`, `date`, `datetime-local`, `time`, custom selectors | `string` |
| `number` | `number` |
| `checkbox`, `switch` | `boolean` |
| `file` | `array` (string items) |
| `select`, `radio` | `string` with `enum` / `enumNames` |
| `multiselect` | `array` with string enum items |
| `tableInput` | `array` of row objects |

## 5) `x-fields` Field Object Contract

Each object in `x-fields` follows this shape:

```json
{
  "id": "uuid-like-id",
  "key": "customer_name",
  "label": "Customer Name",
  "helpText": "Optional helper text",
  "placeholder": "Enter customer name",
  "type": "text",
  "defaultValue": "",
  "options": [],
  "required": true,
  "validation": {},
  "visibility": {},
  "tableColumns": [],
  "tableMinRows": "",
  "tableMaxRows": ""
}
```

Field object keys:

| Key | Type | Notes |
|---|---|---|
| `id` | `string` | internal unique id |
| `key` | `string` | payload key and `properties` key |
| `label` | `string` | UI label |
| `helpText` | `string` | helper note |
| `placeholder` | `string` | input placeholder |
| `type` | `FieldType` | one of supported components |
| `defaultValue` | `unknown` | depends on type |
| `options` | `OptionItem[]` | for select/radio/multiselect |
| `required` | `boolean` | mirrored from `validation.required` |
| `validation` | `FieldValidation` | base + conditional validation |
| `visibility` | `FieldCondition` | conditional rendering |
| `tableColumns` | `TableColumn[]` | used when `type = tableInput` |
| `tableMinRows` | `string` | numeric string or empty |
| `tableMaxRows` | `string` | numeric string or empty |

`OptionItem`:

```json
{
  "id": "option-id",
  "label": "Option A",
  "value": "option_a"
}
```

## 6) Conditional Syntax

### 6.1 Visibility (`visibility`)

```json
{
  "enabled": true,
  "fieldKey": "status",
  "operator": "equals",
  "value": "APPROVED"
}
```

### 6.2 Conditional Validation (`validation.conditional`)

```json
{
  "enabled": true,
  "when": {
    "enabled": true,
    "fieldKey": "status",
    "operator": "equals",
    "value": "APPROVED"
  },
  "rule": "required",
  "ruleValue": "",
  "message": "Reason is required when status is APPROVED"
}
```

### Operators

- `equals`
- `notEquals`
- `contains`
- `notContains`
- `greaterThan`
- `greaterOrEqual`
- `lessThan`
- `lessOrEqual`
- `isTruthy`
- `isFalsy`

### Conditional Rule Values

- `required`
- `minLength`
- `maxLength`
- `pattern`
- `min`
- `max`

## 7) Validation Syntax

`validation` object shape:

```json
{
  "required": false,
  "minLength": "",
  "maxLength": "",
  "pattern": "",
  "min": "",
  "max": "",
  "customMessage": "",
  "conditional": {}
}
```

Notes:

- numeric constraints are stored as strings in metadata, parsed at runtime
- `required` drives both runtime validation and root `required[]` generation
- regex patterns are validated at runtime (`new RegExp(...)`)

## 8) `tableInput` Syntax

For a `tableInput` field:

- root property is `type: "array"`
- rows are in `items.type: "object"`
- row column schemas are inside `items.properties`
- row required columns are in `items.required`
- extra table metadata is stored in `x-tableColumns`

### Table Field Example (inside `x-fields`)

```json
{
  "id": "tbl_1",
  "key": "charges",
  "label": "Charges Table",
  "type": "tableInput",
  "defaultValue": [
    {
      "charge_type": "",
      "amount": ""
    }
  ],
  "tableMinRows": "1",
  "tableMaxRows": "10",
  "tableColumns": [
    {
      "id": "col_1",
      "key": "charge_type",
      "label": "Charge Type",
      "type": "select",
      "placeholder": "Select charge",
      "defaultValue": "",
      "options": [
        { "id": "o1", "label": "Processing", "value": "processing" },
        { "id": "o2", "label": "Legal", "value": "legal" }
      ],
      "validation": {
        "required": true,
        "minLength": "",
        "maxLength": "",
        "pattern": "",
        "min": "",
        "max": "",
        "customMessage": "",
        "conditional": {
          "enabled": false,
          "when": { "enabled": false, "fieldKey": "", "operator": "equals", "value": "" },
          "rule": "required",
          "ruleValue": "",
          "message": ""
        }
      }
    },
    {
      "id": "col_2",
      "key": "amount",
      "label": "Amount",
      "type": "number",
      "placeholder": "0",
      "defaultValue": "",
      "options": [],
      "validation": {
        "required": true,
        "minLength": "",
        "maxLength": "",
        "pattern": "",
        "min": "0",
        "max": "",
        "customMessage": "",
        "conditional": {
          "enabled": false,
          "when": { "enabled": false, "fieldKey": "", "operator": "equals", "value": "" },
          "rule": "required",
          "ruleValue": "",
          "message": ""
        }
      }
    }
  ],
  "options": [],
  "helpText": "",
  "placeholder": "",
  "required": true,
  "validation": {
    "required": true,
    "minLength": "",
    "maxLength": "",
    "pattern": "",
    "min": "",
    "max": "",
    "customMessage": "",
    "conditional": {
      "enabled": false,
      "when": { "enabled": false, "fieldKey": "", "operator": "equals", "value": "" },
      "rule": "required",
      "ruleValue": "",
      "message": ""
    }
  },
  "visibility": {
    "enabled": false,
    "fieldKey": "",
    "operator": "equals",
    "value": ""
  }
}
```

## 9) Import JSON Behavior

The importer supports two modes:

- full-fidelity mode: provide `x-fields`
- fallback mode: provide only JSON Schema `properties`; importer infers field types

Inference behavior when `x-fields` is absent:

- `property.type = "array"` and `x-tableColumns` exists -> `tableInput`
- `property.type = "array"` -> `multiselect`
- `property.type = "boolean"` -> `checkbox`
- `property.type = "number"` / `"integer"` -> `number`
- otherwise -> `text`

Recommended: always include `x-fields` for accurate reconstruction of:

- custom selector components
- conditional rules
- table column metadata
- UI-oriented defaults

## 10) Minimal Valid Schema Example

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Loan Review Form",
  "description": "Example form using custom selectors and table input",
  "type": "object",
  "properties": {
    "customer_name": {
      "title": "Customer Name",
      "type": "string",
      "x-component": "text",
      "x-placeholder": "Enter customer name"
    },
    "assigned_role": {
      "title": "Assigned Role",
      "type": "string",
      "x-component": "roleDropdown"
    },
    "charges": {
      "title": "Charges",
      "type": "array",
      "x-component": "tableInput",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "amount": {
            "title": "Amount",
            "type": "number",
            "x-component": "number"
          }
        },
        "required": ["amount"]
      },
      "x-tableColumns": [
        {
          "id": "c1",
          "key": "amount",
          "label": "Amount",
          "type": "number",
          "placeholder": "0",
          "defaultValue": "",
          "options": [],
          "validation": {
            "required": true,
            "minLength": "",
            "maxLength": "",
            "pattern": "",
            "min": "0",
            "max": "",
            "customMessage": "",
            "conditional": {
              "enabled": false,
              "when": { "enabled": false, "fieldKey": "", "operator": "equals", "value": "" },
              "rule": "required",
              "ruleValue": "",
              "message": ""
            }
          }
        }
      ]
    }
  },
  "required": ["customer_name", "assigned_role"],
  "x-layout": {
    "columns": 1,
    "submitLabel": "Submit"
  },
  "x-fields": [
    {
      "id": "f1",
      "key": "customer_name",
      "label": "Customer Name",
      "helpText": "",
      "placeholder": "Enter customer name",
      "type": "text",
      "defaultValue": "",
      "options": [],
      "required": true,
      "validation": {
        "required": true,
        "minLength": "3",
        "maxLength": "",
        "pattern": "",
        "min": "",
        "max": "",
        "customMessage": "",
        "conditional": {
          "enabled": false,
          "when": { "enabled": false, "fieldKey": "", "operator": "equals", "value": "" },
          "rule": "required",
          "ruleValue": "",
          "message": ""
        }
      },
      "visibility": {
        "enabled": false,
        "fieldKey": "",
        "operator": "equals",
        "value": ""
      },
      "tableColumns": [],
      "tableMinRows": "",
      "tableMaxRows": ""
    }
  ]
}
```

## 11) Valid Schema Checklist

Before loading/importing:

- `title`, `type`, `properties` exist
- each `properties` key is unique
- each field `key` in `x-fields` is unique
- `x-component` is one of supported values
- `required[]` contains only existing property keys
- select/radio/multiselect/table-column choice types define valid `options`
- conditional rules reference valid `fieldKey` / column key
- for `tableInput`, `tableColumns` keys are unique

If you keep both `properties` and `x-fields` synchronized, import and runtime rendering work reliably.
`
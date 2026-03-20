# Sarfaesi API Documentation (Detailed)

This document provides a comprehensive reference for all Sarfaesi-related API endpoints, including request and response schemas.

## Table of Contents
1. [Securities Operations](#securities-operations)
2. [Borrower Operations](#borrower-operations)
3. [Approval Operations](#approval-operations)
4. [Account Operations](#account-operations)
5. [Workflow Operations](#workflow-operations)
6. [User Operations](#user-operations)
7. [Schemas](#schemas)

---

## Securities Operations

### Create Security Details
**POST** `/sarfaesi/securities/create`
- **Operation ID:** `createSecurityDetails`
- **Description:** Creates new security details for a Sarfaesi account.
- **Request Body:** [`SarfaesiSecurityDetails`](#sarfaesisecuritydetails)
- **Response:** [`ApiResponseSarfaesiSecurityDetails`](#apiresponsesarfaesisecuritydetails)

### Update Security Details
**PUT** `/sarfaesi/securities/update/{id}`
- **Operation ID:** `updateSecurityDetails`
- **Description:** Updates existing security details.
- **Parameters:**
    - `id` (path, number): The ID of the security record.
- **Request Body:** [`SarfaesiSecurityDetails`](#sarfaesisecuritydetails)
- **Response:** [`ApiResponseSarfaesiSecurityDetails`](#apiresponsesarfaesisecuritydetails)

### Get Security Details (All)
**GET** `/sarfaesi/securities/all`
- **Operation ID:** `getAllSecurities`
- **Response:** [`ApiResponseListSarfaesiSecurityDetails`](#apiresponselistsarfaesisecuritydetails)

### Get Security Details by Account
**GET** `/sarfaesi/securities/account/{accountId}`
- **Operation ID:** `getSecuritiesByAccountId`
- **Parameters:**
    - `accountId` (path, number): The ID of the account.
- **Response:** [`ApiResponseListSarfaesiSecurityDetails`](#apiresponselistsarfaesisecuritydetails)

### Get Security Details by District
**GET** `/sarfaesi/securities/district/{district}`
- **Operation ID:** `getSecuritiesByDistrict`
- **Parameters:**
    - `district` (path, string): The district name.
- **Response:** [`ApiResponseListSarfaesiSecurityDetails`](#apiresponselistsarfaesisecuritydetails)

### Delete Security Details
**DELETE** `/sarfaesi/securities/delete/{id}`
- **Operation ID:** `deleteSecurityDetails`
- **Parameters:**
    - `id` (path, number): The ID of the security record.
- **Response:** [`ApiResponseString`](#apiresponsestring)

---

## Borrower Operations

### Create Borrower Details
**POST** `/sarfaesi/borrowers/create`
- **Operation ID:** `createBorrowerDetails`
- **Description:** Creates new borrower/guarantor details.
- **Request Body:** [`SarfaesiBorrowerGuarantorDetails`](#sarfaesiborrowerguarantordetails)
- **Response:** [`ApiResponseSarfaesiBorrowerGuarantorDetails`](#apiresponsesarfaesiborrowerguarantordetails)

### Update Borrower Details
**PUT** `/sarfaesi/borrowers/update/{id}`
- **Operation ID:** `updateBorrowerDetails`
- **Description:** Updates existing borrower/guarantor details.
- **Parameters:**
    - `id` (path, number): The ID of the borrower record.
- **Request Body:** [`SarfaesiBorrowerGuarantorDetails`](#sarfaesiborrowerguarantordetails)
- **Response:** [`ApiResponseSarfaesiBorrowerGuarantorDetails`](#apiresponsesarfaesiborrowerguarantordetails)

### Get All Borrowers
**GET** `/sarfaesi/borrowers/all`
- **Operation ID:** `getAllBorrowers`
- **Response:** [`ApiResponseListSarfaesiBorrowerGuarantorDetails`](#apiresponselistsarfaesiborrowerguarantordetails)

### Get Borrower by Account
**GET** `/sarfaesi/borrowers/account/{accountId}`
- **Operation ID:** `getBorrowerByAccountId`
- **Parameters:**
    - `accountId` (path, number): The account ID.
- **Response:** [`ApiResponseSarfaesiBorrowerGuarantorDetails`](#apiresponsesarfaesiborrowerguarantordetails)

---

## Approval Operations

### Create Approval
**POST** `/sarfaesi/approvals/create`
- **Operation ID:** `createSarfaesiApproval`
- **Description:** Creates a new Sarfaesi approval record.
- **Request Body:** [`SarfaesiApproval`](#sarfaesiapproval)
- **Response:** [`ApiResponseSarfaesiApproval`](#apiresponsesarfaesiapproval)

### Update Approval
**PUT** `/sarfaesi/approvals/update/{id}`
- **Operation ID:** `updateSarfaesiApproval`
- **Description:** Updates an existing Sarfaesi approval record.
- **Parameters:**
    - `id` (path, number): The ID of the approval record.
- **Request Body:** [`SarfaesiApproval`](#sarfaesiapproval)
- **Response:** [`ApiResponseSarfaesiApproval`](#apiresponsesarfaesiapproval)

### Get Approval by ID
**GET** `/sarfaesi/approvals/{id}`
- **Operation ID:** `getSarfaesiApprovalById`
- **Parameters:**
    - `id` (path, number): The approval ID.
- **Response:** [`ApiResponseSarfaesiApproval`](#apiresponsesarfaesiapproval)

### Get Approvals by Region
**GET** `/sarfaesi/approvals/region/{region}`
- **Operation ID:** `getSarfaesiApprovalsByRegion`
- **Parameters:**
    - `region` (path, string): The region name.
- **Response:** [`ApiResponseListSarfaesiApproval`](#apiresponselistsarfaesiapproval)

### Get Approvals by Branch
**GET** `/sarfaesi/approvals/branch/{branchName}`
- **Operation ID:** `getSarfaesiApprovalsByBranch`
- **Parameters:**
    - `branchName` (path, string): The branch name.
- **Response:** [`ApiResponseListSarfaesiApproval`](#apiresponselistsarfaesiapproval)

### Check Approval Exists
**GET** `/sarfaesi/approvals/exists/{id}`
- **Operation ID:** `checkSarfaesiApprovalExists`
- **Parameters:**
    - `id` (path, number): The approval ID.
- **Response:** [`ApiResponseBoolean`](#apiresponseboolean)

### Delete Approval
**DELETE** `/sarfaesi/approvals/delete/{id}`
- **Operation ID:** `deleteSarfaesiApproval`
- **Parameters:**
    - `id` (path, number): The approval ID.
- **Response:** [`ApiResponseString`](#apiresponsestring)

---

## Account Operations

### Create Account Identification
**POST** `/sarfaesi/accounts/create`
- **Operation ID:** `createAccount`
- **Description:** Creates a new account identification record.
- **Request Body:** [`SarfaesiAccountIdentification`](#sarfaesiaccountidentification)
- **Response:** [`ApiResponseSarfaesiAccountIdentification`](#apiresponsesarfaesiaccountidentification)

### Update Account Identification
**PUT** `/sarfaesi/accounts/update/{id}`
- **Operation ID:** `updateAccount`
- **Description:** Updates an existing account identification record.
- **Parameters:**
    - `id` (path, number): The record ID.
- **Request Body:** [`SarfaesiAccountIdentification`](#sarfaesiaccountidentification)
- **Response:** [`ApiResponseSarfaesiAccountIdentification`](#apiresponsesarfaesiaccountidentification)

### Submit Eligible Account
**POST** `/sarfaesi/EligibleAccount`
- **Operation ID:** `sarfaesiEligibleAccount`
- **Description:** Marks an account as eligible for Sarfaesi.
- **Request Body:** [`SarfaesiEligibleAccount`](#sarfaesieligibleaccount)
- **Response:** [`ApiResponseSarfaesiEligibleAccount`](#apiresponsesarfaesieligibleaccount)

### Get Account by ID
**GET** `/sarfaesi/accounts/{id}`
- **Operation ID:** `getAccountById`
- **Parameters:**
    - `id` (path, number): The record ID.
- **Response:** [`ApiResponseSarfaesiAccountIdentification`](#apiresponsesarfaesiaccountidentification)

### Get Account by Account Number
**GET** `/sarfaesi/SarfaesiAccount/{acctNo}`
- **Operation ID:** `getSarfaesiAccountByAcctNo`
- **Parameters:**
    - `acctNo` (path, string): The account number.
- **Response:** [`ApiResponseSarfaesiEligibleAccount`](#apiresponsesarfaesieligibleaccount)

### Get Account List (Paginated)
**GET** `/sarfaesi/accountlist`
- **Operation ID:** `getSarfaesiAccountList`
- **Parameters:**
    - `branchId` (query, string): The branch ID.
    - `page` (query, number): Page number.
    - `size` (query, number): Page size.
- **Response:** [`ApiResponsePageResponseAccountListDto2`](#apiresponsepageresponseaccountlistdto2)

### Get Eligible Accounts (Paginated)
**GET** `/sarfaesi/eligible-accounts`
- **Operation ID:** `getEligibleAccounts`
- **Parameters:**
    - `branchId` (query, string): The branch ID.
    - `page` (query, number): Page number.
    - `size` (query, number): Page size.
- **Response:** [`ApiResponsePageResponseSarfaesiEligibleAccount`](#apiresponsepageresponsesarfaesieligibleaccount)

### Update Status to Moved Proceeding
**PATCH** `/sarfaesi/update-status/{acctNo}`
- **Operation ID:** `updateStatusToMovedProceeding`
- **Parameters:**
    - `acctNo` (path, string): The account number.
- **Response:** [`ApiResponseString`](#apiresponsestring)

### Delete Account
**DELETE** `/sarfaesi/accounts/delete/{id}`
- **Operation ID:** `deleteAccount`
- **Parameters:**
    - `id` (path, number): The record ID.
- **Response:** [`ApiResponseString`](#apiresponsestring)

---

## Workflow Operations

### Initiate Process
**POST** `/api/sarfaesi/{accountNumber}/initiate`
- **Operation ID:** `initiateSarfaesiProcess`
- **Description:** Starts the Sarfaesi workflow for an account.
- **Parameters:**
    - `accountNumber` (path, string): The account number.
- **Response:** [`SarfaesiWorkflowResponse`](#sarfaesiworkflowresponse)

### Get Workflow Status
**GET** `/api/sarfaesi/{accountNumber}/status`
- **Operation ID:** `getSarfaesiStatus`
- **Parameters:**
    - `accountNumber` (path, string): The account number.
- **Response:** [`SarfaesiWorkflowStatus`](#sarfaesiworkflowstatus)

### Get Current Task Guidance
**GET** `/api/sarfaesi/{accountNumber}/guidance`
- **Operation ID:** `getCurrentTaskGuidance`
- **Parameters:**
    - `accountNumber` (path, string): The account number.
- **Response:** [`StageGuidance`](#stageguidance)

### Complete Current Task
**POST** `/api/sarfaesi/{accountNumber}/complete-task`
- **Operation ID:** `completeCurrentTask`
- **Parameters:**
    - `accountNumber` (path, string): The account number.
- **Request Body:** [`TaskCompletionRequest`](#taskcompletionrequest)
- **Response:** [`InstanceSummaryDto`](#instancesummarydto)

### Submit Stage Form
**POST** `/api/sarfaesi/{accountNumber}/submit-form`
- **Operation ID:** `submitStageForm`
- **Parameters:**
    - `accountNumber` (path, string): The account number.
- **Request Body:** [`FormSubmissionRequest`](#formsubmissionrequest)
- **Response:** `object`

### Upload Document
**POST** `/api/sarfaesi/{accountNumber}/upload-document`
- **Operation ID:** `uploadDocument`
- **Parameters:**
    - `accountNumber` (path, string): The account number.
- **Request Body:** [`DocumentUploadRequest`](#documentuploadrequest)
- **Response:** [`DocumentHistory`](#documenthistory)

### Get All Documents
**GET** `/api/sarfaesi/{accountNumber}/documents`
- **Operation ID:** `getAllDocuments`
- **Parameters:**
    - `accountNumber` (path, string): The account number.
- **Response:** Array of [`DocumentHistory`](#documenthistory)

### Get Stage Summary
**GET** `/api/sarfaesi/{accountNumber}/stage-summary`
- **Operation ID:** `getStageSummary`
- **Parameters:**
    - `accountNumber` (path, string): The account number.
- **Response:** Array of [`StageSummary`](#stagesummary)

### Get Case History
**GET** `/api/sarfaesi/{accountNumber}/history`
- **Operation ID:** `getCaseHistory`
- **Parameters:**
    - `accountNumber` (path, string): The account number.
- **Response:** [`CaseHistory`](#casehistory)

### Get Recent Activities
**GET** `/api/sarfaesi/{accountNumber}/activities`
- **Operation ID:** `getRecentActivities`
- **Parameters:**
    - `accountNumber` (path, string): The account number.
    - `limit` (query, number, optional): Max activities to return.
- **Response:** Array of [`ActivityHistory`](#activityhistory)

### Save Proforma
**POST** `/api/sarfaesi/create/performa`
- **Operation ID:** `saveProforma`
- **Request Body:** [`SarfaesiProformaData`](#sarfaesiproformadata)
- **Response:** [`ApiResponseSarfaesiProformaData`](#apiresponsesarfaesiproformadata)

---

## User Operations

### Get User Tasks
**GET** `/api/sarfaesi/user/tasks`
- **Operation ID:** `getUserTasks`
- **Parameters:**
    - `status` (query, string, optional)
    - `priority` (query, string, optional)
- **Response:** [`UserTaskList`](#usertasklist)

### Get User Dashboard
**GET** `/api/sarfaesi/user/dashboard`
- **Operation ID:** `getUserDashboard`
- **Response:** [`UserSarfaesiDashboard`](#usersarfaesidashboard)

### Get User Cases
**GET** `/api/sarfaesi/user/cases`
- **Operation ID:** `getUserCases`
- **Response:** Array of [`UserCase`](#usercase)

### Get Task Detail
**GET** `/api/sarfaesi/tasks/{taskId}`
- **Operation ID:** `getTaskDetail`
- **Parameters:**
    - `taskId` (path, number): The task ID.
- **Response:** [`TaskDetail`](#taskdetail)

---

## Schemas

### SarfaesiSecurityDetails
```json
{
  "id": "number (int64)",
  "natureOfSecurity": "string",
  "numberOfSecurities": "number (int32)",
  "securityDescription": "string",
  "locationOfProperty": "string",
  "stateDistrictOfProperty": "string",
  "valuerName": "string",
  "valuationDate": "string (date)",
  "fairMarketValue": "number (double)",
  "realizableValue": "number (double)",
  "chargeCreationDate": "string (date)",
  "chargeType": "string",
  "cersaiRegistrationNo": "string",
  "insuranceDetails": "string",
  "encumbranceStatus": "string"
}
```

### SarfaesiBorrowerGuarantorDetails
```json
{
  "id": "number (int64)",
  "borrowerAddress": "string",
  "emailId": "string",
  "contactNumber": "string",
  "guarantorNames": "string",
  "guarantorCifs": "string",
  "guarantorAddresses": "string",
  "createdTime": "string (date-time)",
  "updatedTime": "string (date-time)",
  "updatedBy": "string",
  "createdBy": "string"
}
```

### SarfaesiApproval
```json
{
  "id": "number (int64)",
  "accountNo": "string",
  "branchName": "string",
  "branchCode": "string",
  "region": "string",
  "borrowerName": "string",
  "borrowerAddress": "string",
  "constitution": "string",
  "personDetails": [
    {
      "name": "string",
      "relationship": "string",
      "netWorth": "number"
    }
  ],
  "sanctionDate": "string (date)",
  "sanctionAmount": "number",
  "facility": "string",
  "bankingRelationship": "string",
  "sharePercentage": "number",
  "activityName": "string",
  "activityStatus": "string",
  "npaDate": "string (date)",
  "presentAssetCategory": "string",
  "accountStatus": "string",
  "rehabilitationStatus": "string",
  "bifrStatus": "string",
  "suitStatus": "string",
  "outstandingDues": "number",
  "totalDues": "number",
  "taxDuesDetails": "string",
  "documentDetails": [
    {
      "name": "string",
      "dateOfExecution": "string (date)"
    }
  ],
  "limitationComments": "string",
  "tangibleSecurities": [
    {
      "details": "string",
      "chargeType": "string",
      "expectedMarketValue": "number"
    }
  ],
  "enforcedSecurities": [
    {
      "details": "string",
      "chargeType": "string",
      "ownedBy": "string",
      "expectedMarketValue": "number",
      "shareOfCharge": "number"
    }
  ],
  "marketabilityComments": "string",
  "consentRequired": "boolean",
  "consentBankName": "string",
  "interCreditorComments": "string",
  "recoveryEfforts": "string",
  "staffAccountabilityStatus": "string",
  "branchCategory": "string",
  "incumbentCadre": "string",
  "remarks": "string",
  "createdTime": "string (date-time)",
  "updatedTime": "string (date-time)",
  "updatedBy": "string",
  "createdBy": "string"
}
```

### SarfaesiAccountIdentification
```json
{
  "id": "number (int64)",
  "accountNumber": "string",
  "customerName": "string",
  "cifNumber": "string",
  "branchName": "string",
  "branchCode": "string",
  "regionalOffice": "string",
  "fgmoHeadOffice": "string",
  "state": "string",
  "dateOfSanction": "string (date)",
  "dateOfNpa": "string (date)",
  "assetClassification": "string",
  "outstandingBalance": "number (double)",
  "interestUpTo": "number (double)",
  "totalDues": "number (double)",
  "dateOfLastCredit": "string (date)",
  "purposeOfLoan": "string",
  "categoryOfLoan": "string",
  "typeOfIndustry": "string",
  "createdTime": "string (date-time)",
  "updatedTime": "string (date-time)",
  "updatedBy": "string",
  "createdBy": "string"
}
```

### SarfaesiEligibleAccount
```json
{
  "id": "number (int64)",
  "acctNo": "string",
  "acctDesc": "string",
  "custNumber": "string",
  "custName": "string",
  "loanLimit": "number (double)",
  "outstand": "number (double)",
  "npaDt": "string (date)",
  "sarfaesiEligible": "boolean",
  "sarfaesiStatus": "string",
  "branchCode": "string",
  "state": "string",
  "district": "string",
  "city": "string"
}
```

### SarfaesiWorkflowResponse
```json
{
  "workflowInstanceId": "number (int64)",
  "sarfaesiApprovalId": "number (int64)",
  "accountNumber": "string",
  "currentStage": "string",
  "message": "string",
  "initiatedAt": "string (date-time)",
  "businessKey": "string"
}
```

### TaskCompletionRequest
```json
{
  "accountNumber": "string",
  "action": "string",
  "comments": "string",
  "payload": {
    "key": "Record<string, never>"
  }
}
```

### DocumentUploadRequest
```json
{
  "documentName": "string",
  "documentType": "string",
  "fileUrl": "string",
  "fileSize": "number (int64)",
  "fileType": "string",
  "comments": "string"
}
```

### DocumentHistory
```json
{
  "documentId": "number (int64)",
  "documentName": "string",
  "documentType": "string",
  "uploadedBy": "string",
  "uploadedAt": "string (date-time)",
  "stageName": "string",
  "fileUrl": "string",
  "fileSize": "number (int64)",
  "fileType": "string",
  "version": "number (int32)",
  "comments": "string"
}
```

### FormSubmissionRequest
```json
{
  "accountNumber": "string",
  "formData": {
    "key": "Record<string, never>"
  },
  "comments": "string"
}
```

### SarfaesiProformaData
```json
{
  "accountIdentification": "SarfaesiAccountIdentification",
  "borrowerGuarantor": "SarfaesiBorrowerGuarantorDetails",
  "securityDetails": ["SarfaesiSecurityDetails"]
}
```

### SarfaesiWorkflowStatus
```json
{
  "instanceId": "number (int64)",
  "accountNumber": "string",
  "borrowerName": "string",
  "currentStage": "string",
  "status": "string",
  "stageStartDate": "string (date-time)",
  "dueDate": "string (date-time)",
  "outstandingAmount": "number (double)",
  "branchCode": "string",
  "pendingActions": ["string"],
  "daysInCurrentStage": "number (int32)",
  "stageStatus": {
    "proformaCreation": "boolean",
    "demandNotice": "boolean",
    "notice13_2": "boolean",
    "customerResponse": "boolean",
    "possession": "boolean",
    "physicalPossession": "boolean",
    "reservePrice": "boolean",
    "saleNotice": "boolean",
    "currentStage": "string"
  },
  "progressPercentage": "number (int32)",
  "overdue": "boolean"
}
```

### StageGuidance
```json
{
  "accountNumber": "string",
  "currentStage": "string",
  "stageName": "string",
  "stageDescription": "string",
  "requiredActions": ["string"],
  "requiredEntities": ["string"],
  "requiredDocuments": ["string"],
  "requiredFields": ["string"],
  "slaDays": "number (int32)",
  "actionable": "boolean"
}
```

### CaseHistory
```json
{
  "accountDetails": "SarfaesiAccountIdentification",
  "workflowInstance": "WorkflowInstance",
  "stageTimeline": [
    {
      "stageName": "string",
      "stageKey": "string",
      "startDate": "string (date-time)",
      "triggeredBy": "string",
      "trigger": "string",
      "notes": "string",
      "duration": "string"
    }
  ],
  "actionHistory": [
    {
      "actionDate": "string (date-time)",
      "actionBy": "string",
      "actionType": "string",
      "stageName": "string",
      "comments": "string",
      "payload": "string",
      "taskId": "number (int64)"
    }
  ],
  "documentHistory": ["DocumentHistory"],
  "stageSummary": ["StageSummary"],
  "currentStatus": {
    "currentStage": "string",
    "progressPercentage": "number (int32)",
    "workflowStatus": "string",
    "lastUpdated": "string (date-time)",
    "overdue": "boolean"
  }
}
```

### StageSummary
```json
{
  "stageKey": "string",
  "stageName": "string",
  "status": "string",
  "startDate": "string (date-time)",
  "endDate": "string (date-time)",
  "duration": "string",
  "completedBy": "string",
  "documents": ["DocumentHistory"],
  "actions": ["ActionHistory"]
}
```

### UserTaskList
```json
{
  "tasks": [
    {
      "taskId": "number (int64)",
      "instanceId": "number (int64)",
      "accountNumber": "string",
      "customerName": "string",
      "currentStage": "string",
      "stageName": "string",
      "taskDescription": "string",
      "assignedDate": "string (date-time)",
      "dueDate": "string (date-time)",
      "priority": "string",
      "requiredActions": ["string"],
      "slaDays": "number (int32)",
      "daysRemaining": "number (int64)",
      "overdue": "boolean"
    }
  ],
  "totalCount": "number (int64)",
  "overdueCount": "number (int64)",
  "highPriorityCount": "number (int64)"
}
```

### UserSarfaesiDashboard
```json
{
  "assignedTasks": ["UserTask"],
  "myCases": ["UserCase"],
  "stats": {
    "totalTasks": "number (int64)",
    "overdueTasks": "number (int64)",
    "highPriorityTasks": "number (int64)",
    "totalCases": "number (int64)",
    "casesRequiringAction": "number (int64)",
    "completedToday": "number (int64)"
  },
  "urgentItems": [
    {
      "taskId": "number (int64)",
      "accountNumber": "string",
      "customerName": "string",
      "stageName": "string",
      "dueDate": "string (date-time)",
      "priority": "string",
      "overdue": "boolean"
    }
  ],
  "recentActivities": ["ActivityHistory"]
}
```

### UserCase
```json
{
  "accountNumber": "string",
  "customerName": "string",
  "currentStage": "string",
  "lastUpdated": "string (date-time)",
  "status": "string",
  "outstandingAmount": "number (double)",
  "progressPercentage": "number (int32)",
  "overdue": "boolean"
}
```

### TaskDetail
```json
{
  "task": "UserTask",
  "guidance": "StageGuidance",
  "caseHistory": "CaseHistory"
}
```

### Generic Responses
- **ApiResponseString**: `{ "status": "string", "message": "string", "data": "string" }`
- **ApiResponseBoolean**: `{ "status": "string", "message": "string", "data": "boolean" }`
- **ApiResponseObject**: `{ "status": "string", "message": "string", "data": {} }`
- **ApiResponse...**: Generally follows `{ "status": "string", "message": "string", "data": T }` where T is the schema type (e.g., SarfaesiApproval).

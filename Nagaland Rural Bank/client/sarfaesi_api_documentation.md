
## Sarfaesi Related APIs

### Update Operations
- **PUT `/sarfaesi/securities/update/{id}`**
  - Operation ID: `updateSecurityDetails`
  - Description: Updates security details for a Sarfaesi account.

- **PUT `/sarfaesi/borrowers/update/{id}`**
  - Operation ID: `updateBorrowerDetails`
  - Description: Updates borrower details for a Sarfaesi account.

- **PUT `/sarfaesi/approvals/update/{id}`**
  - Operation ID: `updateSarfaesiApproval`
  - Description: Updates Sarfaesi approval details.

- **PUT `/sarfaesi/accounts/update/{id}`**
  - Operation ID: `updateAccount`
  - Description: Updates Sarfaesi account identification details.

### Create Operations
- **POST `/sarfaesi/securities/create`**
  - Operation ID: `createSecurityDetails`
  - Description: Creates new security details for a Sarfaesi account.

- **POST `/sarfaesi/borrowers/create`**
  - Operation ID: `createBorrowerDetails`
  - Description: Creates new borrower details for a Sarfaesi account.

- **POST `/sarfaesi/approvals/create`**
  - Operation ID: `createSarfaesiApproval`
  - Description: Creates a new Sarfaesi approval entry.

- **POST `/sarfaesi/accounts/create`**
  - Operation ID: `createAccount`
  - Description: Creates a new Sarfaesi account identification entry.

- **POST `/sarfaesi/EligibleAccount`**
  - Operation ID: `sarfaesiEligibleAccount`
  - Description: Submits an eligible account for Sarfaesi process.

### API Operations
- **POST `/api/sarfaesi/{accountNumber}/upload-document`**
  - Operation ID: `uploadDocument`
  - Description: Uploads a document for a specific Sarfaesi account.

- **POST `/api/sarfaesi/{accountNumber}/submit-form`**
  - Operation ID: `submitStageForm`
  - Description: Submits a form for a specific stage of the Sarfaesi process.

- **POST `/api/sarfaesi/{accountNumber}/initiate`**
  - Operation ID: `initiateSarfaesiProcess`
  - Description: Initiates the Sarfaesi process for a given account number.

- **POST `/api/sarfaesi/{accountNumber}/complete-task`**
  - Operation ID: `completeCurrentTask`
  - Description: Completes the current task for a specific Sarfaesi account.

- **POST `/api/sarfaesi/create/performa`**
  - Operation ID: `saveProforma`
  - Description: Saves proforma data for Sarfaesi.

### Patch Operations
- **PATCH `/sarfaesi/update-status/{acctNo}`**
  - Operation ID: `updateStatusToMovedProceeding`
  - Description: Updates the status of a Sarfaesi account to 'Moved Proceeding'.

### Get Operations
- **GET `/sarfaesi/securities/district/{district}`**
  - Operation ID: `getSecuritiesByDistrict`
  - Description: Retrieves security details by district for Sarfaesi.

- **GET `/sarfaesi/securities/all`**
  - Operation ID: `getAllSecurities`
  - Description: Retrieves all security details for Sarfaesi.

- **GET `/sarfaesi/securities/account/{accountId}`**
  - Operation ID: `getSecuritiesByAccountId`
  - Description: Retrieves security details by account ID for Sarfaesi.

- **GET `/sarfaesi/eligible-accounts`**
  - Operation ID: `getEligibleAccounts`
  - Description: Retrieves eligible accounts for Sarfaesi.

- **GET `/sarfaesi/borrowers/all`**
  - Operation ID: `getAllBorrowers`
  - Description: Retrieves all borrower details for Sarfaesi.

- **GET `/sarfaesi/borrowers/account/{accountId}`**
  - Operation ID: `getBorrowerByAccountId`
  - Description: Retrieves borrower details by account ID for Sarfaesi.

- **GET `/sarfaesi/approvals/{id}`**
  - Operation ID: `getSarfaesiApprovalById`
  - Description: Retrieves Sarfaesi approval by ID.

- **GET `/sarfaesi/approvals/region/{region}`**
  - Operation ID: `getSarfaesiApprovalsByRegion`
  - Description: Retrieves Sarfaesi approvals by region.

- **GET `/sarfaesi/approvals/exists/{id}`**
  - Operation ID: `checkSarfaesiApprovalExists`
  - Description: Checks if a Sarfaesi approval exists by ID.

- **GET `/sarfaesi/approvals/branch/{branchName}`**
  - Operation ID: `getSarfaesiApprovalsByBranch`
  - Description: Retrieves Sarfaesi approvals by branch name.

- **GET `/sarfaesi/approvals/all`**
  - Operation ID: `getAllSarfaesiApprovals`
  - Description: Retrieves all Sarfaesi approvals.

- **GET `/sarfaesi/accounts/{id}`**
  - Operation ID: `getAccountById`
  - Description: Retrieves Sarfaesi account by ID.

- **GET `/sarfaesi/accounts/npa/{classification}`**
  - Operation ID: `getNpaAccounts`
  - Description: Retrieves NPA accounts for Sarfaesi by classification.

- **GET `/sarfaesi/accounts/branch/{branchCode}`**
  - Operation ID: `getAccountsByBranch`
  - Description: Retrieves Sarfaesi accounts by branch code.

- **GET `/sarfaesi/accounts/all`**
  - Operation ID: `getAllAccounts`
  - Description: Retrieves all Sarfaesi accounts.

- **GET `/sarfaesi/accountlist`**
  - Operation ID: `getSarfaesiAccountList`
  - Description: Retrieves a paginated list of Sarfaesi accounts.

- **GET `/sarfaesi/SarfaesiAccount/{acctNo}`**
  - Operation ID: `getSarfaesiAccountByAcctNo`
  - Description: Retrieves a single Sarfaesi account by account number.

- **GET `/api/sarfaesi/{accountNumber}/status`**
  - Operation ID: `getSarfaesiStatus`
  - Description: Retrieves the current status of the Sarfaesi workflow for an account.

- **GET `/api/sarfaesi/{accountNumber}/stage-summary`**
  - Operation ID: `getStageSummary`
  - Description: Retrieves a summary of all stages for a Sarfaesi account.

- **GET `/api/sarfaesi/{accountNumber}/history`**
  - Operation ID: `getCaseHistory`
  - Description: Retrieves the complete case history for a Sarfaesi account.

- **GET `/api/sarfaesi/{accountNumber}/guidance`**
  - Operation ID: `getCurrentTaskGuidance`
  - Description: Retrieves guidance for the current task in the Sarfaesi workflow.

- **GET `/api/sarfaesi/{accountNumber}/documents`**
  - Operation ID: `getAllDocuments`
  - Description: Retrieves all documents associated with a Sarfaesi account.

- **GET `/api/sarfaesi/{accountNumber}/documents/stage/{stageKey}`**
  - Operation ID: `getDocumentsByStage`
  - Description: Retrieves documents for a specific stage of a Sarfaesi account.

- **GET `/api/sarfaesi/{accountNumber}/activities`**
  - Operation ID: `getRecentActivities`
  - Description: Retrieves recent activities for a Sarfaesi account.

- **GET `/api/sarfaesi/user/tasks`**
  - Operation ID: `getUserTasks`
  - Description: Retrieves tasks assigned to the current user for Sarfaesi cases.

- **GET `/api/sarfaesi/user/dashboard`**
  - Operation ID: `getUserDashboard`
  - Description: Retrieves dashboard data for Sarfaesi users.

- **GET `/api/sarfaesi/user/cases`**
  - Operation ID: `getUserCases`
  - Description: Retrieves all Sarfaesi cases associated with the current user.

- **GET `/api/sarfaesi/tasks/{taskId}`**
  - Operation ID: `getTaskDetail`
  - Description: Retrieves details for a specific Sarfaesi task.

### Delete Operations
- **DELETE `/sarfaesi/securities/delete/{id}`**
  - Operation ID: `deleteSecurityDetails`
  - Description: Deletes security details for a Sarfaesi account.

- **DELETE `/sarfaesi/approvals/delete/{id}`**
  - Operation ID: `deleteSarfaesiApproval`
  - Description: Deletes a Sarfaesi approval entry.

- **DELETE `/sarfaesi/accounts/delete/{id}`**
  - Operation ID: `deleteAccount`
  - Description: Deletes a Sarfaesi account identification entry.

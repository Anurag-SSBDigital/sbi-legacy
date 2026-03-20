  # Workflow API Reference                                                                                                       
                                                                                                                                 
  ## `/api/wf/instances/{instanceId}/stage/{stageDefId}/details`  _(src/types/api/v1.d.ts:391)_                                  

  | Method                                                  | Auth            | Request                                      | Response                                               |
  | ------------------------------------------------------- | --------------- | -------------------------------------------- | ------------------------------------------------------ |
  | `GET`                                                   | None            | Path: `instanceId:int64`, `stageDefId:int64` | `StageDetailsDto` — { instanceId, stageDefId, fields?: |
  | `FieldKV`[] (key, valueJson) } (#lines 11709,7943,7939) |
  | `PUT`                                                   | `Authorization` | Same path; body `StageDetailsDto`            | Saved `StageDetailsDto` (#lines 11732)                 |
                                                                                                                                 
  ---                                                                                                                            
                                                                                                                                 
  ## Task Actions (src/types/api/v1.d.ts:1319–1366)                                                                              
                                                                                                                                 
  | Endpoint                           | Method | Auth            | Body                                                | Response                      |
  | ---------------------------------- | ------ | --------------- | --------------------------------------------------- | ----------------------------- |
  | `/api/wf/tasks/{taskId}/send-back` | `POST` | `Authorization` | `TaskActionRequest` { comments?, payload? } (#9167) |
  | `InstanceSummaryDto` (#13247)      |
  | `/api/wf/tasks/{taskId}/reject`    | `POST` | `Authorization` | `TaskActionRequest`                                 | `InstanceSummaryDto` (#13275) |
  | `/api/wf/tasks/{taskId}/approve`   | `POST` | `Authorization` | `TaskActionRequest`                                 | `InstanceSummaryDto` (#13303) |
                                                                                                                                 
  `InstanceSummaryDto` = { instanceId:int64, businessKey?, currentStage?, status: RUNNING/COMPLETED/CANCELLED } (#9173)          
                                                                                                                                 
  ---                                                                                                                            
                                                                                                                                 
  ## Instance Linking (src/types/api/v1.d.ts:1367,2391)                                                                          
                                                                                                                                 
  | Endpoint                                          | Method                                 | Auth            | Body                                               | Response                 |
  | ------------------------------------------------- | -------------------------------------- | --------------- | -------------------------------------------------- | ------------------------ |
  | `/api/wf/instances/{instanceId}/links`            | `POST`                                 | `Authorization` | `EntityLink` { entityType?, entityId?, accountNo?, |
  | customerId?, branchId?, departmentId? } (#9181)   | `WorkflowBindingLinkDto` (#9189,13331) |
  | `/api/wf/instances/{instanceId}/links/deactivate` | `PATCH`                                | `Authorization` | `EntityLink`                                       | `WorkflowBindingLinkDto` |
  | (marked inactive) (#2391,15014)                   |
                                                                                                                                 
  ---                                                                                                                            
                                                                                                                                 
  ## Instance Documents (src/types/api/v1.d.ts:1383)                                                                             
                                                                                                                                 
  | Method                                                                         | Auth            | Request                                                   | Response |
  | ------------------------------------------------------------------------------ | --------------- | --------------------------------------------------------- | -------- |
  | `GET /api/wf/instances/{instanceId}/documents`                                 | None            | Path `instanceId`; optional query `stageDefId:int64`      |
  | `DocumentDto[]` (id, stageDefId, docType, url, addedBy, addedAt) (#13359,9208) |
  | `POST /api/wf/instances/{instanceId}/documents`                                | `Authorization` | Body `AddDocRequest` { stageDefId, docType, url } (#9202) |
  | Created `DocumentDto` (#13383)                                                 |
                                                                                                                                 
  ---                                                                                                                            
                                                                                                                                 
  ## Instance Lifecycle (src/types/api/v1.d.ts:1399)                                                                             
                                                                                                                                 
  - `POST /api/wf/instances/start-and-link` — Auth required.                                                                     
    - Body `StartAndLinkRequest` { defKey, entities?: `EntityLink`[], variables?: map } (#9219)                                  
    - Response `InstanceStartResponseDto` { instanceId, businessKey, currentStage, bindings?: `WorkflowBindingLinkDto`[] }       
  (#13411,9226)                                                                                                                  
                                                                                                                                 
  ---                                                                                                                            
                                                                                                                                 
  ## Definition Catalogue (src/types/api/v1.d.ts:1415 onwards)                                                                   
                                                                                                                                 
  | Endpoint                         | Method | Auth            | Body/Query                                              | Response                                           |
  | -------------------------------- | ------ | --------------- | ------------------------------------------------------- | -------------------------------------------------- |
  | `/api/wf/definitions`            | `GET`  | None            | Query `activeOnly?:boolean`                             | `WorkflowDefinitionDto[]` (id, key, name, version, |
  | isActive) (#13437,9237)          |
  | `/api/wf/definitions`            | `POST` | `Authorization` | `WorkflowDefinitionCreateRequest` { key, name } (#9233) |
  | `WorkflowDefinitionDto` (#13459) |
  | `/api/wf/definitions/{defId}`    | `GET`  | None            | Path `defId:int64`                                      | `WorkflowDefinitionDto` (#4663,18168)              |
                                                                                                                                 
  ### Transitions (src/types/api/v1.d.ts:1431)                                                                                   
                                                                                                                                 
  | Method                                                   | Auth                             | Body                                                                  | Response                                                        |
  | -------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------- |
  | `GET /api/wf/definitions/{defId}/transitions`            | None                             | —                                                                     | `WorkflowTransitionDto[]` { id, definitionId, fromStageId/name, |
  | toStageId/name, trigger, autoTransition? } (#13485,9253) |
  | `POST /api/wf/definitions/{defId}/transitions`           | None                             | `WorkflowTransitionCreateRequest` { fromStageId, toStageId, trigger } |
  | (#9246)                                                  | `WorkflowTransitionDto` (#13507) |
                                                                                                                                 
  ### Stages (src/types/api/v1.d.ts:1447)
                                                                                                                                 
  | Method                                    | Auth                                        | Body                                                           | Response                                     |
  | ----------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------- |
  | `GET /api/wf/definitions/{defId}/stages`  | None                                        | —                                                              | `WorkflowStageDefinitionDto[]` (#13533,9267) |
  | `POST /api/wf/definitions/{defId}/stages` | `Authorization`                             | `WorkflowStageDefinitionDto` (id?, definitionId?, stageOrder?, |
  | key, name, assignment data, flags)        | Saved `WorkflowStageDefinitionDto` (#13555) |

  ### Stage Ordering & Enablement (src/types/api/v1.d.ts:2407,2423)                                                              
  | --- | --- | --- | --- | --- |
  | `/api/wf/definitions/{defId}/reorder` | `PATCH` | None | `ReorderRequest` { stageIds:number[] } (#9524) | `200 OK` (no body) 
  (#15042) |
  | `/api/wf/definitions/stages/{stageId}/enabled` | `PATCH` | None | `StageEnabledRequest` { enabled:boolean } (#9527) | Updated
  `WorkflowStageDefinitionDto` (#15066) |

  ---

  ## Task Inbox (src/types/api/v1.d.ts:4615)

  - `GET /api/wf/tasks/my`
    - Auth header required.
    - Query: `status?:string`, `page?:number`, `size?:number`
    - Response `PageTaskCardDto` { totalPages, totalElements, pageable, size, number, content:`TaskCardDto`[], etc. }
  (#18112,10306,10324)

  ---

  | Endpoint                        | Method | Auth | Request            | Response                      |
  | ------------------------------- | ------ | ---- | ------------------ | ----------------------------- |
  | `/api/wf/instances/{id}`        | `GET`  | None | Path `id:int64`    | `InstanceSummaryDto` (#18138) |
  | `/api/wf/instances/by-business` | `GET`  | None | Query `key:string` | `InstanceSummaryDto` (#18152) |
/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { Controller, ValidationService, FieldErrors, ValidateError, TsoaRoute, HttpStatusCodeLiteral, TsoaResponse } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { GovernanceController } from './../src/controllers/governanceController';
import { expressAuthentication } from './../src/authentication';
// @ts-ignore - no great way to install types from subpackage
const promiseAny = require('promise.any');
import { iocContainer } from './../src/ioc';
import { IocContainer, IocContainerFactory } from '@tsoa/runtime';
import * as express from 'express';

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "PollingContractType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["accept"]},{"dataType":"enum","enums":["reject"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Proposal": {
        "dataType": "refObject",
        "properties": {
            "contract": {"dataType":"string","required":true},
            "pollingType": {"ref":"PollingContractType","required":true},
            "proposalId": {"dataType":"string","required":true},
            "proposer": {"dataType":"string","required":true},
            "targets": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "values": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "signatures": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "calldatas": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "startTime": {"dataType":"double","required":true},
            "endTime": {"dataType":"double","required":true},
            "description": {"dataType":"string","required":true},
            "votePowerBlock": {"dataType":"double","required":true},
            "wrappingThreshold": {"dataType":"double","required":true},
            "absoluteThreshold": {"dataType":"double","required":true},
            "relativeThreshold": {"dataType":"double","required":true},
            "execStartTime": {"dataType":"double","required":true},
            "execEndTime": {"dataType":"double","required":true},
            "totalVotePower": {"dataType":"string","required":true},
            "executableOnChain": {"dataType":"boolean","required":true},
            "executed": {"dataType":"boolean","required":true},
            "for": {"dataType":"string","required":true},
            "against": {"dataType":"string","required":true},
            "abstain": {"dataType":"string","required":true},
            "voterAddress": {"dataType":"string"},
            "voterVotePower": {"dataType":"string"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginatedList_Proposal_": {
        "dataType": "refObject",
        "properties": {
            "count": {"dataType":"double"},
            "items": {"dataType":"array","array":{"dataType":"refObject","ref":"Proposal"}},
            "limit": {"dataType":"double"},
            "offset": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiDefaultResponseStatusEnum": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["OK"]},{"dataType":"enum","enums":["ERROR"]},{"dataType":"enum","enums":["REQUEST_BODY_ERROR"]},{"dataType":"enum","enums":["VALIDATION_ERROR"]},{"dataType":"enum","enums":["TOO_MANY_REQUESTS"]},{"dataType":"enum","enums":["UNAUTHORIZED"]},{"dataType":"enum","enums":["AUTH_ERROR"]},{"dataType":"enum","enums":["UPSTREAM_HTTP_ERROR"]},{"dataType":"enum","enums":["INVALID_REQUEST"]},{"dataType":"enum","enums":["NOT_IMPLEMENTED"]},{"dataType":"enum","enums":["PENDING"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiValidationErrorDetails": {
        "dataType": "refObject",
        "properties": {
            "className": {"dataType":"string"},
            "fieldErrors": {"dataType":"nestedObjectLiteral","nestedProperties":{},"additionalProperties":{"dataType":"string"}},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_PaginatedList_Proposal__": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"PaginatedList_Proposal_"},
            "errorDetails": {"dataType":"string"},
            "errorMessage": {"dataType":"string"},
            "status": {"ref":"ApiDefaultResponseStatusEnum","required":true},
            "validationErrorDetails": {"ref":"ApiValidationErrorDetails"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SortType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["ASC"]},{"dataType":"enum","enums":["DESC"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProposalSortType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["startTime"]},{"dataType":"enum","enums":["endTime"]},{"dataType":"enum","enums":["votePowerBlock"]},{"dataType":"enum","enums":["contract"]},{"dataType":"enum","enums":["proposalId"]},{"dataType":"enum","enums":["pollingType"]},{"dataType":"enum","enums":["description"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Proposal_": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"Proposal"},
            "errorDetails": {"dataType":"string"},
            "errorMessage": {"dataType":"string"},
            "status": {"ref":"ApiDefaultResponseStatusEnum","required":true},
            "validationErrorDetails": {"ref":"ApiValidationErrorDetails"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContractDeploy": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "contractName": {"dataType":"string","required":true},
            "address": {"dataType":"string","required":true},
            "abi": {"dataType":"any"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_ContractDeploy-Array_": {
        "dataType": "refObject",
        "properties": {
            "data": {"dataType":"array","array":{"dataType":"refObject","ref":"ContractDeploy"}},
            "errorDetails": {"dataType":"string"},
            "errorMessage": {"dataType":"string"},
            "status": {"ref":"ApiDefaultResponseStatusEnum","required":true},
            "validationErrorDetails": {"ref":"ApiValidationErrorDetails"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Vote": {
        "dataType": "refObject",
        "properties": {
            "voter": {"dataType":"string","required":true},
            "proposalId": {"dataType":"string","required":true},
            "support": {"dataType":"double","required":true},
            "weight": {"dataType":"string","required":true},
            "weightFloat": {"dataType":"double","required":true},
            "reason": {"dataType":"string","required":true},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "PaginatedList_Vote_": {
        "dataType": "refObject",
        "properties": {
            "count": {"dataType":"double"},
            "items": {"dataType":"array","array":{"dataType":"refObject","ref":"Vote"}},
            "limit": {"dataType":"double"},
            "offset": {"dataType":"double"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_PaginatedList_Vote__": {
        "dataType": "refObject",
        "properties": {
            "data": {"ref":"PaginatedList_Vote_"},
            "errorDetails": {"dataType":"string"},
            "errorMessage": {"dataType":"string"},
            "status": {"ref":"ApiDefaultResponseStatusEnum","required":true},
            "validationErrorDetails": {"ref":"ApiValidationErrorDetails"},
        },
        "additionalProperties": false,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "VoteSortType": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["weight"]},{"dataType":"enum","enums":["id"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const validationService = new ValidationService(models);

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

export function RegisterRoutes(app: express.Router) {
    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################
        app.get('/api/governance/proposals/list',

            async function GovernanceController_getProposalList(request: any, response: any, next: any) {
            const args = {
                    limit: {"in":"query","name":"limit","dataType":"double"},
                    offset: {"in":"query","name":"offset","dataType":"double"},
                    sort: {"in":"query","name":"sort","ref":"SortType"},
                    sortBy: {"in":"query","name":"sortBy","ref":"ProposalSortType"},
                    pollingContractType: {"in":"query","name":"pollingContractType","ref":"PollingContractType"},
                    contract: {"in":"query","name":"contract","dataType":"string"},
                    description: {"in":"query","name":"description","dataType":"string"},
                    minStartTime: {"in":"query","name":"minStartTime","dataType":"double"},
                    maxStartTime: {"in":"query","name":"maxStartTime","dataType":"double"},
                    minEndTime: {"in":"query","name":"minEndTime","dataType":"double"},
                    maxEndTime: {"in":"query","name":"maxEndTime","dataType":"double"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<GovernanceController>(GovernanceController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getProposalList.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/api/governance/proposals/:proposalId',

            async function GovernanceController_getProposalById(request: any, response: any, next: any) {
            const args = {
                    proposalId: {"in":"path","name":"proposalId","required":true,"dataType":"string"},
                    voterAddress: {"in":"query","name":"voterAddress","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<GovernanceController>(GovernanceController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getProposalById.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/api/governance/deployed-contract-data',

            async function GovernanceController_deployedContractData(request: any, response: any, next: any) {
            const args = {
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<GovernanceController>(GovernanceController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.deployedContractData.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        app.get('/api/governance/votes-for-proposal/:proposalId',

            async function GovernanceController_getVotesForProposal(request: any, response: any, next: any) {
            const args = {
                    proposalId: {"in":"path","name":"proposalId","required":true,"dataType":"string"},
                    limit: {"in":"query","name":"limit","dataType":"double"},
                    offset: {"in":"query","name":"offset","dataType":"double"},
                    sort: {"in":"query","name":"sort","ref":"SortType"},
                    sortBy: {"in":"query","name":"sortBy","ref":"VoteSortType"},
                    voter: {"in":"query","name":"voter","dataType":"string"},
            };

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request, response);

                const container: IocContainer = typeof iocContainer === 'function' ? (iocContainer as IocContainerFactory)(request) : iocContainer;

                const controller: any = await container.get<GovernanceController>(GovernanceController);
                if (typeof controller['setStatus'] === 'function') {
                controller.setStatus(undefined);
                }


              const promise = controller.getVotesForProposal.apply(controller, validatedArgs as any);
              promiseHandler(controller, promise, response, undefined, next);
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function isController(object: any): object is Controller {
        return 'getHeaders' in object && 'getStatus' in object && 'setStatus' in object;
    }

    function promiseHandler(controllerObj: any, promise: any, response: any, successStatus: any, next: any) {
        return Promise.resolve(promise)
            .then((data: any) => {
                let statusCode = successStatus;
                let headers;
                if (isController(controllerObj)) {
                    headers = controllerObj.getHeaders();
                    statusCode = controllerObj.getStatus() || statusCode;
                }

                // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

                returnHandler(response, statusCode, data, headers)
            })
            .catch((error: any) => next(error));
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function returnHandler(response: any, statusCode?: number, data?: any, headers: any = {}) {
        if (response.headersSent) {
            return;
        }
        Object.keys(headers).forEach((name: string) => {
            response.set(name, headers[name]);
        });
        if (data && typeof data.pipe === 'function' && data.readable && typeof data._read === 'function') {
            data.pipe(response);
        } else if (data !== null && data !== undefined) {
            response.status(statusCode || 200).json(data);
        } else {
            response.status(statusCode || 204).end();
        }
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function responder(response: any): TsoaResponse<HttpStatusCodeLiteral, unknown>  {
        return function(status, data, headers) {
            returnHandler(response, status, data, headers);
        };
    };

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    function getValidatedArgs(args: any, request: any, response: any): any[] {
        const fieldErrors: FieldErrors  = {};
        const values = Object.keys(args).map((key) => {
            const name = args[key].name;
            switch (args[key].in) {
                case 'request':
                    return request;
                case 'query':
                    return validationService.ValidateParam(args[key], request.query[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'path':
                    return validationService.ValidateParam(args[key], request.params[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'header':
                    return validationService.ValidateParam(args[key], request.header(name), name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'body':
                    return validationService.ValidateParam(args[key], request.body, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'body-prop':
                    return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, 'body.', {"noImplicitAdditionalProperties":"throw-on-extras"});
                case 'formData':
                    if (args[key].dataType === 'file') {
                        return validationService.ValidateParam(args[key], request.file, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    } else if (args[key].dataType === 'array' && args[key].array.dataType === 'file') {
                        return validationService.ValidateParam(args[key], request.files, name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    } else {
                        return validationService.ValidateParam(args[key], request.body[name], name, fieldErrors, undefined, {"noImplicitAdditionalProperties":"throw-on-extras"});
                    }
                case 'res':
                    return responder(response);
            }
        });

        if (Object.keys(fieldErrors).length > 0) {
            throw new ValidateError(fieldErrors, '');
        }
        return values;
    }

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

import { Body, Controller, Get, Path, Post, Route, Tags } from "tsoa";
import { Factory, Inject, Singleton } from "typescript-ioc";
import { DemoEngine } from "../engines/demoEngine";
import { ApiResponse, handleApiResponse } from "../dto/generic/ApiResponse";
import { ApiUserComment } from "../dto/APIUserComment";

@Tags('Demo')
@Route("api")
@Singleton
@Factory(() => new DemoController())
export class DemoController extends Controller {

    @Inject
    private demoEngine: DemoEngine;

    constructor() {
        super()
    }

    @Get("demo-message")
    public async demoMessage(
    ): Promise<ApiResponse<ApiUserComment>> {
        return handleApiResponse(
            this.demoEngine.dummyUserComment()
        )
    }

    @Post('create')
    public async createUserComment(
        @Body() requestBody: ApiUserComment
    ): Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.demoEngine.creatUserComment(requestBody)
        );
    }    

    @Get("get-comments/{user}")
    public async getUserComments(
        @Path() user: string
    ) : Promise<ApiResponse<any>> {
        return handleApiResponse(
            this.demoEngine.getCommentsForUser(user)
        )
    }    
}